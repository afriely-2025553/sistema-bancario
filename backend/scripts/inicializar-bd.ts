import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { configuracion } from '../src/config';

async function main(): Promise<void> {
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
  console.log(`Base ficticia lista en ${db.database}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
