import { z } from 'zod';
import { ErrorApp } from './errors';

export function leerCuerpo<T>(esquema: z.ZodType<T>, cuerpo: unknown): T {
  const resultado = esquema.safeParse(cuerpo);
  if (!resultado.success) {
    throw new ErrorApp(
      400,
      resultado.error.issues[0]?.message || 'Los datos no son válidos.',
      'DATOS_INVALIDOS',
    );
  }
  return resultado.data;
}

const opcionalTexto = (max: number) =>
  z
    .union([z.string().trim().max(max), z.literal(''), z.null()])
    .optional()
    .transform((valor) => (valor ? valor : null));

export const esquemaCliente = z.object({
  identificacion: z
    .string({ required_error: 'La identificación es obligatoria.' })
    .trim()
    .min(5, 'La identificación debe tener al menos 5 caracteres.')
    .max(30, 'La identificación admite como máximo 30 caracteres.')
    .regex(/^[A-Za-z0-9-]+$/, 'La identificación solo admite letras, números y guion.'),
  nombres: z
    .string({ required_error: 'Los nombres son obligatorios.' })
    .trim()
    .min(2, 'Los nombres deben tener al menos 2 caracteres.')
    .max(80),
  apellidos: z
    .string({ required_error: 'Los apellidos son obligatorios.' })
    .trim()
    .min(2, 'Los apellidos deben tener al menos 2 caracteres.')
    .max(80),
  fechaNacimiento: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe usar el formato AAAA-MM-DD.'), z.literal(''), z.null()])
    .optional()
    .transform((valor) => (valor ? valor : null)),
  telefono: opcionalTexto(20),
  correo: z
    .string({ required_error: 'El correo es obligatorio.' })
    .trim()
    .email('El correo no es válido.')
    .max(150),
  direccion: opcionalTexto(255),
});

export type DatosCliente = z.infer<typeof esquemaCliente>;

export const esquemaEstadoCuenta = z.object({
  estado: z.enum(['activa', 'inactiva'], {
    errorMap: () => ({ message: 'El estado debe ser activa o inactiva.' }),
  }),
});

export const esquemaCuentaNueva = z.object({
  clienteId: z.number({ required_error: 'El cliente es obligatorio.', invalid_type_error: 'El cliente es obligatorio.' }).int().positive('El cliente es obligatorio.'),
  tipoCuentaId: z
    .number({ required_error: 'El tipo de cuenta es obligatorio.', invalid_type_error: 'El tipo de cuenta es obligatorio.' })
    .int()
    .positive('El tipo de cuenta es obligatorio.'),
});

export function leerMonto(valor: unknown): string {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) {
    throw new ErrorApp(400, 'El monto debe ser un número.', 'MONTO_INVALIDO');
  }
  if (valor <= 0) {
    throw new ErrorApp(400, 'El monto debe ser mayor que cero.', 'MONTO_NO_POSITIVO');
  }
  const centavos = Math.round(valor * 100);
  if (Math.abs(valor * 100 - centavos) > 1e-6) {
    throw new ErrorApp(400, 'El monto admite como máximo dos decimales.', 'MONTO_DECIMALES');
  }
  if (centavos > 100_000_000) {
    throw new ErrorApp(400, 'El monto supera el límite académico de 1000000.00.', 'MONTO_LIMITE');
  }
  return (centavos / 100).toFixed(2);
}

export function aCentavos(valor: unknown): number {
  return Math.round(Number(valor) * 100);
}
