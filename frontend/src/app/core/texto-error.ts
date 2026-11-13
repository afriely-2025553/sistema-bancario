import { HttpErrorResponse } from '@angular/common/http';

export function mensajeError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const cuerpo = error.error as { mensaje?: string } | string | null;
    if (cuerpo && typeof cuerpo === 'object' && typeof cuerpo.mensaje === 'string') {
      return cuerpo.mensaje;
    }
    // 0: el navegador no llegó a la API; 502-504: el proxy de Angular no encontró el backend.
    if (error.status === 0 || error.status === 502 || error.status === 503 || error.status === 504) {
      return 'No se pudo conectar con el servidor. Verifique que la API esté en ejecución e intente de nuevo.';
    }
  }
  return 'No se pudo completar la operación. Intente de nuevo.';
}
