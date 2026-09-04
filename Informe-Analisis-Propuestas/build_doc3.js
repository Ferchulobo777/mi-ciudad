const fs = require("fs");
const { Document, Packer } = require("docx");
const {
  h1, h2, h3, p, callout, spacer, cell, table, coverBase, toc, headerFooter,
  phonePair, phoneRow, diagramFigure, paletteFigure, CONTENT_WIDTH,
} = require("./helpers");

const OUT = __dirname + "\\3 - Diseño Técnico y Pantallas, Mi Ciudad.docx";

const cover = coverBase({
  titulo: "Diseño Técnico y Pantallas — Mi Ciudad",
  bajada: "Requisitos funcionales y no funcionales, casos de uso, diagrama de clases y pantallas completas de la aplicación, con la paleta Costa Entrerriana",
});

const intro = [
  h1("1. Introducción"),
  p("Este documento reúne el diseño técnico de partida de Mi Ciudad, guía turística de Colón, una vez confirmada como la propuesta elegida para el trabajo integrador. Incluye los requisitos funcionales y no funcionales derivados del PRD, los casos de uso del único actor de la aplicación, el diagrama de clases de las entidades ya definidas en el contrato de datos, y el conjunto completo de pantallas, con la misma paleta de colores inspirada en el paisaje de Colón que ya se presentó en Documentación Oficial del Proyecto."),
  p("La idea de este documento es que el equipo pueda arrancar a programar directamente a partir de acá: qué pantallas construir con Expo Router, qué entidades modelar en TypeScript, y qué comportamiento se espera de cada funcionalidad."),
  callout("Paleta Costa Entrerriana. Azul Río #0B6E8C como color primario, Verde Palmar #3F7D45 como secundario y Terracota Atardecer #D96C3F como acento, con los siete colores de categoría del catálogo. Es la misma paleta ya elegida en Documentación Oficial del Proyecto, aplicada de forma consistente en las trece pantallas y los dos diagramas de este documento."),
];

function rfTable(rows) {
  return table(
    [cell("ID", { header: true, width: 900, center: true }), cell("Requisito funcional", { header: true, width: 8100 })],
    rows.map(([id, texto]) => [id, texto]),
    [900, 8100],
  );
}

const requisitosFuncionales = [
  h1("2. Requisitos funcionales"),
  p("Se agrupan por área funcional, siguiendo las seis áreas de la especificación funcional del proyecto. Cada requisito describe un comportamiento verificable de la aplicación."),

  h2("Cuenta y perfil"),
  rfTable([
    ["RF01", "Registrar una cuenta con nombre, correo electrónico y contraseña."],
    ["RF02", "Iniciar sesión con correo y contraseña, o con huella o rostro si el dispositivo lo soporta y el turista ya inició sesión antes."],
    ["RF03", "Mantener la sesión iniciada entre aperturas de la aplicación, con el token guardado en almacenamiento seguro."],
    ["RF04", "Editar las preferencias del usuario: categorías favoritas, aviso de proximidad y tema de la interfaz."],
    ["RF05", "Cerrar la sesión activa."],
    ["RF06", "Usar el catálogo, el mapa y la agenda sin necesidad de una cuenta. La cuenta solo hace falta para guardar favoritos y el recorrido."],
  ]),
  spacer(),

  h2("Catálogo de lugares"),
  rfTable([
    ["RF07", "Ver el listado completo de lugares turísticos, con filtro por categoría."],
    ["RF08", "Buscar un lugar por nombre."],
    ["RF09", "Ordenar el listado de lugares por distancia al turista."],
    ["RF10", "Ver el detalle de un lugar: fotos, descripción, horarios por día de la semana, teléfono, sitio web, precio de entrada y accesibilidad."],
    ["RF11", "Indicar si un lugar está abierto en el momento, calculado a partir de sus horarios por día."],
  ]),
  spacer(),

  h2("Mapa y cercanía"),
  rfTable([
    ["RF12", "Ver un mapa con todos los lugares marcados y la posición del turista."],
    ["RF13", "Ver una lista de lugares cercanos, ordenada por distancia."],
    ["RF14", "Abrir la aplicación de mapas del teléfono para llegar a un lugar."],
  ]),
  spacer(),

  h2("Agenda de eventos"),
  rfTable([
    ["RF15", "Ver los eventos ordenados por fecha de inicio."],
    ["RF16", "Ver el detalle de un evento: horario, duración, lugar o dirección, precio y si es gratuito."],
    ["RF17", "Guardar un evento con recordatorio."],
    ["RF18", "Avisar cuando un evento se cancela o se suspende."],
  ]),
  spacer(),

  h2("Mi recorrido"),
  rfTable([
    ["RF19", "Registrar una visita a un lugar por código QR, por cercanía o de forma manual."],
    ["RF20", "Asociar una foto y una nota opcional a una visita registrada."],
    ["RF21", "Guardar una visita registrada sin conexión en el teléfono, y sincronizarla cuando vuelve la señal."],
    ["RF22", "Ver el recorrido completo del turista, en orden, con las fotos."],
  ]),
  spacer(),

  h2("Favoritos"),
  rfTable([
    ["RF23", "Marcar y desmarcar un lugar como favorito."],
    ["RF24", "Ver la lista de lugares favoritos."],
  ]),
  spacer(),

  h2("Audioguías"),
  rfTable([
    ["RF25", "Reproducir la audioguía de un lugar con archivo histórico, con pausa, avance y tiempo restante."],
    ["RF26", "Continuar la reproducción de una audioguía con la pantalla apagada."],
  ]),
];

