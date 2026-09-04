const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, WidthType, TableRow } = require("docx");
const { h1, h2, h3, p, spacer, cell, multiCell, table, CONTENT_WIDTH, coverBase, toc, headerFooter, phonePair, paletteFigure } = require("./helpers");
const { Table } = require("docx");

const OUT = __dirname + "\\1 - Propuestas de Desarrollo.docx";

const cover = coverBase({
  titulo: "Propuestas de Desarrollo",
  bajada: "Evaluación de las cinco propuestas de aplicación publicadas por la cátedra para el trabajo integrador, con ventajas, riesgos, cuadro comparativo y recomendación de elección",
});

const intro = [
  h1("1. Introducción"),
  p("La cátedra de Desarrollo para Móviles publicó en el campus virtual cinco propuestas de aplicación móvil, cada una redactada como el pedido real de un organismo público o una entidad de la provincia de Entre Ríos. El trabajo integrador de la materia exige que el equipo elija una de estas cinco propuestas y la desarrolle por completo, cumpliendo los requisitos mínimos fijados en la consigna de entrega."),
  p("Este documento reúne las cinco propuestas recibidas, compara su complejidad técnica y su alcance funcional, y fundamenta una recomendación de elección para el equipo. La consigna completa del trabajo integrador, la especificación de la propuesta elegida y el resto de la documentación técnica del proyecto se desarrollan por separado en el documento Documentación Oficial del Proyecto."),
];

function propuesta(titulo, subtitulo, contexto, quePide, puntoDificil, ventajas, riesgos, imagenes) {
  return [
    h2(titulo),
    p(subtitulo, { italics: true, color: "555555", size: 20 }),
    h3("Contexto"),
    p(contexto),
    h3("Qué pide la aplicación"),
    p(quePide),
    h3("El punto técnico más exigente"),
    p(puntoDificil),
    h3("Pantallas de referencia"),
    ...phonePair(imagenes.screens[0], imagenes.screens[1], imagenes.screensCaption),
    h3("Opciones de paleta de color"),
    ...paletteFigure(imagenes.palette, imagenes.paletteCaption),
    new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      columnWidths: [4500, 4500],
      rows: [
        new TableRow({ tableHeader: true, children: [cell("Ventajas", { header: true, width: 4500 }), cell("Riesgos y puntos de atención", { header: true, width: 4500 })] }),
        new TableRow({ cantSplit: true, children: [multiCell(ventajas, { width: 4500 }), multiCell(riesgos, { width: 4500 })] }),
      ],
    }),
    spacer(300),
  ];
}

