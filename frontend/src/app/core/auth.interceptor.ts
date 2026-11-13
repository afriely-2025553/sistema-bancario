import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();
  const solicitud = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(solicitud).pipe(
    catchError((error: unknown) => {
      const estado = (error as { status?: number }).status;
      const esLogin = req.url.includes('/auth/login');
      if (estado === 401 && !esLogin) {
        auth.salir();
        void router.navigateByUrl('/login');
      }
      return throwError(() => error);
    }),
  );
};
