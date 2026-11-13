import cors from 'cors';
import express from 'express';
import { routerClientes } from './clientes';
import { consultar } from './db';
import { manejadorErrores, envolver } from './http';
import { routerCuentas, routerTiposCuenta } from './cuentas';

export function crearApp() {
  const app = express();
  app.use(
    cors({
      origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    }),
  );
  app.use(express.json());

  app.get(
    '/api/salud',
    envolver(async (_req, res) => {
      await consultar('SELECT 1 AS ok');
      res.json({ estado: 'ok', sistema: 'banco-academico' });
    }),
  );

  app.use('/api/clientes', routerClientes);
  app.use('/api/cuentas', routerCuentas);
  app.use('/api/tipos-cuenta', routerTiposCuenta);

  app.use((_req, res) => {
    res.status(404).json({ mensaje: 'El recurso no existe.', codigo: 'NO_ENCONTRADO' });
  });
  app.use(manejadorErrores);
  return app;
}
