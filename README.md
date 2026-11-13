# Sistema bancario académico

[![CI](https://github.com/afriely-2025553/sistema-bancario/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/afriely-2025553/sistema-bancario/actions/workflows/ci.yml)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/afriely-2025553/sistema-bancario?quickstart=1)

Sistema de práctica para registrar clientes, abrir cuentas y operar depósitos, retiros y transferencias. Integra una interfaz en Angular, una API REST en Node.js y una base MySQL. No administra dinero real: las personas, los documentos, las contraseñas y los saldos de este repositorio son inventados.

| Dato | Valor |
| --- | --- |
| Institución | ____________ |
| Curso / Área | Taller 2 |
| Grado y sección | ____________ |
| Docente | ____________ |
| Estudiante | ____________ |
| Modalidad | Trabajo individual |
| Identidad del repositorio | afriely-2025553 |

## Qué hace

Un operador inicia sesión y puede:

- registrar, consultar, modificar y desactivar clientes (la baja es lógica);
- abrir cuentas ligadas a un cliente y a un tipo, consultar el saldo y cambiar el estado;
- depositar, retirar y transferir, siempre dentro de una transacción SQL;
- consultar movimientos e identificar clientes o cuentas;
- ver un reporte de depósitos, retiros y transferencias.

## Probar en línea

Se puede probar el sistema completo (MySQL, API y Angular) en GitHub Codespaces, sin instalar nada:

1. Pulse el botón **Open in GitHub Codespaces** de arriba (o **Code → Codespaces → Create codespace on main**) con una cuenta de GitHub.
2. Espere a que termine la preparación. La primera vez tarda unos minutos: instala dependencias, crea la base `banco_academico` y carga `schema.sql` y `seed.sql`.
3. Al arrancar, la API y Angular se levantan solos en segundo plano. El navegador abre el puerto **4200 (Sistema bancario)**; si no se abre, vaya a la pestaña **PORTS** y abra la dirección del puerto 4200.
4. Entre con una de las cuentas de la sección [Credenciales ficticias de prueba](#credenciales-ficticias-de-prueba).
5. Los registros quedan en `logs/backend.log` y `logs/frontend.log`. Para regresar a la semilla: `cd backend && npm run db:init`. Para las pruebas: `cd backend && npm test`.

El frontend llama a la API por la ruta relativa `/api`, y el servidor de desarrollo de Angular la reenvía al backend del puerto 3000 (`frontend/proxy.conf.json`). Por eso basta con el puerto 4200.

Cada push o pull request a `main` ejecuta el flujo **CI** de GitHub Actions: levanta MySQL 8, inicializa la base, compila backend y frontend, corre las pruebas Jest P001-P010 y la colección de Postman con Newman.

Detenga el codespace cuando termine (**Codespaces → Stop codespace**) para no gastar las horas gratuitas de su cuenta.

## Reglas de negocio

1. Toda cuenta pertenece a un cliente.
2. No se retira más que el saldo disponible.
3. El depósito es mayor que cero.
4. El retiro es mayor que cero.
5. La transferencia exige origen y destino existentes.
6. El origen debe tener saldo suficiente.
7. No se transfiere a la misma cuenta.
8. Cada operación queda con fecha, tipo, monto y cuentas.
9. Una cuenta inactiva, o la cuenta de un cliente inactivo, no opera.
10. Solo se usan datos ficticios.

## Credenciales ficticias de prueba

La pantalla de acceso no muestra estas credenciales; solo se documentan aquí.

| Usuario | Contraseña | Rol | Estado |
| --- | --- | --- | --- |
| cajero | Cajero123! | cajero | activo |
| administrador | Admin123! | administrador | activo |
| cajero.inactivo | Cajero123! | cajero | inactivo, para probar el rechazo |

Base de datos de desarrollo:

| Parámetro | Valor |
| --- | --- |
| Host | 127.0.0.1 |
| Puerto | 3306 |
| Base | banco_academico |
| Usuario | banco_app |
| Contraseña | BancoFicticio123! |

## Pantallas

| Ruta | Pantalla |
| --- | --- |
| /login | Acceso del operador |
| /inicio | Indicadores, accesos directos y últimos movimientos |
| /clientes | Lista con búsqueda, filtro por estado y paginación |
| /clientes/nuevo, /clientes/:id/editar | Registro y edición del cliente |
| /clientes/:id | Ficha del cliente con sus cuentas |
| /cuentas, /cuentas/nueva, /cuentas/:id | Lista, apertura y detalle de cuentas |
| /operaciones | Depósito, retiro y transferencia con confirmación y comprobante |
| /movimientos | Historial con filtros por cuenta, tipo y fechas |
| /consultas | Búsqueda de clientes y cuentas |
| /reporte | Totales por periodo e impresión |

## Estructura

```
.devcontainer/ entorno de GitHub Codespaces (MySQL 8 y Node 22)
.github/      flujo de CI de GitHub Actions
frontend/     Angular y TypeScript
backend/      API Express y TypeScript
database/     schema.sql y seed.sql
docs/         documentos, diagramas y evidencias
postman/      colección y entorno
```

## Requisitos

- Node.js 22 (22.22.3 o posterior, que exige Angular 22)
- npm 10
- MySQL 8
- Un navegador actual
- Postman, si se quiere repetir la colección

## Instalación en Windows

Los pasos usan PowerShell. Las rutas de ejemplo suponen que el repositorio está en `C:\proyectos\sistema-bancario`.

### 1. MySQL

Instale MySQL Server 8 y abra la consola como administrador. Cree la base y el usuario de práctica:

```sql
CREATE DATABASE banco_academico CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'banco_app'@'localhost' IDENTIFIED BY 'BancoFicticio123!';
GRANT ALL PRIVILEGES ON banco_academico.* TO 'banco_app'@'localhost';
FLUSH PRIVILEGES;
```

Si el servicio no está iniciado: `net start MySQL80` (el nombre puede variar en Servicios de Windows).

### 2. Backend

```powershell
cd C:\proyectos\sistema-bancario\backend
copy .env.example .env
npm install
npm run db:init
npm run dev
```

`db:init` crea las tablas y carga la semilla. Vuelve a ejecutarlo cuando quiera regresar a los saldos de demostración: el script borra las tablas de esa base. La API queda en `http://localhost:3000`. Compruebe `http://localhost:3000/api/salud`.

### 3. Frontend

En otra ventana de PowerShell:

```powershell
cd C:\proyectos\sistema-bancario\frontend
npm install
npm start
```

Abra `http://localhost:4200` y entre con las credenciales de prueba. `npm start` usa `proxy.conf.json`, que envía las llamadas a `/api` al backend en `http://127.0.0.1:3000`; por eso el backend debe estar en marcha antes de entrar.

### 4. Pruebas

Con MySQL en marcha, desde `backend`:

```powershell
npm test
```

Eso crea `banco_academico_test`, carga el esquema y ejecuta P001 a P010. No borra la base de demostración.

En Postman importe:

- `postman/sistema-bancario.postman_collection.json`
- `postman/sistema-bancario.local.postman_environment.json`

Arranque la API y ejecute la carpeta **Pruebas P001-P010** en orden.

## Endpoints

La base es `http://localhost:3000/api`. Salvo el login y `/salud`, las rutas exigen `Authorization: Bearer <token>`.

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | /salud | Comprueba la API y MySQL |
| POST | /auth/login | Inicia sesión. Cuerpo: `nombreUsuario`, `contrasena` |
| GET | /auth/yo | Devuelve el operador del token |
| POST | /auth/logout | Confirma el cierre. El navegador debe descartar el token |
| GET | /clientes?q= | Lista o busca clientes |
| GET | /clientes/:id | Ficha |
| POST | /clientes | Alta |
| PUT | /clientes/:id | Modificación |
| PATCH | /clientes/:id/desactivar | Baja lógica |
| PATCH | /clientes/:id/activar | Reactiva la ficha |
| DELETE | /clientes/:id | También desactiva, sin borrar el historial |
| GET | /tipos-cuenta | Catálogo |
| GET | /cuentas?q=&clienteId= | Lista o busca cuentas |
| GET | /cuentas/:id | Detalle con saldo |
| GET | /cuentas/:id/saldo | Solo el saldo y el estado |
| POST | /cuentas | Apertura. Cuerpo: `clienteId`, `tipoCuentaId` |
| PATCH | /cuentas/:id/estado | Cuerpo: `estado` = `activa` o `inactiva` |
| POST | /depositos | Cuerpo: `cuentaId`, `monto`, `descripcion` |
| POST | /retiros | Cuerpo: `cuentaId`, `monto`, `descripcion` |
| GET | /transferencias | Últimas transferencias |
| POST | /transferencias | Cuerpo: `cuentaOrigenId`, `cuentaDestinoId`, `monto`, `concepto` |
| GET | /movimientos?cuentaId=&desde=&hasta= | Historial. Fechas `AAAA-MM-DD` |
| GET | /movimientos/cuenta/:cuentaId | Historial de una cuenta |
| POST | /movimientos | Depósito o retiro. Cuerpo: `cuentaId`, `tipo`, `monto`, `descripcion` |
| GET | /consultas?q= | Clientes y cuentas que coinciden con el texto |
| GET | /consultas/saldo/:cuentaId | Saldo desde el módulo de consultas |
| GET | /reportes/operaciones?desde=&hasta= | Totales y últimas operaciones |

Los montos son números mayores que cero, con dos decimales como máximo, y no superan 1,000,000.00 en una sola operación. Un error de negocio responde 400 con `mensaje` y `codigo`. Un duplicado responde 409. Un recurso ausente responde 404.

## Documentación

| Archivo | Contenido |
| --- | --- |
| docs/01-documento-inicial.docx | Problema, alcance, objetivos y rol único |
| docs/02-requerimientos-historias.docx | Requerimientos y 18 historias |
| docs/03-diseno-arquitectura.docx | Arquitectura, flujos y modelo de datos |
| docs/04-matriz-de-pruebas.docx | P001 a P010 |
| docs/05-registro-errores.docx | Errores reales y su corrección |
| docs/06-manual-usuario.docx | Uso de la interfaz, con capturas |
| docs/07-registro-uso-ia.docx | Apoyo del asistente de IA |
| docs/08-documentacion-final.docx | Cierre del proyecto, con conclusiones |
| docs/presentacion-sistema-bancario.pptx | Exposición de 12 a 15 minutos |
| docs/diagramas/ | ERD, arquitectura, casos de uso y flujos |
| docs/evidencias/ | Salidas de Jest y Newman, y capturas |

## Mantenimiento

- Para volver a la semilla: `npm run db:init` dentro de `backend`.
- El secreto JWT y la contraseña de la base que vienen en `.env.example` sirven para la práctica local. No los reutilice fuera de este ejercicio.
- No cargue documentos, tarjetas ni contraseñas reales.