const propuestas = [
  h1("2. Las cinco propuestas"),
  p("La cátedra publicó cinco propuestas, cada una escrita por un referente real de un organismo de Entre Ríos, con el mismo formato: contexto del pedido, seis áreas funcionales, mockups de referencia, consideraciones de uso, alcance excluido de esta primera versión y definición de las entidades de datos. Las seis capacidades de dispositivo obligatorias, cámara, ubicación y mapa, notificaciones, persistencia y red, seguridad con autenticación biométrica, y sensores o háptica, aparecen en las cinco propuestas por igual. Lo que varía entre ellas es el dominio, la cantidad de roles de usuario dentro de la misma aplicación y la dificultad real del problema de negocio que hay detrás."),

  ...propuesta(
    "2.1 Mi Ciudad",
    "Guía turística de Colón. Dirección de Turismo de la Municipalidad de Colón.",
    "La Dirección de Turismo de Colón pide una aplicación que reemplace el mostrador de la terminal, un mapa plastificado y los folletos impresos por una guía digital centralizada, pensada para el turista que camina por la ciudad y necesita saber qué tiene alrededor.",
    "La aplicación organiza un catálogo de lugares turísticos con horarios, precio y accesibilidad, un mapa con filtro por categoría y por distancia, una agenda de eventos, un registro de visitas hecho por código QR o por cercanía con foto y nota asociada, favoritos con cuenta de usuario, y reproducción de audioguías grabadas para los lugares con archivo histórico.",
    "Buena parte del Parque Nacional El Palmar no tiene señal de datos, y es justamente donde más se usa la aplicación. El catálogo, las fotos y las audioguías tienen que quedar disponibles sin conexión, y el registro de una visita hecho sin señal se guarda primero en el teléfono y se sube solo cuando vuelve la conexión.",
    [
      "Un solo rol de usuario, el turista, sin necesidad de una vista administrativa dentro de la aplicación.",
      "Es la única propuesta que usa de manera orgánica las diez capacidades pedidas por la cátedra, incluyendo audio y video, sin forzar ninguna.",
      "El escenario sin señal del Parque Nacional está descrito con precisión y da un caso de prueba claro para la cola de sincronización.",
      "Narrativa de demostración atractiva, apta para una defensa oral amena.",
    ],
    [
      "La reproducción de audioguías con la pantalla apagada exige configurar reproducción en segundo plano, algo que no se vio todavía en la teoría de la materia.",
      "Seis entidades de datos con relaciones entre lugares, categorías y eventos piden un volumen de datos de prueba mayor que el de un catálogo simple.",
      "Los horarios variables por día y por temporada, como el de las termas, exigen una lógica de abierto ahora cuidadosa.",
    ],
    {
      screens: ["MiCiudad-Home.png", "MiCiudad-Detalle.png"],
      screensCaption: "Inicio con mapa y cerca tuyo, y detalle de un lugar con audioguía.",
      palette: "Paletas-MiCiudad.png",
      paletteCaption: "Tres opciones de paleta. La marcada como elegida es la que ya está en las pantallas de arriba.",
    },
  ),

  ...propuesta(
    "2.2 Reporte Ciudadano",
    "Municipalidad de Gualeguaychú. Centro de Atención al Vecino.",
    "El Centro de Atención al Vecino de Gualeguaychú pide reemplazar una planilla compartida y un WhatsApp saturado por una aplicación donde el vecino reporta problemas de la vía pública con foto y ubicación, y recibe un número de seguimiento.",
    "La aplicación permite crear un reporte en menos de un minuto con foto obligatoria, ubicación tomada del GPS o corregida a mano, y descripción escrita o grabada. El vecino sigue el estado del reclamo en cinco etapas y ve un mapa de reportes públicos con detección de reclamos duplicados cercanos. Una segunda vista, para el operador municipal, permite cambiar el estado, asignar una cuadrilla y cerrar el reclamo con una foto del arreglo.",
    "El municipio pide que, antes de crear un reporte nuevo, la aplicación muestre los reportes existentes a menos de cincuenta metros para evitar duplicados, y que cada reporte quede asociado automáticamente a una de las cuatro zonas de mantenimiento según donde cayó el punto en el mapa.",
    [
      "Narrativa de producto muy clara, un problema real resuelto de punta a punta, con foto del problema y foto del arreglo.",
      "La foto obligatoria y la cola de reportes sin conexión dan un caso de prueba concreto para persistencia y red.",
      "Los cinco estados con comentario arman una máquina de estados simple y fácil de explicar en la defensa.",
    ],
    [
      "Dos roles dentro de la misma aplicación, vecino y operador, duplican la cantidad de pantallas y de permisos a construir y a probar.",
      "La detección de duplicados por distancia y la asignación automática de zona por polígono agregan geometría que no forma parte de la teoría vista en la materia.",
      "La gestión de cuadrillas y zonas es una superficie de administración adicional que no suma directamente a ninguno de los requisitos mínimos.",
    ],
    {
      screens: ["Reporte-Nuevo.png", "Reporte-Detalle.png"],
      screensCaption: "Crear un reporte con foto obligatoria, y el detalle con la línea de tiempo del reclamo.",
      palette: "Paletas-Reporte.png",
      paletteCaption: "Tres opciones de paleta. La marcada como elegida es la que ya está en las pantallas de arriba.",
    },
  ),

  ...propuesta(
    "2.3 Transporte Público",
    "Dirección de Transporte de la Municipalidad de Paraná.",
    "La Dirección de Transporte de Paraná pide una aplicación para que el pasajero sepa qué líneas hay, dónde están las paradas cercanas, a qué hora pasa cada colectivo según la tabla de horarios, y se entere el mismo día de un desvío o una suspensión.",
    "La aplicación muestra las catorce líneas urbanas con su recorrido dibujado en el mapa en los dos sentidos, la lista de paradas con los próximos horarios, avisos de desvío con recorrido alternativo y video corto, un reporte de demora cargado por los propios pasajeros, y favoritos con recordatorio de horario.",
    "La Dirección aclara que no hay GPS instalado en los colectivos, así que los horarios que muestra la aplicación son siempre los de la tabla, nunca una posición en tiempo real, y que cada línea tiene un recorrido distinto de ida y de vuelta, con su propia lista de paradas para cada sentido.",
    [
      "Un solo rol de usuario, sin vista de operador dentro de la aplicación, ya que los avisos los carga la Dirección desde otro sistema.",
      "La separación entre datos estáticos, guardados sin conexión, y datos vivos, que necesitan red y avisan cuando quedaron viejos, es un patrón de arquitectura claro y fácil de explicar en la defensa.",
      "Al no depender de una posición GPS en tiempo real, el alcance queda acotado y no exige integrar una fuente de datos externa en movimiento.",
    ],
    [
      "Catorce líneas con dos sentidos cada una y su propia lista de paradas y horarios piden el volumen de datos de prueba más alto de las cinco propuestas.",
      "Calcular los próximos horarios de una parada a partir de una tabla en formato hora y minuto, con el cambio de día y las variantes de habil, sábado, domingo y feriado, es una lógica de fechas propensa a errores sutiles.",
      "Es la propuesta con el atractivo de demostración más bajo de las cinco: resuelve un problema real, pero no tiene un momento fuerte para mostrar en quince minutos de defensa.",
    ],
    {
      screens: ["Transporte-Home.png", "Transporte-Parada.png"],
      screensCaption: "Inicio con las paradas favoritas y avisos, y el detalle de una parada con próximos horarios.",
      palette: "Paletas-Transporte.png",
      paletteCaption: "Tres opciones de paleta. La marcada como elegida es la que ya está en las pantallas de arriba.",
    },
  ),

  ...propuesta(
    "2.4 Directorio de Comercios",
    "Centro Comercial, Industrial y de Servicios de Concepción del Uruguay.",
    "El Centro Comercial de Concepción del Uruguay pide reemplazar una guía impresa anual, desactualizada meses después de imprimirse, por un directorio digital de los 640 comercios asociados, con promociones y reseñas.",
    "La aplicación permite buscar y filtrar comercios por rubro y por si están abiertos ahora, ver promociones vigentes con un código que el comercio valida escaneando el teléfono del cliente, y dejar reseñas con respuesta del comercio. Una segunda vista, para el comercio asociado, permite editar la ficha propia y cargar promociones.",
    "El estado abierto ahora no llega de la API: se calcula en el teléfono cruzando los horarios cargados del comercio con la hora del dispositivo, incluyendo el corte de mediodía y las variantes de sábado y de temporada, y es, según el propio referente, el punto donde más se equivoca este tipo de aplicación.",
    [
      "El uso de la cámara en dos sentidos, mostrar un código propio y escanear el código de otra persona, es una manera clara y demostrable de cubrir el requisito de cámara del integrador.",
      "Las reseñas con puntaje, respuesta del comercio y reporte de abuso son un patrón conocido, de bajo riesgo técnico.",
      "Caso de uso con un negocio real detrás, util para justificar el proyecto ante la cátedra.",
    ],
    [
      "Dos roles dentro de la misma aplicación, vecino y comercio, con la misma duplicación de pantallas y permisos que aparece en Reporte Ciudadano.",
      "El cálculo de abierto ahora, con horarios partidos al mediodía y variantes por día, es la lógica de fechas más delicada de las cinco propuestas.",
      "La moderación de reseñas reportadas agrega una funcionalidad más que no forma parte de los requisitos mínimos evaluados.",
    ],
    {
      screens: ["Directorio-Busqueda.png", "Directorio-Ficha.png"],
      screensCaption: "Búsqueda con filtro de abierto ahora, y la ficha de un comercio con promoción y reseñas.",
      palette: "Paletas-Directorio.png",
      paletteCaption: "Tres opciones de paleta. La marcada como elegida es la que ya está en las pantallas de arriba.",
    },
  ),

  ...propuesta(
    "2.5 Reservas Deportivas",
    "Dirección de Deportes de la Municipalidad de Villaguay.",
    "La Dirección de Deportes de Villaguay pide reemplazar un sistema de reservas hecho a mano, por WhatsApp y dos libretas distintas, por una aplicación donde el usuario ve la disponibilidad real de las canchas y reserva solo.",
    "La aplicación muestra una grilla de turnos de una hora por espacio y por día, permite reservar en dos toques y cancelar hasta cuatro horas antes, y genera un código QR que el encargado escanea en la puerta para registrar el ingreso. Una segunda y tercera vista, de encargado y de administrador, permiten bloquear turnos por mantenimiento y cargar reservas fijas semanales.",
    "Hay grupos y clubes con horarios fijos semanales que ocupan el mismo turno todas las semanas sin reservarlo cada vez. La grilla de un día tiene que cruzar los turnos reservados sueltos con esas reglas fijas y con los bloqueos por mantenimiento, y el propio referente advierte que resolver bien ese cruce es lo que decide si la aplicación sirve o no.",
    [
      "La grilla de disponibilidad, con su cruce de turnos, reservas fijas y bloqueos, es el problema de modelado más sustancioso de las cinco propuestas, y una excelente base para explicar decisiones de diseño en la defensa oral.",
      "El catálogo de espacios es el más chico de los cinco, once espacios en total, lo que reduce el volumen de datos de prueba a preparar.",
      "El ingreso por código QR escaneado por el encargado es una demostración corta y contundente.",
    ],
    [
      "Es la propuesta con más roles, jugador, encargado y administrador, lo que multiplica la cantidad de pantallas, permisos y casos de prueba.",
      "Si el cruce entre turnos, reservas fijas y bloqueos se subestima, es el punto con mayor riesgo real de no llegar completo a la fecha de entrega, algo que el propio cliente señala en su pedido.",
      "El límite de tres reservas activas por persona y el registro de cancelaciones tardias son reglas de negocio adicionales a validar.",
    ],
    {
      screens: ["Reservas-Grilla.png", "Reservas-MiReserva.png"],
      screensCaption: "Grilla de turnos de un espacio y un día, y la reserva con el código QR de ingreso.",
      palette: "Paletas-Reservas.png",
      paletteCaption: "Tres opciones de paleta. La marcada como elegida es la que ya está en las pantallas de arriba.",
    },
  ),
];

