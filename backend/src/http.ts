import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ErrorApp } from './errors';

export function envolver(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

export function manejadorErrores(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof ErrorApp) {
    res.status(error.estado).json({ mensaje: error.message, codigo: error.codigo });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({
      mensaje: error.issues[0]?.message || 'Los datos no son válidos.',
      codigo: 'DATOS_INVALIDOS',
    });
    return;
  }
  console.error(error);
  res.status(500).json({
    mensaje: 'Ocurrió un error interno. La operación no se confirmó.',
    codigo: 'ERROR_INTERNO',
  });
}

export function enteroPositivo(valor: string, etiqueta: string): number {
  if (!/^\d+$/.test(valor)) {
    throw new ErrorApp(400, `${etiqueta} no es válido.`, 'ID_INVALIDO');
  }
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero) || numero <= 0) {
    throw new ErrorApp(400, `${etiqueta} no es válido.`, 'ID_INVALIDO');
  }
  return numero;
}

export function dinero(valor: unknown): number {
  const numero = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isFinite(numero)) {
    return 0;
  }
  return Math.round(numero * 100) / 100;
}

export function bandera(valor: unknown): boolean {
  return valor === true || valor === 1 || valor === '1';
}

export function codigoTemporal(prefijo: string): string {
  return `${prefijo}${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}
