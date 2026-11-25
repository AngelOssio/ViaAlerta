import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Linking from 'expo-linking';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type {
  DeletionRequest,
  NotificationPreferences,
  Profile,
  UserRole,
} from '../types/domain';
import { useAccessibility } from './AccessibilityContext';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  isAdmin: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  sessionExpiredMessage: string | null;
  pendingDeletion: DeletionRequest | null;
  notificationPrefs: NotificationPreferences;
  passwordRecoveryMode: boolean;
  clearSessionExpiredMessage: () => void;
  clearPasswordRecoveryMode: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: {
    fullName: string;
    email: string;
    password: string;
  }) => Promise<{ requiresEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshAccountData: () => Promise<void>;
}

const DEFAULT_NOTIF_PREFS: NotificationPreferences = {
  notifyReportUpdates: true,
  notifyEmailConfirmations: true,
};

const AuthContext = createContext<AuthContextValue | null>(null);

function parseAuthParamsFromUrl(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const parts = url.split(/[?#]/).slice(1);
  for (const part of parts) {
    for (const pair of part.split('&')) {
      const [k, v] = pair.split('=');
      if (k && v) {
        params[decodeURIComponent(k)] = decodeURIComponent(v);
      }
    }
  }
  return params;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { updatePrefs } = useAccessibility();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>('ciudadano');
  const [pendingDeletion, setPendingDeletion] = useState<DeletionRequest | null>(null);
  const [notificationPrefs, setNotificationPrefs] =
    useState<NotificationPreferences>(DEFAULT_NOTIF_PREFS);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(false);

  const loadAccountData = useCallback(
    async (userId: string) => {
      if (!isSupabaseConfigured) return;

      const [profileRes, roleRes, prefsRes, deletionRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
        supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
        supabase
          .from('account_deletion_requests')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data as Profile);
      }
      if (roleRes.data?.role === 'admin') {
        setRole('admin');
      } else {
        setRole('ciudadano');
      }
      if (deletionRes.data) {
        setPendingDeletion(deletionRes.data as DeletionRequest);
      } else {
        setPendingDeletion(null);
      }
      if (prefsRes.data) {
        setNotificationPrefs({
          notifyReportUpdates: Boolean(prefsRes.data.notify_report_updates),
          notifyEmailConfirmations: Boolean(prefsRes.data.notify_email_confirmations),
        });
        const serverScale = Number(prefsRes.data.text_scale);
        if ([1, 1.25, 1.5, 2].includes(serverScale)) {
          updatePrefs({
            textScale: serverScale as 1 | 1.25 | 1.5 | 2,
            highContrast: Boolean(prefsRes.data.high_contrast),
            largeControls: Boolean(prefsRes.data.large_controls),
            reduceMotion: Boolean(prefsRes.data.reduce_motion),
          }).catch(() => {});
        }
      }
    },
    [updatePrefs]
  );

  // Manejo de enlaces profundos de Supabase Auth (verificación de correo y recuperación)
  const handleDeepLink = useCallback(async (url: string | null) => {
    if (!url || !isSupabaseConfigured) return;
    const params = parseAuthParamsFromUrl(url);
    if (params.access_token && params.refresh_token) {
      await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (params.type === 'recovery' || url.includes('reset-password')) {
        setPasswordRecoveryMode(true);
      }
    } else if (params.code) {
      await supabase.auth.exchangeCodeForSession(params.code);
      if (url.includes('reset-password')) {
        setPasswordRecoveryMode(true);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;

    if (!isSupabaseConfigured) {
      return;
    }

    supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (!active) return;
        if (error) {
          setSession(null);
          setProfile(null);
          setRole('ciudadano');
        } else {
          setSession(data.session ?? null);
          if (data.session?.user) {
            await loadAccountData(data.session.user.id);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    Linking.getInitialURL().then(handleDeepLink).catch(() => {});
    const linkSub = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url).catch(() => {});
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryMode(true);
      }
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setRole('ciudadano');
        setPendingDeletion(null);
        setNotificationPrefs(DEFAULT_NOTIF_PREFS);
      } else if (nextSession?.user) {
        loadAccountData(nextSession.user.id).catch(() => {});
      }
    });

    return () => {
      active = false;
      linkSub.remove();
      subscription.unsubscribe();
    };
  }, [handleDeepLink, loadAccountData]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase no configurado en .env');
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      if (data.user) {
        await loadAccountData(data.user.id);
      }
      setSessionExpiredMessage(null);
    },
    [loadAccountData]
  );

  const signUp = useCallback(
    async ({ fullName, email, password }: { fullName: string; email: string; password: string }) => {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase no configurado en .env');
      }
      const redirectTo = Linking.createURL('auth/callback');
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: fullName.trim(),
          },
        },
      });
      if (error) throw error;
      if (data.session?.user) {
        await loadAccountData(data.session.user.id);
      }
      return { requiresEmailConfirmation: !data.session };
    },
    [loadAccountData]
  );

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setProfile(null);
    setRole('ciudadano');
    setPendingDeletion(null);
    setPasswordRecoveryMode(false);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase no configurado en .env');
    }
    const redirectTo = Linking.createURL('auth/reset-password');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase no configurado en .env');
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    setPasswordRecoveryMode(false);
  }, []);

  const refreshAccountData = useCallback(async () => {
    if (session?.user?.id) {
      await loadAccountData(session.user.id);
    }
  }, [session, loadAccountData]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role,
      isAdmin: role === 'admin',
      isAuthenticated: Boolean(session?.user),
      loading,
      sessionExpiredMessage,
      pendingDeletion,
      notificationPrefs,
      passwordRecoveryMode,
      clearSessionExpiredMessage: () => setSessionExpiredMessage(null),
      clearPasswordRecoveryMode: () => setPasswordRecoveryMode(false),
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      updatePassword,
      refreshAccountData,
    }),
    [
      session,
      profile,
      role,
      loading,
      sessionExpiredMessage,
      pendingDeletion,
      notificationPrefs,
      passwordRecoveryMode,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      updatePassword,
      refreshAccountData,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
