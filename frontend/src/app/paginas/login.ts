import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { Api } from '../core/api';
import { mensajeError } from '../core/texto-error';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
})
export class Login {
  private readonly api = inject(Api);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly error = signal('');
  readonly enviando = signal(false);
  readonly formulario = this.fb.nonNullable.group({
    nombreUsuario: ['', Validators.required],
    contrasena: ['', Validators.required],
  });

  constructor() {
    if (this.auth.autenticado()) {
      void this.router.navigateByUrl('/inicio');
    }
  }

  entrar(): void {
    this.error.set('');
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.error.set('Escriba el usuario y la contraseña.');
      return;
    }
    const { nombreUsuario, contrasena } = this.formulario.getRawValue();
    this.enviando.set(true);
    this.api.login(nombreUsuario, contrasena).subscribe({
      next: (respuesta) => {
        this.auth.entrar(respuesta);
        this.enviando.set(false);
        void this.router.navigateByUrl('/inicio');
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.error.set(mensajeError(error));
      },
    });
  }
}
