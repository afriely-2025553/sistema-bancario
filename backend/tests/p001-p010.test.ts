import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import request from 'supertest';
import { Express } from 'express';
import { crearApp } from '../src/app';
import { configuracion } from '../src/config';
import { cerrarPool } from '../src/db';

let app: Express;
let secuencia = 0;

function identificacionUnica(): { identificacion: string; correo: string } {
  secuencia += 1;
  const marca = `${Date.now()}${secuencia}`;
  return {
    identificacion: `DPI-TEST-${marca}`,
    correo: `prueba${marca}@correo-ficticio.test`,
  };
}

async function entrar(): Promise<string> {
  const respuesta = await request(app)
    .post('/api/auth/login')
    .send({ nombreUsuario: 'cajero', contrasena: 'Cajero123!' });
  return respuesta.body.token as string;
}

async function clienteYCuenta(token: string, saldoInicial = 0): Promise<{ clienteId: number; cuentaId: number }> {
  const unico = identificacionUnica();
  const cliente = await request(app)
    .post('/api/clientes')
    .set('Authorization', `Bearer ${token}`)
    .send({
      identificacion: unico.identificacion,
      nombres: 'Cliente',
      apellidos: 'Ficticio Prueba',
      correo: unico.correo,
    });
  const cuenta = await request(app)
    .post('/api/cuentas')
    .set('Authorization', `Bearer ${token}`)
    .send({ clienteId: cliente.body.id, tipoCuentaId: 1 });
  if (saldoInicial > 0) {
    await request(app)
      .post('/api/depositos')
      .set('Authorization', `Bearer ${token}`)
      .send({ cuentaId: cuenta.body.id, monto: saldoInicial, descripcion: 'Saldo de preparación' });
  }
  return { clienteId: cliente.body.id as number, cuentaId: cuenta.body.id as number };
}

beforeAll(async () => {
  const db = configuracion().db;
  const conexion = await mysql.createConnection({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password,
    multipleStatements: true,
  });
  await conexion.query(
    `CREATE DATABASE IF NOT EXISTS \`${db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await conexion.query(`USE \`${db.database}\``);
  const carpeta = path.resolve(__dirname, '../../database');
  await conexion.query(fs.readFileSync(path.join(carpeta, 'schema.sql'), 'utf8'));
  await conexion.query(fs.readFileSync(path.join(carpeta, 'seed.sql'), 'utf8'));
  await conexion.end();
  app = crearApp();
});

afterAll(async () => {
  await cerrarPool();
});