const requisitosNoFuncionales = [
  h1("3. Requisitos no funcionales"),
  p("Condiciones de calidad que la aplicación tiene que cumplir independientemente de la funcionalidad puntual que se esté usando."),
  table(
    [cell("ID", { header: true, width: 900, center: true }), cell("Requisito no funcional", { header: true, width: 8100 })],
    [
      ["RNF01", "Disponibilidad sin conexión: el catálogo, las fichas de lugares y las audioguías ya descargadas tienen que estar disponibles sin conexión a internet."],
      ["RNF02", "Persistencia local: el catálogo se cachea con expo-sqlite, y las visitas sin sincronizar se guardan en una cola local con expo-sqlite kv-store."],
      ["RNF03", "Seguridad: el token de sesión se guarda con expo-secure-store, nunca en almacenamiento sin cifrar."],
      ["RNF04", "Usabilidad: contraste fuerte y letra grande, pensados para uso al sol y con una sola mano."],
      ["RNF05", "Accesibilidad visual: la aplicación respeta el modo oscuro del sistema operativo."],
      ["RNF06", "Rendimiento: las pantallas con listados largos, como el catálogo y la agenda, no bloquean la interacción mientras cargan."],
      ["RNF07", "Compatibilidad: la aplicación corre sobre Expo SDK 57 y React Native 0.86, en Android e iOS."],
      ["RNF08", "Resguardo de permisos: si el turista niega el permiso de ubicación, la aplicación sigue siendo usable con el listado y el mapa, sin posición propia."],
      ["RNF09", "Mantenibilidad: toda lectura de datos pasa por una capa de servicios propia, para poder reemplazar los datos simulados por la API real sin reescribir pantallas."],
      ["RNF10", "Identidad: ícono propio en formato PNG de 1024 por 1024 píxeles sin transparencias, y pantalla de presentación con el nombre del producto."],
    ],
    [900, 8100],
  ),
];

const casosDeUso = [
  h1("4. Casos de uso"),
  p("Mi Ciudad tiene un único rol de usuario: el turista. No hay una vista de administrador ni de operador dentro de la aplicación, así que el turista participa, directa o indirectamente, en todos los casos de uso del sistema."),
  ...diagramFigure("Diagrama-CasosDeUso.png", "Diagrama de casos de uso de Mi Ciudad, agrupados por área funcional. Los candados marcan los casos que requieren sesión iniciada.", 3120 / 2000, 640),
  h2("Descripción de los casos de uso principales"),
  table(
    [
      cell("Caso de uso", { header: true, width: 2200 }),
      cell("Precondición", { header: true, width: 2200 }),
      cell("Flujo principal", { header: true, width: 4600 }),
    ],
    [
      ["Explorar catálogo", "Ninguna", "El turista abre la aplicación, ve el listado de lugares y lo filtra por categoría o lo busca por nombre."],
      ["Ver detalle de lugar", "Ninguna", "El turista selecciona un lugar del catálogo o del mapa y ve su ficha completa: fotos, horarios, precio y accesibilidad."],
      ["Escuchar audioguía", "El lugar tiene audioguía cargada", "Desde el detalle de un lugar, el turista reproduce el audio y puede seguir escuchándolo con la pantalla apagada."],
      ["Registrar visita", "Sesión iniciada", "El turista elige código QR, cercanía o carga manual, agrega foto y nota opcionales, y confirma. Sin conexión, la visita queda encolada."],
      ["Ver mi recorrido", "Sesión iniciada", "El turista ve la lista de lugares visitados, en orden, con las fotos y el estado de sincronización de cada una."],
      ["Marcar o desmarcar favorito", "Sesión iniciada", "El turista marca o desmarca un lugar como favorito desde el catálogo o su detalle."],
      ["Ver agenda de eventos", "Ninguna", "El turista ve los eventos ordenados por fecha y accede al detalle de cada uno."],
      ["Usar la aplicación sin conexión", "Catálogo descargado previamente", "El turista abre la aplicación sin señal y sigue viendo el catálogo y las fichas ya guardadas; las visitas nuevas se encolan hasta que vuelve la conexión."],
    ],
    [2200, 2200, 4600],
  ),
];

