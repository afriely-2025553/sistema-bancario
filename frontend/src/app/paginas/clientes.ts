import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { Cliente, fecha } from '../core/modelos';
import { mensajeError } from '../core/texto-error';

@Component({
  selector: 'app-clientes',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './clientes.html',
})
export class Clientes {
  private readonly api = inject(Api);
  private readonly fb = inject(FormBuilder);
  readonly fecha = fecha;
  readonly clientes = signal<Cliente[]>([]);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly busqueda = this.fb.nonNullable.group({ q: [''] });

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.error.set('');
    this.api.clientes(this.busqueda.getRawValue().q.trim()).subscribe({
      next: (lista) => this.clientes.set(lista),
      error: (error: unknown) => this.error.set(mensajeError(error)),
    });
  }

  cambiarActivo(cliente: Cliente): void {
    const accion = cliente.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿Confirma ${accion} a ${cliente.codigo}? El historial se conserva.`)) {
      return;
    }
    const solicitud = cliente.activo
      ? this.api.desactivarCliente(cliente.id)
      : this.api.activarCliente(cliente.id);
    solicitud.subscribe({
      next: () => {
        this.mensaje.set(cliente.activo ? 'Cliente desactivado.' : 'Cliente activado.');
        this.cargar();
      },
      error: (error: unknown) => this.error.set(mensajeError(error)),
    });
  }
}
