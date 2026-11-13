import { HttpErrorResponse } from '@angular/common/http';

export function mensajeError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const cuerpo = error.error as { mensaje?: string } | string | null;
    if (cuerpo && typeof cuerpo === 'object' && typeof cuerpo.mensaje === 'string') {
      return cuerpo.mensaje;
    }
    if (error.status === 0) {
      return 'No hay conexión con la API. Compruebe que el backend esté en el puerto 3000.';
    }
  }
  return 'No se pudo completar la operación.';
}
