import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { mensajeError } from '../core/texto-error';

@Component({
  selector: 'app-cliente-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cliente-form.html',
})
export class ClienteForm {
  private readonly api = inject(Api);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly id = signal<number | null>(null);
  readonly error = signal('');
  readonly enviando = signal(false);
  readonly formulario = this.fb.nonNullable.group({
    identificacion: ['', [Validators.required, Validators.minLength(5), Validators.pattern(/^[A-Za-z0-9-]+$/)]],
    nombres: ['', [Validators.required, Validators.minLength(2)]],
    apellidos: ['', [Validators.required, Validators.minLength(2)]],
    fechaNacimiento: [''],
    telefono: [''],
    correo: ['', [Validators.required, Validators.email]],
    direccion: [''],
  });

  constructor() {
    const param = this.ruta.snapshot.paramMap.get('id');
    if (param) {
      const id = Number(param);
      this.id.set(id);
      this.api.cliente(id).subscribe({
        next: (cliente) => {
          this.formulario.patchValue({
            identificacion: cliente.identificacion,
            nombres: cliente.nombres,
            apellidos: cliente.apellidos,
            fechaNacimiento: cliente.fechaNacimiento ?? '',
            telefono: cliente.telefono ?? '',
            correo: cliente.correo,
            direccion: cliente.direccion ?? '',
          });
        },
        error: (error: unknown) => this.error.set(mensajeError(error)),
      });
    }
  }

  guardar(): void {
    this.error.set('');
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.error.set('Revise los campos obligatorios.');
      return;
    }
    const valor = this.formulario.getRawValue();
    const datos = {
      identificacion: valor.identificacion.trim(),
      nombres: valor.nombres.trim(),
      apellidos: valor.apellidos.trim(),
      fechaNacimiento: valor.fechaNacimiento || null,
      telefono: valor.telefono.trim() || null,
      correo: valor.correo.trim(),
      direccion: valor.direccion.trim() || null,
    };
    this.enviando.set(true);
    const id = this.id();
    const solicitud = id ? this.api.actualizarCliente(id, datos) : this.api.crearCliente(datos);
    solicitud.subscribe({
      next: () => {
        this.enviando.set(false);
        void this.router.navigateByUrl('/clientes');
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.error.set(mensajeError(error));
      },
    });
  }
}
