import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_ruta, estado) => {
  const auth = inject(AuthService);
  if (auth.autenticado()) {
    return true;
  }
  const volver = estado.url && estado.url !== '/' ? { volver: estado.url } : {};
  return inject(Router).createUrlTree(['/login'], { queryParams: volver });
};
