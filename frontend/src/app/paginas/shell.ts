import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Api } from '../core/api';
import { AuthService } from '../core/auth.service';
import { etiquetaRol } from '../core/modelos';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
})
export class Shell {
  readonly auth = inject(AuthService);
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  readonly etiquetaRol = etiquetaRol;

  salir(): void {
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
