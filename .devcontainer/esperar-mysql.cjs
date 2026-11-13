// Espera a que MySQL acepte conexiones con el usuario de la práctica.
const mysql = require('mysql2/promise');

const intentos = 60;

async function main() {
  for (let i = 1; i <= intentos; i += 1) {
    try {
      const conexion = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'banco_app',
        password: process.env.DB_PASSWORD || 'BancoFicticio123!',
      });
      await conexion.query('SELECT 1');
      await conexion.end();
      console.log('MySQL listo.');
      return;
    } catch {
      console.log(`Esperando a MySQL (${i}/${intentos})...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.error('MySQL no respondió a tiempo.');
  process.exit(1);
}

main();
