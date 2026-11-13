# Registro de errores y correcciones

| Dato | Valor |
| --- | --- |
| Institución | ____________ |
| Curso / Área | Taller 2 |
| Grado y sección | ____________ |
| Docente | ____________ |
| Estudiante | ____________ |
| Modalidad | Trabajo individual |

Los errores de esta tabla aparecieron al ejecutar el sistema durante el desarrollo. No son casos hipotéticos.

| ID | Dónde apareció | Error observado | Causa | Corrección | Cómo se comprobó |
| --- | --- | --- | --- | --- | --- |
| E-01 | POST /api/clientes y POST /api/cuentas | MySQL respondió 500 con `Data too long for column 'codigo'` y el mismo fallo en `numero_cuenta`. | El valor temporal era `TMP-` más un UUID de 36 caracteres. Las columnas son VARCHAR(20). | El temporal pasó a ser un prefijo `TMP` y 12 caracteres de `randomUUID`, que caben en la columna. Después se sustituye por CLI-0000 o 100-00000000. | Un alta de cliente devolvió 201 y la cuenta asociada también. |
| E-02 | El mismo alta, justo después de E-01 | `TypeError: crypto.randomBytes is not a function`. | En Node el objeto global `crypto` es Web Crypto y no tiene `randomBytes`. Ese método pertenece al módulo `node:crypto`. | Se dejó de llamar `randomBytes` y se usó `crypto.randomUUID()`. | El alta volvió a responder 201. |
| E-03 | Barra lateral de la interfaz | El botón Cerrar sesión se veía como un óvalo vacío. | El estilo secundario pintaba el texto en azul marino, el mismo color del fondo de la barra. | El botón de la sesión usa texto y borde claros. | La captura posterior muestra el texto Cerrar sesión. |
| E-04 | Marca de la barra | «Banco de aula» y «Datos ficticios» quedaban pegados en una sola línea. | `strong` y `small` son en línea y la columna es estrecha. | El bloque de la marca se apila en columna. | La captura del panel muestra las dos líneas separadas. |
| E-05 | Fechas de nacimiento en pantalla | Una fecha AAAA-MM-DD puede mostrarse como el día anterior en husos al oeste de UTC. | `new Date('1990-04-12')` se interpreta como medianoche UTC. | Esas fechas se formatean por partes, sin convertirlas a instante. | Revisión del formateador con una fecha de la semilla. |
| E-06 | Conversión del diagrama entidad-relación | librsvg rechazó `erd.svg` por `Attribute fill redefined`. | El grupo de las relaciones repetía el atributo `fill`. | Se dejó un solo `fill`. Los textos ya traen su propio color. | `erd.png` se generó y muestra las seis entidades. |

Observación de pruebas: Jest termina con `--forceExit` porque el pool de MySQL puede dejar un manejador abierto después de `cerrarPool()`. Las diez pruebas pasan antes de esa salida. No cambia el resultado funcional.
