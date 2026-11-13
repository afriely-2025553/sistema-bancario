import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { Cliente, hoyIso, nombreCliente } from '../core/modelos';
import { mensajeError } from '../core/texto-error';
import { Avisos } from '../ui/avisos';
import { errorDe, noFutura } from '../ui/validacion';

const MENSAJES: Record<string, Record<string, string>> = {
  identificacion: {
    required: 'Escriba el número de identificación.',
    minlength: 'Debe tener al menos 5 caracteres.',
    maxlength: 'Admite como máximo 30 caracteres.',
    pattern: 'Use solo letras, números y guion, sin espacios.',
  },
  nombres: { required: 'Escriba los nombres.', minlength: 'Debe tener al menos 2 caracteres.', maxlength: 'Admite como máximo 80 caracteres.' },
  apellidos: { required: 'Escriba los apellidos.', minlength: 'Debe tener al menos 2 caracteres.', maxlength: 'Admite como máximo 80 caracteres.' },
  correo: { required: 'Escriba el correo electrónico.', email: 'Escriba un correo válido, por ejemplo nombre@dominio.com.', maxlength: 'Admite como máximo 150 caracteres.' },
  telefono: { pattern: 'Use 8 dígitos; puede incluir un guion o espacio.' },
  fechaNacimiento: { futura: 'La fecha no puede ser posterior a hoy.' },
  direccion: { maxlength: 'Admite como máximo 255 caracteres.' },
};

@Component({
  selector: 'app-cliente-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cliente-form.html',
})
export class ClienteForm {
  private readonly api = inject(Api);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly avisos = inject(Avisos);
  private readonly fb = inject(FormBuilder);

  readonly id = signal<number | null>(null);
  readonly cliente = signal<Cliente | null>(null);
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly enviando = signal(false);
  readonly hoy = hoyIso();
  readonly nombreCliente = nombreCliente;
  readonly formulario = this.fb.nonNullable.group({
    identificacion: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(30), Validators.pattern(/^[A-Za-z0-9-]+$/)]],
    nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    fechaNacimiento: ['', [noFutura]],
    telefono: ['', [Validators.pattern(/^\d{4}[- ]?\d{4}$/)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    direccion: ['', [Validators.maxLength(255)]],
  });

  constructor() {
    const param = this.ruta.snapshot.paramMap.get('id');
    if (param) {
      const id = Number(param);
      this.id.set(id);
      this.cargando.set(true);
      this.api.cliente(id).subscribe({
        next: (cliente) => {
          this.cliente.set(cliente);
          this.formulario.patchValue({
            identificacion: cliente.identificacion,
            nombres: cliente.nombres,
            apellidos: cliente.apellidos,
            fechaNacimiento: cliente.fechaNacimiento ?? '',
            telefono: cliente.telefono ?? '',
            correo: cliente.correo,
            direccion: cliente.direccion ?? '',
          });
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mensajeError(error));
          this.cargando.set(false);
        },
      });
    }
  }

  errorCampo(nombre: string): string {
    return errorDe(this.formulario.get(nombre), MENSAJES[nombre] ?? {});
  }

  volver(): string[] {
    const id = this.id();
    return id ? ['/clientes', String(id)] : ['/clientes'];
  }

  guardar(): void {
    this.error.set('');
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.error.set('Revise los campos marcados.');
      const primero = document.querySelector<HTMLElement>('form [aria-invalid="true"]');
      primero?.focus();
      return;
    }
    const valor = this.formulario.getRawValue();
    const datos = {
      identificacion: valor.identificacion.trim().toUpperCase(),
      nombres: valor.nombres.trim(),
      apellidos: valor.apellidos.trim(),
      fechaNacimiento: valor.fechaNacimiento || null,
      telefono: valor.telefono.trim() || null,
      correo: valor.correo.trim().toLowerCase(),
      direccion: valor.direccion.trim() || null,
    };
    this.enviando.set(true);
    const id = this.id();
    const solicitud = id ? this.api.actualizarCliente(id, datos) : this.api.crearCliente(datos);
    solicitud.subscribe({
      next: (cliente) => {
        this.enviando.set(false);
        this.avisos.mostrar(id ? 'Cambios guardados.' : `Cliente ${cliente.codigo} registrado.`);
        void this.router.navigate(['/clientes', cliente.id]);
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.error.set(mensajeError(error));
      },
    });
  }
}
