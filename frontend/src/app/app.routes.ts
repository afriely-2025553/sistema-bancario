import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { ClienteForm } from './paginas/cliente-form';
import { Clientes } from './paginas/clientes';
import { Consultas } from './paginas/consultas';
import { CuentaDetalle } from './paginas/cuenta-detalle';
import { CuentaForm } from './paginas/cuenta-form';
import { Cuentas } from './paginas/cuentas';
import { Inicio } from './paginas/inicio';
import { Login } from './paginas/login';
import { Movimientos } from './paginas/movimientos';
import { Operaciones } from './paginas/operaciones';
import { ReportePagina } from './paginas/reporte';
import { Shell } from './paginas/shell';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      { path: 'inicio', component: Inicio },
      { path: 'clientes/nuevo', component: ClienteForm },
      { path: 'clientes/:id', component: ClienteForm },
      { path: 'clientes', component: Clientes },
      { path: 'cuentas/nueva', component: CuentaForm },
      { path: 'cuentas/:id', component: CuentaDetalle },
      { path: 'cuentas', component: Cuentas },
      { path: 'operaciones', component: Operaciones },
      { path: 'movimientos', component: Movimientos },
      { path: 'consultas', component: Consultas },
      { path: 'reporte', component: ReportePagina },
    ],
  },
  { path: '**', redirectTo: 'inicio' },
];