const comparativo = [
  h1("3. Cuadro comparativo"),
  p("Para ordenar la decisión del equipo se evaluaron las cinco propuestas en seis dimensiones, en una escala de uno, complejidad baja, a cinco, complejidad alta. Los valores son una estimación cualitativa del equipo a partir de la lectura de cada PRD, no una medición formal."),
  table(
    [
      cell("Dimensión", { header: true, width: 3000 }),
      cell("Mi Ciudad", { header: true, width: 1200, center: true }),
      cell("Reporte Ciudadano", { header: true, width: 1200, center: true }),
      cell("Transporte Público", { header: true, width: 1200, center: true }),
      cell("Directorio Comercios", { header: true, width: 1200, center: true }),
      cell("Reservas Deportivas", { header: true, width: 1300, center: true }),
    ],
    [
      ["Complejidad de dominio y datos", "3", "3", "4", "3", "5"],
      ["Cantidad de roles de usuario", "1", "2", "1", "2", "3"],
      ["Cobertura orgánica de las capacidades obligatorias", "5", "4", "4", "4", "4"],
      ["Riesgo de lógica de negocio, fechas y cruces", "2", "3", "4", "4", "5"],
      ["Volumen de datos de prueba a preparar", "3", "3", "5", "4", "2"],
      ["Potencial de defensa oral", "4", "5", "3", "3", "5"],
    ],
    [3000, 1200, 1200, 1200, 1200, 1300],
    { center: true },
  ),
  spacer(),
  p("El orden de recomendación que surge de este cuadro, desarrollado en la sección siguiente, es: primero Mi Ciudad, segundo Reservas Deportivas, tercero Reporte Ciudadano, cuarto Directorio de Comercios y quinto Transporte Público."),
];

