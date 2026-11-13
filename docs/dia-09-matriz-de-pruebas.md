# Matriz de pruebas

| Dato | Valor |
| --- | --- |
| Institución | ____________ |
| Curso / Área | Taller 2 |
| Grado y sección | ____________ |
| Docente | ____________ |
| Estudiante | ____________ |
| Modalidad | Trabajo individual |
| Fecha de ejecución | ____________ |

Las pruebas se ejecutaron contra MySQL real. El detalle automático está en `docs/evidencias/resultado-jest-p001-p010.txt` y `docs/evidencias/resultado-newman-p001-p010.txt`.

| ID | Prueba | Precondición | Pasos resumidos | Resultado esperado | Resultado obtenido | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| P001 | Login válido | Usuario cajero activo en la semilla | POST /api/auth/login con Cajero123! y consultar /api/auth/yo | Acceso con token | Aprobada. HTTP 200 y token | Jest y Newman |
| P002 | Login inválido | Misma base | Contraseña incorrecta y usuario inactivo | Mensaje de error, sin token | Aprobada. HTTP 401 | Jest y Newman |
| P003 | Registrar cliente | Operador autenticado | POST /api/clientes y GET por id | Cliente almacenado | Aprobada. HTTP 201 y consulta posterior | Jest y Newman |
| P004 | Crear cuenta | Cliente recién creado | POST /api/cuentas | Cuenta asociada, saldo 0, estado activa | Aprobada | Jest y Newman |
| P005 | Depósito válido | Cuenta activa con saldo conocido | POST /api/depositos | Saldo incrementado | Aprobada. 20.00 + 15.50 = 35.50 | Jest y Newman |
| P006 | Retiro con saldo | Cuenta con saldo suficiente | POST /api/retiros | Saldo disminuido | Aprobada. 80.00 − 30.25 = 49.75 | Jest y Newman |
| P007 | Retiro superior al saldo | Cuenta con 40.00 | Intentar retirar 40.01 | Operación rechazada y saldo igual | Aprobada. Código SALDO_INSUFICIENTE | Jest y Newman |
| P008 | Transferencia válida | Dos cuentas con saldo | POST /api/transferencias | Ambas cuentas actualizadas y referencia TRF | Aprobada. 100 − 25.40 y 10 + 25.40 | Jest y Newman |
| P009 | Transferencia a la misma cuenta | Una cuenta con saldo | Origen y destino iguales | Operación rechazada | Aprobada. Código MISMA_CUENTA | Jest y Newman |
| P010 | Cuenta inactiva | Cuenta con saldo, luego estado inactiva | Depósito, retiro y transferencia de entrada y de salida | Ninguna operación | Aprobada. Código CUENTA_INACTIVA y saldo sin cambio | Jest y Newman |

Resumen: 10 de 10 pruebas obligatorias aprobadas en Jest. La colección Postman ejecutó 19 solicitudes y 13 afirmaciones, sin fallos.
