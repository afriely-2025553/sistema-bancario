import { Router } from 'express';
import { RowDataPacket } from 'mysql2';
import { aCliente } from './clientes';
import { aCuenta, obtenerCuenta } from './cuentas';
import { consultar } from './db';
import { ErrorApp } from './errors';
import { enteroPositivo, envolver } from './http';

export const routerConsultas = Router();

routerConsultas.get(
  '/',
  envolver(async (req, res) => {
    const q = String(req.query.q || '').trim();
    if (!q) {
      throw new ErrorApp(400, 'Escriba un texto para consultar clientes o cuentas.', 'CONSULTA_VACIA');
    }
    const like = `%${q}%`;
    const clientes = await consultar<RowDataPacket>(
      `SELECT id, codigo, identificacion, nombres, apellidos, fecha_nacimiento,
              telefono, correo, direccion, activo, fecha_registro
       FROM cliente
       WHERE CONCAT(codigo, ' ', identificacion, ' ', nombres, ' ', apellidos, ' ', correo) LIKE ?
       ORDER BY id DESC
       LIMIT 20`,
      [like],
    );
    const cuentas = await consultar<RowDataPacket>(
      `SELECT c.id, c.numero_cuenta, c.cliente_id, cl.codigo AS cliente_codigo,
              CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente_nombre,
              cl.activo AS cliente_activo, c.tipo_cuenta_id, tc.nombre AS tipo_cuenta,
              c.saldo, c.estado, c.fecha_apertura
       FROM cuenta c
       INNER JOIN cliente cl ON cl.id = c.cliente_id
       INNER JOIN tipo_cuenta tc ON tc.id = c.tipo_cuenta_id
       WHERE CONCAT(c.numero_cuenta, ' ', cl.codigo, ' ', cl.nombres, ' ', cl.apellidos, ' ', cl.identificacion) LIKE ?
       ORDER BY c.id DESC
       LIMIT 20`,
      [like],
    );
    res.json({
      criterio: q,
      clientes: clientes.map((fila) => aCliente(fila as Parameters<typeof aCliente>[0])),
      cuentas: cuentas.map((fila) => aCuenta(fila as Parameters<typeof aCuenta>[0])),
    });
  }),
);

routerConsultas.get(
  '/saldo/:cuentaId',
  envolver(async (req, res) => {
    const cuenta = await obtenerCuenta(enteroPositivo(req.params.cuentaId, 'La cuenta'));
    res.json({
      cuentaId: cuenta.id,
      numeroCuenta: cuenta.numeroCuenta,
      clienteNombre: cuenta.clienteNombre,
      saldo: cuenta.saldo,
      estado: cuenta.estado,
      clienteActivo: cuenta.clienteActivo,
    });
  }),
);
