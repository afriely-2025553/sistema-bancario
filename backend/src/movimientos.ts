import { Router } from 'express';
import { RowDataPacket } from 'mysql2';
import { consultar } from './db';
import { ErrorApp } from './errors';
import { dinero, enteroPositivo, envolver } from './http';
import { MovimientoDto, operarCuenta } from './operaciones';
import { leerCuerpo, leerMonto } from './validacion';
import { z } from 'zod';

const SQL = `
  SELECT m.id, m.cuenta_id, c.numero_cuenta, m.transferencia_id, t.referencia,
         CASE
           WHEN m.tipo = 'transferencia_salida' THEN dest.numero_cuenta
           WHEN m.tipo = 'transferencia_entrada' THEN orig.numero_cuenta
           ELSE NULL
         END AS cuenta_contraparte,
         m.usuario_id, m.tipo, m.monto, m.saldo_anterior, m.saldo_posterior,
         m.descripcion, m.fecha
  FROM movimiento m
  INNER JOIN cuenta c ON c.id = m.cuenta_id
  LEFT JOIN transferencia t ON t.id = m.transferencia_id
  LEFT JOIN cuenta orig ON orig.id = t.cuenta_origen_id
  LEFT JOIN cuenta dest ON dest.id = t.cuenta_destino_id
`;

function aMovimiento(fila: RowDataPacket): MovimientoDto {
  return {
    id: fila.id,
    cuentaId: fila.cuenta_id,
    numeroCuenta: fila.numero_cuenta,
    transferenciaId: fila.transferencia_id,
    referencia: fila.referencia,
    cuentaContraparte: fila.cuenta_contraparte,
    usuarioId: fila.usuario_id,
    tipo: fila.tipo,
    monto: dinero(fila.monto),
    saldoAnterior: dinero(fila.saldo_anterior),
    saldoPosterior: dinero(fila.saldo_posterior),
    descripcion: fila.descripcion,
    fecha: fila.fecha,
  };
}

function leerFecha(valor: unknown, etiqueta: string): string | null {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }
  const texto = String(valor);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    throw new ErrorApp(400, `${etiqueta} debe usar el formato AAAA-MM-DD.`, 'FECHA_INVALIDA');
  }
  return texto;
}

export async function listarMovimientos(filtro: {
  cuentaId: number | null;
  desde: string | null;
  hasta: string | null;
}): Promise<MovimientoDto[]> {
  const filas = await consultar<RowDataPacket>(
    `${SQL}
     WHERE (? IS NULL OR m.cuenta_id = ?)
       AND (? IS NULL OR m.fecha >= ?)
       AND (? IS NULL OR m.fecha < DATE_ADD(?, INTERVAL 1 DAY))
     ORDER BY m.fecha DESC, m.id DESC
     LIMIT 200`,
    [filtro.cuentaId, filtro.cuentaId, filtro.desde, filtro.desde, filtro.hasta, filtro.hasta],
  );
  return filas.map(aMovimiento);
}

const esquemaMovimiento = z.object({
  cuentaId: z
    .number({ required_error: 'La cuenta es obligatoria.', invalid_type_error: 'La cuenta es obligatoria.' })
    .int()
    .positive(),
  tipo: z.enum(['deposito', 'retiro'], {
    errorMap: () => ({ message: 'El tipo del movimiento directo debe ser deposito o retiro.' }),
  }),
  monto: z.unknown(),
  descripcion: z.union([z.string().trim().max(255), z.literal(''), z.null()]).optional(),
});

export const routerMovimientos = Router();

routerMovimientos.get(
  '/',
  envolver(async (req, res) => {
    const cuentaId = req.query.cuentaId ? enteroPositivo(String(req.query.cuentaId), 'La cuenta') : null;
    const desde = leerFecha(req.query.desde, 'La fecha inicial');
    const hasta = leerFecha(req.query.hasta, 'La fecha final');
    res.json(await listarMovimientos({ cuentaId, desde, hasta }));
  }),
);

routerMovimientos.get(
  '/cuenta/:cuentaId',
  envolver(async (req, res) => {
    const cuentaId = enteroPositivo(req.params.cuentaId, 'La cuenta');
    const desde = leerFecha(req.query.desde, 'La fecha inicial');
    const hasta = leerFecha(req.query.hasta, 'La fecha final');
    res.json(await listarMovimientos({ cuentaId, desde, hasta }));
  }),
);

routerMovimientos.post(
  '/',
  envolver(async (req, res) => {
    const datos = leerCuerpo(esquemaMovimiento, req.body);
    const monto = leerMonto(datos.monto);
    const descripcion = datos.descripcion
      ? datos.descripcion
      : datos.tipo === 'deposito'
        ? 'Depósito en ventanilla'
        : 'Retiro en ventanilla';
    const movimiento = await operarCuenta(datos.cuentaId, monto, datos.tipo, descripcion, req.usuario!.id);
    res.status(201).json({ movimiento });
  }),
);
