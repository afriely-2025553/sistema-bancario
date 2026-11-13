# Modelo de datos

| Dato | Valor |
| --- | --- |
| Institución | ____________ |
| Curso / Área | Taller 2 |
| Grado y sección | ____________ |
| Docente | ____________ |
| Estudiante | ____________ |
| Modalidad | Trabajo individual |

El diagrama entidad-relación está en `docs/diagramas/erd.svg`. Los scripts ejecutables están en `database/schema.sql` y `database/seed.sql`.

## 1. Modelo lógico

Convención: cada tabla usa el nombre en singular. Las claves primarias son `id` entero autoincremental. El motor es InnoDB y el juego de caracteres es utf8mb4.

### TipoCuenta

Catálogo del producto de cuenta.

| Columna | Tipo | Restricción |
| --- | --- | --- |
| id | INT | PK |
| nombre | VARCHAR(50) | Único, obligatorio |
| descripcion | VARCHAR(255) | Obligatoria |
| activo | TINYINT(1) | 1 disponible para aperturas, 0 no |

### Cliente

Persona ficticia titular de cuentas. La desactivación no borra la fila.

| Columna | Tipo | Restricción |
| --- | --- | --- |
| id | INT | PK |
| codigo | VARCHAR(20) | Único. Formato CLI-0001 |
| identificacion | VARCHAR(30) | Única. Documento ficticio |
| nombres | VARCHAR(80) | Obligatorio |
| apellidos | VARCHAR(80) | Obligatorio |
| fecha_nacimiento | DATE | Opcional |
| telefono | VARCHAR(20) | Opcional |
| correo | VARCHAR(150) | Único, obligatorio |
| direccion | VARCHAR(255) | Opcional |
| activo | TINYINT(1) | 1 activo, 0 desactivado |
| fecha_registro | DATETIME | Alta de la ficha |

### Usuario

Operador del sistema. No es el cliente bancario.

| Columna | Tipo | Restricción |
| --- | --- | --- |
| id | INT | PK |
| nombre_usuario | VARCHAR(50) | Único |
| contrasena_hash | VARCHAR(255) | Hash bcrypt, nunca la contraseña en claro |
| nombre_completo | VARCHAR(150) | Etiqueta del operador ficticio |
| rol | ENUM | administrador o cajero |
| activo | TINYINT(1) | Un inactivo no inicia sesión |
| fecha_creacion | DATETIME | Alta |

### Cuenta

Producto contratado por un cliente. Regla RN-01: toda cuenta tiene cliente.

| Columna | Tipo | Restricción |
| --- | --- | --- |
| id | INT | PK |
| numero_cuenta | VARCHAR(20) | Único. Formato 100-00000001 |
| cliente_id | INT | FK a Cliente. Obligatorio |
| tipo_cuenta_id | INT | FK a TipoCuenta. Obligatorio |
| saldo | DECIMAL(15,2) | Mayor o igual que cero |
| estado | ENUM | activa o inactiva |
| fecha_apertura | DATETIME | Apertura |

### Transferencia

Operación entre dos cuentas distintas.

| Columna | Tipo | Restricción |
| --- | --- | --- |
| id | INT | PK |
| cuenta_origen_id | INT | FK a Cuenta |
| cuenta_destino_id | INT | FK a Cuenta, distinta del origen |
| usuario_id | INT | FK a Usuario, operador que la registró |
| monto | DECIMAL(15,2) | Mayor que cero |
| referencia | VARCHAR(40) | Única. Formato TRF-00000001 |
| concepto | VARCHAR(255) | Opcional |
| fecha | DATETIME | Momento de la operación |

### Movimiento

Rastro de cada efecto sobre una cuenta. Una transferencia genera dos movimientos.

| Columna | Tipo | Restricción |
| --- | --- | --- |
| id | INT | PK |
| cuenta_id | INT | FK a Cuenta |
| transferencia_id | INT | FK opcional a Transferencia |
| usuario_id | INT | FK opcional a Usuario |
| tipo | ENUM | deposito, retiro, transferencia_salida, transferencia_entrada |
| monto | DECIMAL(15,2) | Mayor que cero |
| saldo_anterior | DECIMAL(15,2) | Saldo antes de la operación |
| saldo_posterior | DECIMAL(15,2) | Saldo después de la operación |
| descripcion | VARCHAR(255) | Texto de la operación |
| fecha | DATETIME | Momento |

## 2. Relaciones

| Relación | Cardinalidad | Regla |
| --- | --- | --- |
| Cliente — Cuenta | 1 a N | Una cuenta pertenece a un solo cliente. Un cliente puede tener varias. |
| TipoCuenta — Cuenta | 1 a N | Cada cuenta tiene un tipo. |
| Cuenta — Transferencia (origen) | 1 a N | Una cuenta puede originar varias transferencias. |
| Cuenta — Transferencia (destino) | 1 a N | Una cuenta puede recibir varias transferencias. |
| Transferencia — Movimiento | 1 a N | Cada transferencia confirmada deja dos movimientos. |
| Cuenta — Movimiento | 1 a N | Toda operación de saldo cuelga de una cuenta. |
| Usuario — Transferencia | 1 a N | El operador queda identificado. |
| Usuario — Movimiento | 1 a N | El operador queda identificado. |

Usuario y Cliente no se relacionan: son papeles distintos.

## 3. Integridad que refuerza las reglas

| Regla | Dónde se garantiza |
| --- | --- |
| RN-01 Cuenta con cliente | `cliente_id` NOT NULL y clave foránea. |
| RN-02 y RN-06 Saldo suficiente | Comparación en la transacción y `CHECK (saldo >= 0)`. |
| RN-03, RN-04 Monto positivo | Validación de la API y `CHECK (monto > 0)`. |
| RN-05 Cuentas válidas | Claves foráneas de origen y destino. |
| RN-07 Cuentas distintas | Validación de la API y `CHECK (cuenta_origen_id <> cuenta_destino_id)`. |
| RN-08 Registro de la operación | Inserción obligatoria de movimiento dentro de la misma transacción. |
| RN-09 Cuenta inactiva | Validación de `estado` y de `cliente.activo` antes de modificar el saldo. |
| RN-10 Datos ficticios | Semilla y manual usan identificadores y correos de práctica. |

## 4. Saldos de la semilla

La semilla deja un historial coherente con el saldo:

| Cuenta | Cliente | Estado | Cálculo | Saldo |
| --- | --- | --- | --- | --- |
| 100-00000001 | CLI-0001 | activa | 0 + 2000 − 500 | 1500.00 |
| 100-00000002 | CLI-0001 | activa | 0 + 1000 − 199.50 | 800.50 |
| 100-00000003 | CLI-0002 | activa | 0 + 50.50 + 199.50 | 250.00 |
| 100-00000004 | CLI-0002 | inactiva | sin movimientos | 0.00 |
| 100-00000005 | CLI-0003 | activa | 0 + 3200.75 | 3200.75 |
| 100-00000006 | CLI-0004 | inactiva | 0 + 100 | 100.00 |

La transferencia TRF-00000001 mueve 199.50 de la cuenta 2 a la cuenta 3.

## 5. Usuarios ficticios de la semilla

| Usuario | Contraseña de práctica | Rol | Activo |
| --- | --- | --- | --- |
| cajero | Cajero123! | cajero | sí |
| administrador | Admin123! | administrador | sí |
| cajero.inactivo | Cajero123! | cajero | no |
