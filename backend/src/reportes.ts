import { Router } from 'express';
import { RowDataPacket } from 'mysql2';
import { consultar } from './db';
import { ErrorApp } from './errors';
import { dinero, envolver } from './http';
import { listarMovimientos } from './movimientos';

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

async function totalPor(
  sql: string,
  desde: string | null,
  hasta: string | null,
): Promise<{ cantidad: number; monto: number }> {
  const filas = await consultar<RowDataPacket & { cantidad: number; monto: string }>(sql, [
    desde,
    desde,
    hasta,
    hasta,
  ]);
  return {
    cantidad: Number(filas[0]?.cantidad || 0),
    monto: dinero(filas[0]?.monto || 0),
  };
}

export const routerReportes = Router();

routerReportes.get(
  '/operaciones',
  envolver(async (req, res) => {
    const desde = leerFecha(req.query.desde, 'La fecha inicial');
    const hasta = leerFecha(req.query.hasta, 'La fecha final');
    const filtroFechaMov = `AND (? IS NULL OR fecha >= ?) AND (? IS NULL OR fecha < DATE_ADD(?, INTERVAL 1 DAY))`;
    const depositos = await totalPor(
      `SELECT COUNT(*) AS cantidad, COALESCE(SUM(monto), 0) AS monto
       FROM movimiento WHERE tipo = 'deposito' ${filtroFechaMov}`,
      desde,
      hasta,
    );
    const retiros = await totalPor(
      `SELECT COUNT(*) AS cantidad, COALESCE(SUM(monto), 0) AS monto
       FROM movimiento WHERE tipo = 'retiro' ${filtroFechaMov}`,
      desde,
      hasta,
    );
    const transferencias = await totalPor(
      `SELECT COUNT(*) AS cantidad, COALESCE(SUM(monto), 0) AS monto
       FROM transferencia WHERE 1 = 1 ${filtroFechaMov}`,
      desde,
      hasta,
    );
    const cuentas = await consultar<RowDataPacket>(
      `SELECT
         SUM(CASE WHEN estado = 'activa' THEN 1 ELSE 0 END) AS activas,
         SUM(CASE WHEN estado = 'inactiva' THEN 1 ELSE 0 END) AS inactivas,
         COALESCE(SUM(saldo), 0) AS saldo_total
       FROM cuenta`,
    );
    const clientes = await consultar<RowDataPacket>(
      `SELECT
         SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) AS activos,
         SUM(CASE WHEN activo = 0 THEN 1 ELSE 0 END) AS inactivos
       FROM cliente`,
    );
    const recientes = await listarMovimientos({ cuentaId: null, desde, hasta });
    res.json({
      periodo: { desde, hasta },
      depositos,
      retiros,
      transferencias,
      cuentas: {
        activas: Number(cuentas[0]?.activas || 0),
        inactivas: Number(cuentas[0]?.inactivas || 0),
        saldoTotal: dinero(cuentas[0]?.saldo_total || 0),
      },
      clientes: {
        activos: Number(clientes[0]?.activos || 0),
        inactivos: Number(clientes[0]?.inactivos || 0),
      },
      ultimasOperaciones: recientes.slice(0, 8),
    });
  }),
);
