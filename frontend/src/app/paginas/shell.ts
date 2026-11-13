import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Api } from '../core/api';
import { AuthService } from '../core/auth.service';
import { etiquetaRol } from '../core/modelos';
import { Avisos } from '../ui/avisos';
import { Confirmacion } from '../ui/confirmacion';
import { DialogoConfirmacion } from '../ui/dialogo-confirmacion';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DialogoConfirmacion],
  templateUrl: './shell.html',
})
export class Shell {
  readonly auth = inject(AuthService);
  readonly avisos = inject(Avisos);
  private readonly confirmacion = inject(Confirmacion);
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  readonly etiquetaRol = etiquetaRol;
  readonly menuAbierto = signal(false);
  readonly enlaces = [
    { ruta: '/inicio', texto: 'Inicio' },
    { ruta: '/clientes', texto: 'Clientes' },
    { ruta: '/cuentas', texto: 'Cuentas' },
    { ruta: '/operaciones', texto: 'Operaciones' },
    { ruta: '/movimientos', texto: 'Movimientos' },
    { ruta: '/consultas', texto: 'Consultas' },
    { ruta: '/reporte', texto: 'Reporte' },
  ];

  constructor() {
    this.router.events.pipe(filter((evento) => evento instanceof NavigationEnd)).subscribe(() => {
      this.menuAbierto.set(false);
      document.getElementById('contenido')?.focus({ preventScroll: true });
    });
  }

  async salir(): Promise<void> {
    const confirmado = await this.confirmacion.pedir({
      titulo: 'Cerrar sesión',
      mensaje: '¿Desea cerrar la sesión actual?',
      confirmar: 'Cerrar sesión',
    });
    if (!confirmado) {
      return;
    }
    this.api.logout().subscribe({
      next: () => this.cerrar(),
      error: () => this.cerrar(),
    });
  }

  private cerrar(): void {
    this.auth.salir();
    void this.router.navigateByUrl('/login');
  }
}