const diagramaClases = [
  h1("5. Diagrama de clases"),
  p("Las siete entidades ya están definidas en el contrato de datos preliminar (openapi.yaml). El diagrama agrega las relaciones entre ellas para guiar el modelado en TypeScript de la capa de tipos (src/tipos)."),
  ...diagramFigure("Diagrama-Clases.png", "Diagrama de clases de Mi Ciudad: entidades, atributos principales y relaciones.", 2800 / 1720, 640),
  table(
    [cell("Relación", { header: true, width: 3000 }), cell("Por qué existe", { header: true, width: 6000 })],
    [
      ["Categoria (1) — Lugar (*)", "Cada lugar pertenece a una sola categoría del catálogo; una categoría agrupa muchos lugares."],
      ["Lugar (0..1) — Evento (*)", "Un evento puede ocurrir en un lugar del catálogo o en una dirección suelta (direccionLibre), por eso la relación es opcional."],
      ["Usuario (1) — Preferencias (1)", "Preferencias es un objeto de configuración propio de cada usuario, no una entidad independiente: es una composición, no existe sin el usuario."],
      ["Usuario (1) — Favorito (*) — Lugar (1)", "Favorito es una clase de asociación: registra qué usuario marcó qué lugar y cuándo."],
      ["Usuario (1) — Visita (*) — Lugar (1)", "Visita es la otra clase de asociación central del proyecto: guarda el registro de un recorrido, con su estado de sincronización."],
    ],
    [3000, 6000],
  ),
];

const pantallas = [
  h1("6. Pantallas de la aplicación"),
  p("Las trece pantallas cubren las seis áreas funcionales más la identidad de la aplicación (presentación) y la cuenta (ingreso y registro). Todas comparten la misma paleta Costa Entrerriana, la misma tipografía y los mismos componentes de lista, tarjeta y barra inferior, para que el desarrollo pueda apoyarse en un set reducido de componentes reutilizables."),

  h2("Identidad y acceso"),
  ...phoneRow(
    ["MiCiudad-Splash.png", "MiCiudad-Login.png", "MiCiudad-Registro.png"],
    "Presentación de la aplicación, ingreso y creación de cuenta. La cuenta es opcional para explorar el catálogo y el mapa.",
  ),
  spacer(200),

  h2("Catálogo, mapa y detalle de lugar"),
  ...phoneRow(
    ["MiCiudad-Catalogo.png", "MiCiudad-Home.png", "MiCiudad-Detalle.png"],
    "Listado completo con filtro y buscador, inicio con mapa y cerca tuyo, y ficha completa de un lugar con audioguía.",
  ),
  spacer(200),

  h2("Agenda de eventos"),
  ...phonePair(
    "MiCiudad-Agenda.png", "MiCiudad-EventoDetalle.png",
    "Agenda agrupada por fecha, con aviso de evento suspendido, y el detalle de un evento con opción de guardar recordatorio.",
  ),

  h2("Mi recorrido y favoritos"),
  ...phoneRow(
    ["MiCiudad-RegistrarVisita.png", "MiCiudad-MiRecorrido.png", "MiCiudad-Favoritos.png"],
    "Registrar una visita por QR, cercanía o carga manual; el recorrido completo con estado de sincronización; y la lista de favoritos.",
  ),
  spacer(200),

  h2("Perfil y estado sin conexión"),
  ...phonePair(
    "MiCiudad-Perfil.png", "MiCiudad-SinConexion.png",
    "Perfil del turista con sus preferencias, y el estado de la aplicación funcionando sin conexión: catálogo cacheado y una visita pendiente de subir.",
  ),

  h3("Paleta de referencia"),
  ...paletteFigure("Paletas-MiCiudad.png", "Paleta Costa Entrerriana ya elegida en Documentación Oficial del Proyecto, aplicada en las trece pantallas de este documento."),
];

const doc = new Document({
  creator: "Fernando Rodriguez",
  title: "Diseño Técnico y Pantallas, Mi Ciudad — Trabajo Integrador de Desarrollo para Móviles",
  styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
  sections: [
    {
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } }, titlePage: true },
      ...headerFooter("Diseño Técnico y Pantallas, Mi Ciudad — Trabajo Integrador de Desarrollo para Móviles"),
      children: [
        ...cover, ...toc(), ...intro, ...requisitosFuncionales, ...requisitosNoFuncionales,
        ...casosDeUso, ...diagramaClases, ...pantallas,
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("Written:", OUT, buf.length, "bytes");
});
