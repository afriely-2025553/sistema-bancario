# Requerimientos e historias de usuario

| Dato | Valor |
| --- | --- |
| Institución | ____________ |
| Curso / Área | Taller 2 |
| Grado y sección | ____________ |
| Docente | ____________ |
| Estudiante | ____________ |
| Modalidad | Trabajo individual |
| Documento | Requerimientos e historias de usuario |

## 1. Descripción de la solución

El sistema ofrece a un operador autenticado el registro de clientes ficticios, la apertura de cuentas y la ejecución de depósitos, retiros y transferencias. Cada operación actualiza el saldo dentro de una transacción y deja un movimiento con fecha, tipo, monto y cuentas involucradas. El operador puede consultar y obtener un resumen de la actividad.

## 2. Actores

| Actor | Descripción |
| --- | --- |
| Operador cajero | Usuario ficticio que inicia sesión y ejecuta el día a día: clientes, cuentas y operaciones. |
| Operador administrador | Usuario ficticio con el mismo alcance operativo en esta versión académica. El rol queda guardado para identificar quién operó. |
| Cliente bancario | Persona ficticia registrada en el sistema. No inicia sesión. |

## 3. Requerimientos funcionales

| ID | Requerimiento | Módulo |
| --- | --- | --- |
| RF-01 | El sistema permite iniciar sesión con usuario y contraseña ficticios. | Autenticación |
| RF-02 | El sistema rechaza credenciales incorrectas o usuarios inactivos y no entrega un token. | Autenticación |
| RF-03 | El operador autenticado puede cerrar la sesión en la interfaz. | Autenticación |
| RF-04 | El sistema registra un cliente con identificación, nombres, apellidos y correo. | Clientes |
| RF-05 | El sistema lista, busca y consulta un cliente por identificador. | Clientes |
| RF-06 | El sistema modifica los datos editables de un cliente. | Clientes |
| RF-07 | El sistema desactiva un cliente de forma lógica, sin borrar el registro. | Clientes |
| RF-08 | El sistema crea una cuenta asociada a un cliente y a un tipo de cuenta. | Cuentas |
| RF-09 | El sistema consulta el saldo y el estado de una cuenta. | Cuentas |
| RF-10 | El sistema actualiza el estado de una cuenta entre activa e inactiva. | Cuentas |
| RF-11 | El sistema registra un depósito mayor que cero y suma el monto al saldo. | Depósitos |
| RF-12 | El sistema registra un retiro mayor que cero solo si el saldo alcanza. | Retiros |
| RF-13 | El sistema transfiere un monto entre dos cuentas distintas y actualiza ambos saldos. | Transferencias |
| RF-14 | El sistema rechaza una transferencia hacia la misma cuenta. | Transferencias |
| RF-15 | El sistema guarda cada operación con fecha, tipo, monto, saldos y cuentas. | Movimientos |
| RF-16 | El sistema lista movimientos generales y por cuenta. | Movimientos |
| RF-17 | El sistema busca clientes y cuentas por texto. | Consultas |
| RF-18 | El sistema muestra un reporte con totales de depósitos, retiros y transferencias. | Reportes |
| RF-19 | Las rutas de negocio exigen un token válido, excepto el inicio de sesión. | Autenticación |

## 4. Requerimientos no funcionales

| ID | Requerimiento |
| --- | --- |
| RNF-01 | Frontend en Angular con TypeScript. Backend en Node.js con TypeScript y Express. Base de datos MySQL. |
| RNF-02 | La contraseña se almacena con bcrypt. La sesión de API usa JWT. |
| RNF-03 | Depósitos, retiros y transferencias se confirman o revierten con una transacción SQL. |
| RNF-04 | Los montos se persisten como decimal con dos cifras y deben ser mayores que cero. |
| RNF-05 | Los mensajes de error de negocio se devuelven en español, con un código HTTP coherente. |
| RNF-06 | El repositorio separa frontend, backend, database, docs y postman. |
| RNF-07 | La instalación en Windows queda descrita paso a paso en el README. |
| RNF-08 | No se usan datos financieros reales en código, semillas, pruebas ni manual. |

## 5. Reglas de negocio

