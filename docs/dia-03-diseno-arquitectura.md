# Diseño y arquitectura

| Dato | Valor |
| --- | --- |
| Institución | ____________ |
| Curso / Área | Taller 2 |
| Grado y sección | ____________ |
| Docente | ____________ |
| Estudiante | ____________ |
| Modalidad | Trabajo individual |

Los diagramas de esta fase están en `docs/diagramas/`. El modelo lógico detallado y el diagrama entidad-relación se cierran con el script SQL del día de base de datos.

## 1. Decisión de arquitectura

El sistema se divide en tres capas desplegadas en la misma máquina durante el desarrollo:

| Capa | Tecnología | Responsabilidad |
| --- | --- | --- |
| Presentación | Angular y TypeScript | Formularios, navegación, mensajes y consumo de la API. |
| Aplicación | Node.js, Express y TypeScript | Autenticación, reglas de negocio, validación y transacciones. |
| Datos | MySQL 8 | Persistencia relacional de clientes, usuarios, cuentas y operaciones. |

La comunicación entre presentación y aplicación es HTTP con JSON. Las rutas de negocio exigen el encabezado `Authorization: Bearer <token>`. El token es un JWT firmado. La contraseña no viaja después del login y en la base solo se guarda el hash bcrypt.

## 2. Vista de componentes

```
Navegador
  └── Angular
        ├── Login
        ├── Clientes
        ├── Cuentas
        ├── Operaciones (depósito, retiro, transferencia)
        ├── Movimientos
        ├── Consultas
        └── Reporte
              │  HTTPS o HTTP local, JSON, JWT
              ▼
        Express
          ├── middleware de autenticación y errores
          ├── servicios de clientes y cuentas
          └── servicios de operaciones (transacción SQL)
              │  mysql2
              ▼
            MySQL
```

El diagrama correspondiente es `docs/diagramas/arquitectura.svg`.

## 3. Casos de uso

El único actor es el operador autenticado (cajero o administrador). El cliente bancario es un dato, no un usuario de la aplicación.

| Caso de uso | Resultado |
| --- | --- |
| Iniciar sesión | Token si las credenciales son válidas; error en caso contrario. |
| Cerrar sesión | La interfaz olvida el token. |
| Registrar, consultar, modificar y desactivar cliente | Ficha persistida. La baja es lógica. |
| Crear cuenta y consultar saldo | Cuenta ligada a un cliente y a un tipo. |
| Cambiar estado de cuenta | Activa o inactiva. |
| Depositar | Saldo aumentado y movimiento guardado. |
| Retirar | Saldo disminuido o rechazo si no alcanza. |
| Transferir | Dos saldos actualizados o rechazo si la cuenta es la misma, está inactiva o no hay saldo. |
| Consultar movimientos | Historial por cuenta o general. |
| Ver reporte | Totales por tipo de operación. |

El diagrama está en `docs/diagramas/casos-de-uso.svg`.

## 4. Flujos principales

### 4.1 Inicio de sesión

1. El operador escribe usuario y contraseña.
2. La API busca el usuario activo.
3. Compara la contraseña con bcrypt.
4. Si coincide, firma un JWT con identificador, usuario y rol.
5. Si no coincide, responde 401 y un mensaje en español.

Diagrama: `docs/diagramas/flujo-login.svg`.

### 4.2 Depósito

1. Validar el monto (mayor que cero, máximo dos decimales, tope académico).
2. Abrir una transacción y bloquear la cuenta.
3. Comprobar que la cuenta existe, está activa y el cliente está activo.
4. Sumar el monto al saldo.
5. Insertar el movimiento con saldo anterior, saldo posterior, fecha y usuario.
6. Confirmar. Cualquier fallo revierte la transacción.

Diagrama: `docs/diagramas/flujo-deposito.svg`.

### 4.3 Retiro

El flujo repite el del depósito y agrega la comparación contra el saldo. Si el monto es mayor, se revierte y no queda movimiento. Diagrama: `docs/diagramas/flujo-retiro.svg`.

### 4.4 Transferencia

1. Rechazar si origen y destino son la misma cuenta.
2. Bloquear las dos filas en orden de identificador, para reducir el riesgo de bloqueo cruzado.
3. Comprobar existencia, estado, cliente activo y saldo del origen.
4. Restar en origen, sumar en destino, insertar la transferencia y dos movimientos que la referencian.
5. Confirmar o revertir todo junto.

Diagrama: `docs/diagramas/flujo-transferencia.svg`.

## 5. Decisiones de diseño

| Decisión | Motivo |
| --- | --- |
| El cliente bancario no tiene contraseña | El alcance pide un operador que registra clientes, no una banca personal. |
| Baja lógica de cliente | El enunciado pide desactivación y conservar el historial. |
| Estado de cuenta distinto del cliente | La regla 9 habla de la cuenta. Un cliente inactivo también bloquea operaciones para no seguir usando sus cuentas. |
| Movimiento y transferencia separados | La transferencia es la operación entre dos cuentas. Cada cuenta necesita su propio movimiento de salida o entrada. |
| Montos en `DECIMAL(15,2)` | Evita el error de binario de los números de punto flotante en el saldo guardado. |
| Tope de 1 000 000.00 por operación | Límite por operación para rechazar montos fuera de rango. |
| Dos roles, mismo permiso operativo | El trabajo es individual y el alcance no pide permisos distintos. El rol igual queda guardado en el token y en la operación. |

## 6. Manejo de errores previsto

| Situación | HTTP | Efecto en datos |
| --- | --- | --- |
| Credenciales inválidas | 401 | Ninguno |
| Token ausente o vencido | 401 | Ninguno |
| Recurso inexistente | 404 | Ninguno |
| Regla de negocio incumplida | 400 | Ninguno; la transacción se revierte |
| Identificador duplicado | 409 | Ninguno |
| Fallo interno | 500 | La transacción abierta se revierte |

## 7. Seguridad académica

- Las credenciales de prueba se documentan en el README («Credenciales ficticias de prueba») y no aparecen en la interfaz.
- El secreto JWT de desarrollo es una clave de práctica, no un secreto de producción.
- No hay números de tarjeta ni documentos reales.
- CORS permite el origen del frontend de desarrollo.