describe('Pruebas obligatorias P001-P010', () => {
  test('P001 login válido permite el acceso', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ nombreUsuario: 'cajero', contrasena: 'Cajero123!' });
    expect(respuesta.status).toBe(200);
    expect(typeof respuesta.body.token).toBe('string');
    expect(respuesta.body.usuario.nombreUsuario).toBe('cajero');
    expect(respuesta.body.usuario.contrasena).toBeUndefined();

    const protegido = await request(app)
      .get('/api/auth/yo')
      .set('Authorization', `Bearer ${respuesta.body.token}`);
    expect(protegido.status).toBe(200);
    expect(protegido.body.usuario.rol).toBe('cajero');
  });

  test('P002 login inválido muestra mensaje de error', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ nombreUsuario: 'cajero', contrasena: 'clave-incorrecta' });
    expect(respuesta.status).toBe(401);
    expect(respuesta.body.mensaje).toBe('Usuario o contraseña incorrectos.');
    expect(respuesta.body.token).toBeUndefined();

    const inactivo = await request(app)
      .post('/api/auth/login')
      .send({ nombreUsuario: 'cajero.inactivo', contrasena: 'Cajero123!' });
    expect(inactivo.status).toBe(401);
    expect(inactivo.body.mensaje).toMatch(/incorrectos/);
  });

  test('P003 registrar cliente lo almacena', async () => {
    const token = await entrar();
    const unico = identificacionUnica();
    const alta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        identificacion: unico.identificacion,
        nombres: 'Cliente',
        apellidos: 'Ficticio Alta',
        correo: unico.correo,
        telefono: '55501888',
      });
    expect(alta.status).toBe(201);
    expect(alta.body.activo).toBe(true);
    expect(alta.body.codigo).toMatch(/^CLI-/);

    const consulta = await request(app)
      .get(`/api/clientes/${alta.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(consulta.status).toBe(200);
    expect(consulta.body.identificacion).toBe(unico.identificacion);
    expect(consulta.body.correo).toBe(unico.correo);
  });

  test('P004 crear cuenta la asocia al cliente', async () => {
    const token = await entrar();
    const { clienteId, cuentaId } = await clienteYCuenta(token);
    const cuenta = await request(app).get(`/api/cuentas/${cuentaId}`).set('Authorization', `Bearer ${token}`);
    expect(cuenta.status).toBe(200);
    expect(cuenta.body.clienteId).toBe(clienteId);
    expect(cuenta.body.saldo).toBe(0);
    expect(cuenta.body.estado).toBe('activa');
    expect(cuenta.body.numeroCuenta).toMatch(/^100-/);
    expect(cuenta.body.clienteNombre).toContain('Cliente');
  });

  test('P005 depósito válido incrementa el saldo', async () => {
    const token = await entrar();
    const { cuentaId } = await clienteYCuenta(token, 20);
    const deposito = await request(app)
      .post('/api/depositos')
      .set('Authorization', `Bearer ${token}`)
      .send({ cuentaId, monto: 15.5, descripcion: 'Depósito de P005' });
    expect(deposito.status).toBe(201);
    expect(deposito.body.movimiento.tipo).toBe('deposito');
    expect(deposito.body.movimiento.saldoAnterior).toBe(20);
    expect(deposito.body.movimiento.saldoPosterior).toBe(35.5);

    const saldo = await request(app).get(`/api/cuentas/${cuentaId}/saldo`).set('Authorization', `Bearer ${token}`);
    expect(saldo.body.saldo).toBe(35.5);
  });

  test('P006 retiro con saldo suficiente disminuye el saldo', async () => {
    const token = await entrar();
    const { cuentaId } = await clienteYCuenta(token, 80);
    const retiro = await request(app)
      .post('/api/retiros')
      .set('Authorization', `Bearer ${token}`)
      .send({ cuentaId, monto: 30.25, descripcion: 'Retiro de P006' });
    expect(retiro.status).toBe(201);
    expect(retiro.body.movimiento.tipo).toBe('retiro');
    expect(retiro.body.movimiento.saldoPosterior).toBe(49.75);

    const saldo = await request(app).get(`/api/cuentas/${cuentaId}/saldo`).set('Authorization', `Bearer ${token}`);
    expect(saldo.body.saldo).toBe(49.75);
  });

  test('P007 retiro superior al saldo es rechazado', async () => {
    const token = await entrar();
    const { cuentaId } = await clienteYCuenta(token, 40);
    const retiro = await request(app)
      .post('/api/retiros')
      .set('Authorization', `Bearer ${token}`)
      .send({ cuentaId, monto: 40.01, descripcion: 'Retiro que excede' });
    expect(retiro.status).toBe(400);
    expect(retiro.body.codigo).toBe('SALDO_INSUFICIENTE');

    const saldo = await request(app).get(`/api/cuentas/${cuentaId}/saldo`).set('Authorization', `Bearer ${token}`);
    expect(saldo.body.saldo).toBe(40);

    const movimientos = await request(app)
      .get(`/api/movimientos/cuenta/${cuentaId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(movimientos.body).toHaveLength(1);
  });

  test('P008 transferencia válida actualiza ambas cuentas', async () => {
    const token = await entrar();
    const origen = await clienteYCuenta(token, 100);
    const destino = await clienteYCuenta(token, 10);
    const transferencia = await request(app)
      .post('/api/transferencias')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cuentaOrigenId: origen.cuentaId,
        cuentaDestinoId: destino.cuentaId,
        monto: 25.4,
        concepto: 'Traslado P008',
      });
    expect(transferencia.status).toBe(201);
    expect(transferencia.body.movimientoOrigen.saldoPosterior).toBe(74.6);
    expect(transferencia.body.movimientoDestino.saldoPosterior).toBe(35.4);
    expect(transferencia.body.transferencia.referencia).toMatch(/^TRF-/);

    const saldoOrigen = await request(app)
      .get(`/api/cuentas/${origen.cuentaId}/saldo`)
      .set('Authorization', `Bearer ${token}`);
    const saldoDestino = await request(app)
      .get(`/api/cuentas/${destino.cuentaId}/saldo`)
      .set('Authorization', `Bearer ${token}`);
    expect(saldoOrigen.body.saldo).toBe(74.6);
    expect(saldoDestino.body.saldo).toBe(35.4);
  });

  test('P009 transferencia a la misma cuenta es rechazada', async () => {
    const token = await entrar();
    const { cuentaId } = await clienteYCuenta(token, 50);
    const transferencia = await request(app)
      .post('/api/transferencias')
      .set('Authorization', `Bearer ${token}`)
      .send({ cuentaOrigenId: cuentaId, cuentaDestinoId: cuentaId, monto: 10, concepto: 'Misma cuenta' });
    expect(transferencia.status).toBe(400);
    expect(transferencia.body.codigo).toBe('MISMA_CUENTA');

    const saldo = await request(app).get(`/api/cuentas/${cuentaId}/saldo`).set('Authorization', `Bearer ${token}`);
    expect(saldo.body.saldo).toBe(50);
  });

  test('P010 cuenta inactiva no permite operaciones', async () => {
    const token = await entrar();
    const origen = await clienteYCuenta(token, 70);
    const destino = await clienteYCuenta(token, 15);
    const estado = await request(app)
      .patch(`/api/cuentas/${origen.cuentaId}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'inactiva' });
    expect(estado.status).toBe(200);
    expect(estado.body.estado).toBe('inactiva');

    const deposito = await request(app)
      .post('/api/depositos')
      .set('Authorization', `Bearer ${token}`)
      .send({ cuentaId: origen.cuentaId, monto: 5, descripcion: 'No debe entrar' });
    const retiro = await request(app)
      .post('/api/retiros')
      .set('Authorization', `Bearer ${token}`)
      .send({ cuentaId: origen.cuentaId, monto: 5, descripcion: 'No debe salir' });
    const salida = await request(app)
      .post('/api/transferencias')
      .set('Authorization', `Bearer ${token}`)
      .send({ cuentaOrigenId: origen.cuentaId, cuentaDestinoId: destino.cuentaId, monto: 5, concepto: 'No' });
    const entrada = await request(app)
      .post('/api/transferencias')
      .set('Authorization', `Bearer ${token}`)
      .send({ cuentaOrigenId: destino.cuentaId, cuentaDestinoId: origen.cuentaId, monto: 5, concepto: 'No' });

    for (const respuesta of [deposito, retiro, salida, entrada]) {
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.codigo).toBe('CUENTA_INACTIVA');
    }

    const saldo = await request(app)
      .get(`/api/cuentas/${origen.cuentaId}/saldo`)
      .set('Authorization', `Bearer ${token}`);
    expect(saldo.body.saldo).toBe(70);
    expect(saldo.body.estado).toBe('inactiva');
  });
});