| ID | Regla |
| --- | --- |
| RN-01 | Una cuenta debe pertenecer a un cliente. |
| RN-02 | No se permite retirar un monto mayor al saldo disponible. |
| RN-03 | Los depósitos deben ser mayores que cero. |
| RN-04 | Los retiros deben ser mayores que cero. |
| RN-05 | Una transferencia debe tener cuenta origen y cuenta destino válidas. |
| RN-06 | La cuenta origen debe disponer del saldo suficiente. |
| RN-07 | No se debe permitir transferir hacia la misma cuenta. |
| RN-08 | Cada operación queda registrada con fecha, tipo, monto y cuentas involucradas. |
| RN-09 | Una cuenta inactiva no puede realizar operaciones. Tampoco una cuenta cuyo cliente está inactivo. |
| RN-10 | El sistema utiliza únicamente información ficticia. |

Reglas de apoyo, derivadas de las anteriores:

| ID | Regla |
| --- | --- |
| RN-11 | El monto admite como máximo dos decimales y no supera 1 000 000.00 en una sola operación académica. |
| RN-12 | La identificación del cliente y el número de cuenta son únicos. |
| RN-13 | El saldo de una cuenta no puede quedar negativo. |
| RN-14 | La desactivación de un cliente no elimina sus cuentas ni sus movimientos. |

## 6. Historias de usuario

Cada historia usa la forma «Como… quiero… para…» y sirve de base a las pruebas.

### HU-01 Iniciar sesión con credenciales válidas

Como cajero, quiero iniciar sesión con un usuario y una contraseña ficticios para entrar al sistema.

Criterios de aceptación:

- Si el usuario existe, está activo y la contraseña coincide, la API responde con un token y los datos públicos del operador.
- La interfaz guarda el token y muestra el panel principal.
- La contraseña no se devuelve ni se escribe en el historial de movimientos.

Prueba relacionada: P001.

### HU-02 Rechazar un inicio de sesión inválido

Como cajero, quiero que el sistema rechace una contraseña incorrecta para impedir el acceso de quien no conoce la credencial ficticia.

Criterios de aceptación:

- Si el usuario no existe, la contraseña no coincide o el usuario está inactivo, la API responde 401.
- El cuerpo incluye un mensaje de error en español.
- No se entrega token.

Prueba relacionada: P002.

### HU-03 Registrar un cliente

Como cajero, quiero registrar un cliente ficticio para poder abrirle cuentas después.

Criterios de aceptación:

- Los campos identificación, nombres, apellidos y correo son obligatorios.
- El correo debe tener formato de correo. La identificación no se repite.
- Al guardar, el cliente queda activo y puede consultarse por su identificador.

Prueba relacionada: P003.

### HU-04 Consultar y buscar clientes

Como cajero, quiero buscar clientes por nombre, identificación o correo para encontrar una ficha sin recorrer toda la lista.

Criterios de aceptación:

- La lista muestra clientes activos e inactivos, con un filtro de texto.
- La consulta por identificador devuelve la ficha o un error 404 si no existe.

### HU-05 Modificar un cliente

Como cajero, quiero corregir teléfono, dirección, correo o nombres para mantener la ficha al día.

Criterios de aceptación:

- Se actualizan solo los datos enviados y válidos.
- La identificación, si cambia, sigue siendo única.
- Un cliente inactivo puede corregirse, pero no opera cuentas mientras siga inactivo.

### HU-06 Desactivar un cliente

Como cajero, quiero desactivar un cliente sin borrar su historial para que deje de operar y la auditoría se conserve.

Criterios de aceptación:

- La desactivación cambia el indicador activo a falso.
- El registro, sus cuentas y sus movimientos siguen en la base.
- Un segundo intento de desactivación informa que ya estaba inactivo.

### HU-07 Crear una cuenta asociada a un cliente

Como cajero, quiero abrir una cuenta eligiendo cliente y tipo de cuenta para que el saldo empiece en cero y quede vinculado a esa persona.

Criterios de aceptación:

- La cuenta exige un cliente existente y activo, y un tipo de cuenta activo.
- El número de cuenta lo genera el sistema y es único.
- El saldo inicial es 0.00 y el estado inicial es activa.
- La consulta de la cuenta muestra el cliente asociado.

Prueba relacionada: P004.

### HU-08 Consultar saldo y datos de la cuenta

Como cajero, quiero ver el saldo, el estado, el tipo y el cliente de una cuenta para atender una consulta.

Criterios de aceptación:

- La consulta por identificador devuelve saldo con dos decimales, estado y cliente.
- Si la cuenta no existe, la respuesta es 404.

### HU-09 Cambiar el estado de una cuenta

Como cajero, quiero activar o desactivar una cuenta para impedir operaciones cuando corresponda.

Criterios de aceptación:

- Solo se aceptan los estados activa e inactiva.
- El cambio queda guardado y la siguiente consulta lo refleja.

### HU-10 Registrar un depósito

Como cajero, quiero registrar un depósito para aumentar el saldo de una cuenta activa.

