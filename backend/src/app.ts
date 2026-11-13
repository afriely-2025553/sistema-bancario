import cors from 'cors';
import express from 'express';
import { exigirAuth, routerAuth } from './auth';
import { routerClientes } from './clientes';
import { consultar } from './db';
import { manejadorErrores, envolver } from './http';
import { routerCuentas, routerTiposCuenta } from './cuentas';
import { routerDepositos, routerRetiros } from './operaciones';

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

  app.use('/api/auth', routerAuth);
  app.use('/api/clientes', exigirAuth, routerClientes);
  app.use('/api/cuentas', exigirAuth, routerCuentas);
  app.use('/api/tipos-cuenta', exigirAuth, routerTiposCuenta);
  app.use('/api/depositos', exigirAuth, routerDepositos);
  app.use('/api/retiros', exigirAuth, routerRetiros);

  app.use((_req, res) => {
    res.status(404).json({ mensaje: 'El recurso no existe.', codigo: 'NO_ENCONTRADO' });
  });
  app.use(manejadorErrores);
  return app;
}