const recomendación = [
  h1("4. Evaluación y recomendación"),
  p("Para esta recomendación se priorizó, en este orden, que el proyecto se pueda terminar completo dentro del cuatrimestre, que las capacidades obligatorias aparezcan de forma natural en el uso real de la aplicación y no como un agregado forzado solo para cumplir la consigna, y que el problema tenga una pieza de lógica lo bastante sustanciosa como para sostener una buena defensa oral, sin ser tan compleja como para poner en riesgo la entrega."),

  h2("Primera opción: Mi Ciudad"),
  p("Mi Ciudad es la recomendación principal del equipo. Al tener un solo rol de usuario, el turista, evita duplicar pantallas y lógica de permisos, lo que reduce el riesgo más común en un primer proyecto grupal de React Native con una fecha de entrega fija. Es además la única propuesta que integra las capacidades del dispositivo de manera orgánica, incluyendo audio y video, a través de funcionalidades que un turista realmente usaría. El escenario sin señal dentro del Parque Nacional El Palmar da un caso de prueba concreto y bien delimitado para el requisito de persistencia y conectividad."),

  h2("Segunda opción: Reservas Deportivas"),
  p("Reservas Deportivas es la recomendación para un equipo que priorice mostrar en la defensa una pieza de lógica de negocio genuinamente compleja. El cruce entre turnos sueltos, reservas fijas semanales y bloqueos por mantenimiento es el problema de modelado más interesante de las cinco propuestas, y coincide exactamente con lo que la cátedra evalúa en la defensa oral: poder explicar cada línea de una decisión de diseño propia. El riesgo principal es tener tres roles de usuario distintos, jugador, encargado y administrador, lo que exige empezar temprano con el motor de disponibilidad."),

  h2("Tercera opción: Reporte Ciudadano"),
  p("Reporte Ciudadano tiene la narrativa de producto más clara de las cinco, con un recorrido de punta a punta fácil de mostrar en una demostración corta. Su costo está en dos roles de usuario dentro de la misma aplicación y en funcionalidades de geometría, detección de reportes duplicados por distancia y asignación de zona por polígono, que no forman parte de la teoría vista hasta el momento en la materia."),

  h2("Cuarta opción: Directorio de Comercios"),
  p("Directorio de Comercios comparte con Reporte Ciudadano el costo de dos roles de usuario, y suma una lógica de horarios particularmente delicada para calcular si un comercio está abierto en el momento. Es una propuesta sólida, pero con menos margen de diferenciación en la defensa frente a las otras cuatro."),

  h2("Quinta opción: Transporte Público"),
  p("Transporte Público es técnicamente viable y con un solo rol de usuario, pero exige preparar el volumen de datos de prueba más grande de las cinco propuestas, catorce líneas con dos sentidos cada una, y resolver una lógica de horarios fina sin que la aplicación tenga, a cambio, un momento fuerte de demostración en la defensa oral."),

  h2("Conclusión"),
  p("Esta recomendación queda sujeta a la confirmación del equipo completo, y puede revisarse una vez que se conozcan las preferencias e intereses de todos los integrantes. A partir de la propuesta que el equipo confirme, la documentación técnica del proyecto continúa en el documento Documentación Oficial del Proyecto, que incluye la consigna completa, la especificación funcional, el contrato de datos con la API y el diseño de interfaz."),
];

const doc = new Document({
  creator: "Fernando Rodriguez",
  title: "Propuestas de Desarrollo, Trabajo Integrador de Desarrollo para Móviles",
  styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
  sections: [
    {
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } }, titlePage: true },
      ...headerFooter("Propuestas de Desarrollo, Trabajo Integrador de Desarrollo para Móviles"),
      children: [...cover, ...toc(), ...intro, ...propuestas, ...comparativo, ...recomendación],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("Written:", OUT, buf.length, "bytes");
});
