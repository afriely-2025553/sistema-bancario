import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { Api } from '../core/api';
import { mensajeError } from '../core/texto-error';
import { errorDe } from '../ui/validacion';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
})
export class Login {
  private readonly api = inject(Api);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly error = signal('');
  readonly enviando = signal(false);
  readonly verContrasena = signal(false);
  readonly mayusculas = signal(false);
  readonly sesionExpirada = this.ruta.snapshot.queryParamMap.get('sesion') === 'expirada';
  readonly anio = new Date().getFullYear();
  readonly formulario = this.fb.nonNullable.group({
    nombreUsuario: ['', Validators.required],
    contrasena: ['', Validators.required],
  });

  constructor() {
    if (this.auth.autenticado()) {
      void this.router.navigateByUrl('/inicio');
    }
  }

  errorUsuario(): string {
    return errorDe(this.formulario.controls.nombreUsuario, { required: 'Escriba su usuario.' });
  }

  errorContrasena(): string {
    return errorDe(this.formulario.controls.contrasena, { required: 'Escriba su contraseña.' });
  }

  revisarMayusculas(evento: KeyboardEvent): void {
    this.mayusculas.set(evento.getModifierState?.('CapsLock') ?? false);
  }

  entrar(): void {
    this.error.set('');
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { nombreUsuario, contrasena } = this.formulario.getRawValue();
    this.enviando.set(true);
    this.api.login(nombreUsuario.trim(), contrasena).subscribe({
      next: (respuesta) => {
        this.auth.entrar(respuesta);
        this.enviando.set(false);
        const volver = this.ruta.snapshot.queryParamMap.get('volver');
        void this.router.navigateByUrl(volver && volver.startsWith('/') ? volver : '/inicio');
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.formulario.controls.contrasena.reset('');
        this.error.set(mensajeError(error));
      },
    });
  }
}
