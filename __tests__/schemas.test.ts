import {
  adminStatusUpdateSchema,
  deletionConfirmationSchema,
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  reportFormSchema,
  updatePasswordSchema,
} from '../src/validation/schemas';

describe('Validaciones de formularios de VíaAlerta', () => {
  test('loginSchema valida credenciales correctas y rechaza correo inválido', () => {
    expect(
      loginSchema.safeParse({ email: 'angel@correo.com', password: 'Password123' }).success
    ).toBe(true);

    const invalid = loginSchema.safeParse({ email: 'angel-sin-dominio', password: '' });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.issues.length).toBeGreaterThanOrEqual(2);
    }
  });

  test('registerSchema exige mínimo 8 caracteres y coincidencia de contraseñas', () => {
    const mismatch = registerSchema.safeParse({
      fullName: 'Angel Ossio',
      email: 'angel@correo.com',
      password: 'Password123',
      confirmPassword: 'Password999',
    });
    expect(mismatch.success).toBe(false);

    const shortPass = registerSchema.safeParse({
      fullName: 'Angel Ossio',
      email: 'angel@correo.com',
      password: '123',
      confirmPassword: '123',
    });
    expect(shortPass.success).toBe(false);

    const valid = registerSchema.safeParse({
      fullName: 'Angel Ossio',
      email: 'angel@correo.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    });
    expect(valid.success).toBe(true);
  });

  test('reportFormSchema exige foto, ubicación, descripción >= 10 caracteres y riesgo', () => {
    const incomplete = reportFormSchema.safeParse({
      category: 'hueco',
      description: 'Corto',
      riskLevel: 'alto',
      photoUri: '',
      latitude: undefined,
      longitude: undefined,
    });
    expect(incomplete.success).toBe(false);

    const complete = reportFormSchema.safeParse({
      category: 'hueco',
      description: 'Hueco profundo frente al paradero que dificulta el tránsito vehicular.',
      riskLevel: 'alto',
      photoUri: 'file:///tmp/bache.jpg',
      latitude: -11.9765,
      longitude: -76.7689,
      address: 'Av. Nicolás Ayllón',
      district: 'Chaclacayo, Lima',
    });
    expect(complete.success).toBe(true);
  });

  test('adminStatusUpdateSchema exige observación mínima y estado válido', () => {
    expect(
      adminStatusUpdateSchema.safeParse({ status: 'en_atencion', note: 'ok' }).success
    ).toBe(false);

    expect(
      adminStatusUpdateSchema.safeParse({
        status: 'en_atencion',
        note: 'Cuadrilla asignada para revisión técnica en campo.',
      }).success
    ).toBe(true);
  });

  test('deletionConfirmationSchema exige exactamente la palabra ELIMINAR en mayúsculas', () => {
    expect(deletionConfirmationSchema.safeParse({ confirmationWord: 'eliminar' }).success).toBe(false);
    expect(deletionConfirmationSchema.safeParse({ confirmationWord: 'BORRAR' }).success).toBe(false);
    expect(deletionConfirmationSchema.safeParse({ confirmationWord: 'ELIMINAR' }).success).toBe(true);
  });

  test('forgotPasswordSchema, updatePasswordSchema y profileSchema validan correctamente', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'usuario@dominio.pe' }).success).toBe(true);
    expect(
      updatePasswordSchema.safeParse({ password: 'NuevaClave123', confirmPassword: 'NuevaClave123' })
        .success
    ).toBe(true);
    expect(
      profileSchema.safeParse({ fullName: 'María Pérez', district: 'Chaclacayo, Lima', phone: '' })
        .success
    ).toBe(true);
  });
});
