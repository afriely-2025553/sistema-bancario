import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-no-encontrada',
  imports: [RouterLink],
  template: `
    <section class="panel estado-vacio">
      <strong>Página no encontrada</strong>
      <span>La dirección no existe o el registro fue movido.</span>
      <a class="boton" routerLink="/inicio">Ir al inicio</a>
    </section>
  `,
})
export class NoEncontrada {}
