import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { Cliente, nombreCliente, normalizar, soloFecha } from '../core/modelos';
import { mensajeError } from '../core/texto-error';
import { Avisos } from '../ui/avisos';
import { Confirmacion } from '../ui/confirmacion';
import { Paginador, paginar } from '../ui/paginador';

type FiltroEstado = 'todos' | 'activos' | 'inactivos';

@Component({
  selector: 'app-clientes',
  imports: [FormsModule, RouterLink, Paginador],
  templateUrl: './clientes.html',
})
export class Clientes {
  private readonly api = inject(Api);
  private readonly avisos = inject(Avisos);
  private readonly confirmacion = inject(Confirmacion);
  readonly soloFecha = soloFecha;
  readonly nombreCliente = nombreCliente;
  readonly clientes = signal<Cliente[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly texto = signal('');
  readonly estado = signal<FiltroEstado>('todos');
  readonly pagina = signal(1);

  readonly filtrados = computed(() => {
    const texto = normalizar(this.texto().trim());
    const estado = this.estado();
    return this.clientes().filter((cliente) => {
      if (estado === 'activos' && !cliente.activo) return false;
      if (estado === 'inactivos' && cliente.activo) return false;
      if (!texto) return true;
      const campos = `${cliente.codigo} ${cliente.identificacion} ${cliente.nombres} ${cliente.apellidos} ${cliente.correo}`;
      return normalizar(campos).includes(texto);
    });
  });
  readonly visibles = computed(() => paginar(this.filtrados(), this.pagina()));
  readonly hayFiltros = computed(() => !!this.texto().trim() || this.estado() !== 'todos');

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.api.clientes().subscribe({
      next: (lista) => {
        this.clientes.set(lista);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(mensajeError(error));
        this.cargando.set(false);
      },
    });
  }

  filtrarTexto(valor: string): void {
    this.texto.set(valor);
    this.pagina.set(1);
  }

  filtrarEstado(valor: FiltroEstado): void {
    this.estado.set(valor);
    this.pagina.set(1);
  }

  limpiar(): void {
    this.texto.set('');
    this.estado.set('todos');
    this.pagina.set(1);
  }

  async cambiarActivo(cliente: Cliente): Promise<void> {
    const desactivar = cliente.activo;
    const confirmado = await this.confirmacion.pedir(
      desactivar
        ? {
            titulo: 'Desactivar cliente',
            mensaje: 'Sus cuentas no podrán operar mientras el cliente esté inactivo. La ficha y el historial se conservan.',
            detalle: [
              { etiqueta: 'Cliente', valor: nombreCliente(cliente) },
              { etiqueta: 'Código', valor: cliente.codigo },
            ],
            confirmar: 'Desactivar',
            peligro: true,
          }
        : {
            titulo: 'Activar cliente',
            mensaje: 'El cliente y sus cuentas activas podrán operar de nuevo.',
            detalle: [
              { etiqueta: 'Cliente', valor: nombreCliente(cliente) },
              { etiqueta: 'Código', valor: cliente.codigo },
            ],
            confirmar: 'Activar',
          },
    );
    if (!confirmado) {
      return;
    }
    const solicitud = desactivar ? this.api.desactivarCliente(cliente.id) : this.api.activarCliente(cliente.id);
    solicitud.subscribe({
      next: (actualizado) => {
        this.clientes.update((lista) => lista.map((item) => (item.id === actualizado.id ? actualizado : item)));
        this.avisos.mostrar(desactivar ? `Cliente ${cliente.codigo} desactivado.` : `Cliente ${cliente.codigo} activado.`);
      },
      error: (error: unknown) => this.avisos.mostrar(mensajeError(error), 'error'),
    });
  }
}
