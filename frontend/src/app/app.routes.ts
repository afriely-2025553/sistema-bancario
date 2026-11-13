import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { ClienteDetalle } from './paginas/cliente-detalle';
import { ClienteForm } from './paginas/cliente-form';
import { Clientes } from './paginas/clientes';
import { Consultas } from './paginas/consultas';
import { CuentaDetalle } from './paginas/cuenta-detalle';
import { CuentaForm } from './paginas/cuenta-form';
import { Cuentas } from './paginas/cuentas';
import { Inicio } from './paginas/inicio';
import { Login } from './paginas/login';
import { Movimientos } from './paginas/movimientos';
import { NoEncontrada } from './paginas/no-encontrada';
import { Operaciones } from './paginas/operaciones';
import { ReportePagina } from './paginas/reporte';
import { Shell } from './paginas/shell';

const titulo = (texto: string) => `${texto} · Banco Ceiba`;

export const routes: Routes = [
  { path: 'login', component: Login, title: titulo('Iniciar sesión') },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      { path: 'inicio', component: Inicio, title: titulo('Inicio') },
      { path: 'clientes/nuevo', component: ClienteForm, title: titulo('Registrar cliente') },
      { path: 'clientes/:id/editar', component: ClienteForm, title: titulo('Editar cliente') },
      { path: 'clientes/:id', component: ClienteDetalle, title: titulo('Ficha del cliente') },
      { path: 'clientes', component: Clientes, title: titulo('Clientes') },
      { path: 'cuentas/nueva', component: CuentaForm, title: titulo('Abrir cuenta') },
      { path: 'cuentas/:id', component: CuentaDetalle, title: titulo('Detalle de cuenta') },
      { path: 'cuentas', component: Cuentas, title: titulo('Cuentas') },
      { path: 'operaciones', component: Operaciones, title: titulo('Operaciones') },
      { path: 'movimientos', component: Movimientos, title: titulo('Movimientos') },
      { path: 'consultas', component: Consultas, title: titulo('Consultas') },
      { path: 'reporte', component: ReportePagina, title: titulo('Reporte de operaciones') },
      { path: '**', component: NoEncontrada, title: titulo('Página no encontrada') },
    ],
  },
];