Criterios de aceptación:

- El monto es mayor que cero y tiene como máximo dos decimales.
- La cuenta existe, está activa y su cliente está activo.
- Al confirmar, el saldo nuevo es el saldo anterior más el monto.
- Queda un movimiento de tipo depósito con fecha, monto, saldo anterior y saldo posterior.

Prueba relacionada: P005.

### HU-11 Registrar un retiro con saldo suficiente

Como cajero, quiero registrar un retiro cuando hay saldo para disminuir la cuenta y dejar constancia.

Criterios de aceptación:

- El monto es mayor que cero.
- Si el saldo es suficiente, el saldo nuevo es el saldo anterior menos el monto.
- Queda un movimiento de tipo retiro.

Prueba relacionada: P006.

### HU-12 Rechazar un retiro mayor al saldo

Como cajero, quiero que un retiro superior al saldo sea rechazado para no dejar la cuenta en negativo.

Criterios de aceptación:

- Si el monto supera el saldo, la API responde error de negocio y no modifica el saldo.
- No se inserta un movimiento de ese intento rechazado.

Prueba relacionada: P007.

### HU-13 Transferir entre dos cuentas

Como cajero, quiero transferir un monto de una cuenta a otra para actualizar ambos saldos en una sola operación.

Criterios de aceptación:

- Origen y destino existen, están activas y sus clientes están activos.
- El origen tiene saldo suficiente y el monto es mayor que cero.
- El origen disminuye y el destino aumenta por el mismo monto.
- Queda la transferencia y dos movimientos ligados a ella.

Prueba relacionada: P008.

### HU-14 Impedir la transferencia a la misma cuenta

Como cajero, quiero que el sistema rechace una transferencia en la que origen y destino son la misma cuenta.

Criterios de aceptación:

- Si los identificadores coinciden, la operación se rechaza.
- Ningún saldo cambia y no se crea la transferencia.

Prueba relacionada: P009.

### HU-15 Consultar movimientos

Como cajero, quiero ver el historial de una cuenta o del sistema para explicar depósitos, retiros y transferencias.

Criterios de aceptación:

- Cada fila muestra fecha, tipo, monto, cuenta y, si aplica, la cuenta contraparte.
- El listado se ordena del movimiento más reciente al más antiguo.

### HU-16 Bloquear operaciones de una cuenta inactiva

Como cajero, quiero que una cuenta inactiva no acepte depósitos, retiros ni transferencias para respetar su estado.

Criterios de aceptación:

- Un depósito, retiro o transferencia que use una cuenta inactiva se rechaza.
- El saldo de esa cuenta no cambia.

Prueba relacionada: P010.

### HU-17 Consultar clientes y cuentas

Como cajero, quiero una consulta unificada por texto para localizar un cliente o una cuenta y desde ahí ver saldo y movimientos.

Criterios de aceptación:

- El texto vacío no devuelve un error: informa que hace falta un criterio.
- Un texto con coincidencias devuelve clientes y cuentas por separado.

### HU-18 Ver el reporte de operaciones

Como cajero, quiero un resumen de depósitos, retiros y transferencias para conocer la actividad ficticia del periodo.

Criterios de aceptación:

- El reporte muestra cantidad y monto por tipo de operación.
- Muestra clientes activos, cuentas activas e inactivas y el saldo total de las cuentas.
- Acepta un rango opcional de fechas.

## 7. Trazabilidad hacia las pruebas obligatorias

| Prueba | Historia | Resultado esperado |
| --- | --- | --- |
| P001 | HU-01 | El login válido permite el acceso. |
| P002 | HU-02 | El login inválido muestra error. |
| P003 | HU-03 | El cliente queda almacenado. |
| P004 | HU-07 | La cuenta queda asociada al cliente. |
| P005 | HU-10 | El depósito incrementa el saldo. |
| P006 | HU-11 | El retiro disminuye el saldo. |
| P007 | HU-12 | El retiro superior al saldo se rechaza. |
| P008 | HU-13 | La transferencia actualiza ambas cuentas. |
| P009 | HU-14 | La transferencia a la misma cuenta se rechaza. |
| P010 | HU-16 | La cuenta inactiva no permite operaciones. |

## 8. Prioridad

| Prioridad | Historias |
| --- | --- |
| Alta | HU-01, HU-02, HU-03, HU-07, HU-10, HU-11, HU-12, HU-13, HU-14, HU-16 |
| Media | HU-04, HU-05, HU-06, HU-08, HU-09, HU-15, HU-18 |
| Apoyo | HU-17 |
