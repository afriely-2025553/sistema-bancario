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
| E-07 | Pantalla de acceso | Debajo del formulario se mostraban usuarios y contraseñas de prueba. | Se dejaron como ayuda durante el desarrollo. | Se retiraron de la interfaz. Las credenciales quedan solo en el README, en «Credenciales ficticias de prueba». | Captura 01-login sin credenciales; P001 y P002 siguen aprobadas. |
| E-08 | Textos de la interfaz y semilla | «Banco de aula», «Datos ficticios», «Usuario cajero ficticio», «Cliente Ficticio 001» y correos @correo-ficticio.test en pantallas y datos. | Se marcaba lo ficticio en cada texto en lugar de declararlo una vez en la documentación. | Nombre «Banco Ceiba», clientes y operadores con nombres verosímiles, correos @correo.test y descripciones de movimientos neutras. La regla 10 sigue en la documentación. | Búsqueda de «ficti» en frontend/src sin resultados; Jest y Newman aprobados. |
| E-09 | Mensaje de identificador inválido de la API | Respondía «La cuenta no es válido». | La plantilla `${etiqueta} no es válido` no concordaba en género. | Ahora responde «El identificador de la cuenta no es válido» o «El identificador del cliente no es válido». | Petición GET /api/cuentas/abc con token. |
| E-10 | Desactivar cliente y cambiar estado de cuenta | El cliente se desactivaba con el confirm del navegador y el estado de la cuenta cambiaba sin confirmación. | No había un componente de confirmación propio. | Diálogo de confirmación accesible con el resumen de la acción y sus efectos. | Capturas 09-cliente-confirmar-desactivar y 16b. |
| E-11 | Operaciones | No mostraba el saldo disponible ni pedía confirmación; el saldo insuficiente solo se conocía al responder la API. | Formulario mínimo sin los datos de la cuenta elegida. | Resumen de la cuenta, validación del monto en el campo (decimales, límite y saldo), confirmación y comprobante con saldo anterior y nuevo. | Capturas 14, 14b y 15; P007 sigue rechazando en la API. |
| E-12 | Consultas | Al abrir la vista no había indicación; sin resultados aparecían dos tarjetas vacías. | Solo se dibujaba el bloque de resultados. | Estado inicial con instrucciones y ejemplos, mensaje de «sin resultados» y tablas con estado y saldo. | Capturas 18, 19 y 20. |
| E-13 | Listas y tablas | Sin paginación, filtro por estado, indicador de carga ni reintento; las horas «a. m.» partían las filas en dos líneas. | Formato de 12 horas de es-GT y tablas sin control de ajuste. | Paginación, filtros, indicador de carga, reintento, fechas dd/mm/aaaa hh:mm y montos alineados con signo. | Capturas 04, 10 y 17. |
| E-14 | Navegación en pantallas angostas | El menú lateral completo se apilaba encima del contenido. | La rejilla pasaba a una columna sin menú plegable. | Barra superior con botón Menú y panel lateral que se cierra al navegar o con Escape. | Capturas 22 y 22b. |
| E-15 | Rutas de la interfaz | La edición del cliente ocupaba /clientes/:id y cualquier dirección inexistente llevaba al inicio sin aviso. | No existía la ficha del cliente y la ruta comodín redirigía. | Ficha en /clientes/:id, edición en /clientes/:id/editar y página «Página no encontrada». | Capturas 07, 08 y 21b. |

Observación de pruebas: Jest termina con `--forceExit` porque el pool de MySQL puede dejar un manejador abierto después de `cerrarPool()`. Las diez pruebas pasan antes de esa salida. No cambia el resultado funcional.
