import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Ingresa tu correo electrónico.')
    .email('Incluye un dominio válido, como nombre@correo.com.'),
  password: z
    .string()
    .min(1, 'Ingresa tu contraseña.'),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, 'Escribe tu nombre y apellido (al menos 3 caracteres).')
      .max(100, 'El nombre no puede superar 100 caracteres.'),
    email: z
      .string()
      .trim()
      .min(1, 'Ingresa tu correo electrónico.')
      .email('Incluye un dominio válido, como nombre@correo.com.'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres.')
      .max(72, 'La contraseña es demasiado larga.'),
    confirmPassword: z.string().min(1, 'Repite tu contraseña para confirmarla.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Ingresa el correo asociado a tu cuenta.')
    .email('Incluye un dominio válido, como nombre@correo.com.'),
});

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Usa al menos 8 caracteres para tu nueva contraseña.')
      .max(72, 'La contraseña es demasiado larga.'),
    confirmPassword: z.string().min(1, 'Confirma tu nueva contraseña.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  });

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, 'Escribe tu nombre completo (mínimo 3 caracteres).')
    .max(100, 'Máximo 100 caracteres.'),
  district: z
    .string()
    .trim()
    .min(2, 'Indica tu distrito o zona.')
    .max(80, 'Máximo 80 caracteres.'),
  phone: z
    .string()
    .trim()
    .max(20, 'Teléfono demasiado largo.')
    .optional()
    .or(z.literal('')),
});

export const reportFormSchema = z.object({
  category: z.enum(['hueco', 'vereda', 'senalizacion', 'buzon'], {
    message: 'Selecciona un tipo de problema.',
  }),
  description: z
    .string()
    .trim()
    .min(10, 'Describe el problema y una referencia (mínimo 10 caracteres).')
    .max(1000, 'La descripción no debe superar 1000 caracteres.'),
  riskLevel: z.enum(['bajo', 'medio', 'alto'], {
    message: 'Selecciona el nivel de riesgo percibido.',
  }),
  photoUri: z
    .string()
    .min(1, 'Adjunta una fotografía del problema para continuar.'),
  latitude: z
    .number({ message: 'Indica la ubicación en el mapa o usa el GPS.' })
    .min(-90)
    .max(90),
  longitude: z
    .number({ message: 'Indica la ubicación en el mapa o usa el GPS.' })
    .min(-180)
    .max(180),
  address: z.string().trim().max(200).optional().default(''),
  district: z.string().trim().max(100).optional().default(''),
});

export const adminStatusUpdateSchema = z.object({
  status: z.enum(['recibido', 'en_revision', 'en_atencion', 'resuelto']),
  note: z
    .string()
    .trim()
    .min(5, 'Agrega una observación breve sobre el cambio (mínimo 5 caracteres).')
    .max(400, 'La observación no debe superar 400 caracteres.'),
});

export const deletionConfirmationSchema = z.object({
  confirmationWord: z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      if (val !== 'ELIMINAR') {
        ctx.addIssue({
          code: 'custom',
          message: 'Escribe exactamente la palabra ELIMINAR en mayúsculas.',
        });
      }
    }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;
export type ReportFormValues = z.infer<typeof reportFormSchema>;
export type AdminStatusUpdateValues = z.infer<typeof adminStatusUpdateSchema>;
export type DeletionConfirmationValues = z.infer<typeof deletionConfirmationSchema>;
