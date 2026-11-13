import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Devuelve el primer mensaje del control solo cuando el usuario ya interactuó con él. */
export function errorDe(control: AbstractControl | null, mensajes: Record<string, string>): string {
  if (!control || !control.errors || !(control.touched || control.dirty)) {
    return '';
  }
  const clave = Object.keys(control.errors).find((nombre) => mensajes[nombre]);
  return clave ? mensajes[clave] : '';
}

/** Monto positivo, con dos decimales como máximo y dentro del límite por operación. */
export const validarMonto: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const texto = String(control.value ?? '').trim();
  if (!texto) {
    return null;
  }
  const valor = Number(texto);
  if (!Number.isFinite(valor)) {
    return { numero: true };
  }
  if (valor <= 0) {
    return { positivo: true };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(texto)) {
    return { decimales: true };
  }
  if (valor > 1_000_000) {
    return { limite: true };
  }
  return null;
};

export const noFutura: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor = String(control.value ?? '');
  if (!valor) {
    return null;
  }
  return new Date(`${valor}T00:00:00`) > new Date() ? { futura: true } : null;
};

export const MENSAJES_MONTO: Record<string, string> = {
  required: 'Indique el monto.',
  numero: 'Escriba un monto válido.',
  positivo: 'El monto debe ser mayor que cero.',
  decimales: 'Use como máximo dos decimales.',
  limite: 'El límite por operación es Q 1,000,000.00.',
  saldo: 'El monto supera el saldo disponible.',
};
