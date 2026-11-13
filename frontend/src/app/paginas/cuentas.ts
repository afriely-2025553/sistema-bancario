import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { Cuenta, moneda, normalizar, soloFecha } from '../core/modelos';
import { mensajeError } from '../core/texto-error';
import { Paginador, paginar } from '../ui/paginador';

@Component({
  selector: 'app-cuentas',
  imports: [FormsModule, RouterLink, Paginador],
  templateUrl: './cuentas.html',
})
export class Cuentas {
  private readonly api = inject(Api);
  readonly moneda = moneda;
  readonly soloFecha = soloFecha;
  readonly cuentas = signal<Cuenta[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly texto = signal('');
  readonly estado = signal<'todas' | 'activa' | 'inactiva'>('todas');
  readonly tipo = signal('');
  readonly pagina = signal(1);

  readonly tipos = computed(() => [...new Set(this.cuentas().map((cuenta) => cuenta.tipoCuenta))].sort());
  readonly filtradas = computed(() => {
    const texto = normalizar(this.texto().trim());
    return this.cuentas().filter((cuenta) => {
      if (this.estado() !== 'todas' && cuenta.estado !== this.estado()) return false;
      if (this.tipo() && cuenta.tipoCuenta !== this.tipo()) return false;
      if (!texto) return true;
      return normalizar(`${cuenta.numeroCuenta} ${cuenta.clienteCodigo} ${cuenta.clienteNombre}`).includes(texto);
    });
  });
  readonly visibles = computed(() => paginar(this.filtradas(), this.pagina()));
  readonly saldoFiltrado = computed(() => this.filtradas().reduce((total, cuenta) => total + cuenta.saldo, 0));
  readonly hayFiltros = computed(() => !!this.texto().trim() || this.estado() !== 'todas' || !!this.tipo());

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.api.cuentas().subscribe({
      next: (lista) => {
        this.cuentas.set(lista);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(mensajeError(error));
        this.cargando.set(false);
      },
    });
  }

  filtrar(campo: 'texto' | 'estado' | 'tipo', valor: string): void {
    if (campo === 'texto') this.texto.set(valor);
    if (campo === 'estado') this.estado.set(valor as 'todas' | 'activa' | 'inactiva');
    if (campo === 'tipo') this.tipo.set(valor);
    this.pagina.set(1);
  }

  limpiar(): void {
    this.texto.set('');
    this.estado.set('todas');
    this.tipo.set('');
    this.pagina.set(1);
  }
}
