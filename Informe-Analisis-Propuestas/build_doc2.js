const fs = require("fs");
const { Document, Packer } = require("docx");
const {
  h1, h2, p, callout, spacer, cell, table, swatchTable, categoriaSwatchTable,
  coverBase, toc, headerFooter,
} = require("./helpers");

const OUT = __dirname + "\\2 - Documentación Oficial del Proyecto.docx";

const cover = coverBase({
  titulo: "Documentación Oficial del Proyecto",
  bajada: "Consigna del trabajo integrador, especificación funcional, contrato de datos con la API y diseño de interfaz de la aplicación elegida",
});

const intro = [
  h1("1. Introducción"),
  p("Este documento reúne la documentación técnica oficial del trabajo integrador de Desarrollo para Móviles: la consigna completa fijada por la cátedra, la especificación funcional del proyecto elegido, el contrato de datos que va a usar la aplicación mientras la API de la cátedra no esté disponible, y el diseño de interfaz."),
  p("El análisis comparativo de las cinco propuestas recibidas y la justificación de la elección del proyecto se desarrollan por separado, en el documento Propuestas de Desarrollo. Este documento parte de esa elección y la documenta en detalle."),
  callout("El proyecto que se documenta a continuación, Mi Ciudad, guía turística de Colón, es la propuesta recomendada en el documento Propuestas de Desarrollo. Queda sujeto a la confirmación final del equipo completo. Las secciones de diseño de interfaz y arquitectura se completan a medida que el equipo construye las primeras pantallas de la aplicación."),
];

const consigna = [
  h1("2. La consigna del trabajo integrador"),
  h2("Objetivo"),
  p("La cátedra pide desarrollar y entregar la versión final de la aplicación móvil solicitada por el cliente en el PRD asignado al grupo, construida con React Native y Expo. La aplicación debe integrar servicios del dispositivo, consumo de la API de la cátedra, persistencia local y resguardo de credenciales, y se entrega como un build instalable, no como código para compilar."),
  h2("Formato de entrega"),
  p("El trabajo es grupal, con los mismos integrantes declarados por el equipo. La entrega incluye el enlace de un build de release generado con el perfil preview de EAS, instalable y usable sin depender de Metro ni de la computadora de ningún integrante, junto con el código fuente en un repositorio Git o un archivo comprimido. El código fuente debe incluir los archivos eas.json y app.json, y excluir la carpeta node_modules."),
  h2("Defensa oral"),
  p("La entrega incluye una defensa oral obligatoria, grupal, de quince a veinte minutos, en la fecha que informe la cátedra. Se demuestra la aplicación funcionando en un teléfono, con Expo Go o con el build entregado, y cada integrante explica la parte que desarrolló y responde preguntas sobre su código. El uso de asistentes de inteligencia artificial está permitido durante el desarrollo, pero no durante la defensa: lo que se evalúa es que el equipo pueda explicar cada línea de lo que entrega. Sin defensa no hay integrador aprobado, aunque la entrega esté completa."),
  h2("Requisitos mínimos de la aplicación"),
  p("Los siguientes diez puntos se verifican sobre la aplicación entregada. No son ejemplos ni sugerencias, sino condiciones de aprobación."),
  table(
    [cell("N", { header: true, width: 500, center: true }), cell("Requisito", { header: true, width: 2200 }), cell("Detalle", { header: true, width: 6300 })],
    [
      ["1", "Pantallas y navegación", "Las pantallas necesarias para cubrir lo que pide el PRD, conectadas con Expo Router. El alcance lo fija el cliente, no un número mínimo de pantallas."],
      ["2", "Autenticación", "Registro e ingreso, con sesión que sobrevive al cierre de la aplicación. El token se guarda con expo-secure-store y el reingreso se resuelve con expo-local-authentication, huella o rostro, con alternativa para el dispositivo que no la tenga."],
      ["3", "Consumo de la API", "La aplicación consume la API de la cátedra detrás de una capa de servicios propia. Los estados de carga, vacío y error tienen que verse en pantalla."],
      ["4", "Cámara y sistema de archivos", "Uso de expo-camera para foto o lectura de códigos QR, o expo-image-picker, con guardado y lectura en el dispositivo mediante la API nueva de expo-file-system."],
      ["5", "Ubicación y mapas", "expo-location junto con react-native-maps. Si el usuario niega el permiso, la aplicación tiene que seguir siendo usable."],
      ["6", "Notificaciones locales", "Con expo-notifications, disparadas por un hecho real de la aplicación, no por un botón de prueba."],
      ["7", "Persistencia y conectividad", "expo-sqlite para los datos y expo-sqlite kv-store para preferencias y sesión. La aplicación tiene que abrir y mostrar algo sin conexión, y avisar el estado de la red con expo-network."],
      ["8", "Sensores o háptica", "Al menos un uso justificado de expo-sensors o expo-haptics, que aporte algo real a la experiencia."],
      ["9", "Multimedia", "Cuando el PRD pida audio o video, se resuelve con expo-audio o expo-video, con controles de reproducción a la vista."],
      ["10", "Identidad de la aplicación", "Icono y pantalla de presentación propios, y nombre del producto. El icono va en formato PNG cuadrado de 1024 por 1024 pixeles, sin transparencias."],
    ],
    [500, 2200, 6300],
  ),
  spacer(),
  h2("Condiciones de aprobación"),
  p("El integrador se aprueba o no se aprueba, sin nota numérica. Se aprueba cuando la aplicación resuelve lo que pide el PRD, se cumplen los diez requisitos mínimos y todos los integrantes defendieron su parte. Una entrega que no llega a cumplir estas condiciones se puede rehacer una vez."),
];

const proyecto = [
  h1("3. El proyecto elegido"),
  p("Mi Ciudad es una guía turística móvil pedida por la Dirección de Turismo de la Municipalidad de Colón, Entre Ríos. Reemplaza el mostrador de la terminal, un mapa plastificado y los folletos impresos por una guía digital centralizada, pensada para el turista que camina por la ciudad y necesita saber qué tiene alrededor: dónde queda el Palmar, a qué hora abre el museo, qué hay para hacer hoy a la noche."),
  p("La aplicación tiene un único rol de usuario, el turista, y se apoya en seis áreas funcionales: el catálogo de lugares, el mapa con lo que hay cerca, la agenda de eventos, el registro del recorrido propio, los favoritos con cuenta de usuario, y las audioguías grabadas para los lugares con archivo histórico."),
  p("El requisito central del cliente es que la aplicación funcione sin conexión dentro del Parque Nacional El Palmar, uno de los puntos con más visitantes y sin señal de datos, y que respete los permisos denegados: si el turista no da la ubicación, la aplicación tiene que seguir mostrando el listado y el mapa igual."),
];

const especificación = [
  h1("4. Especificación funcional"),
  h2("Áreas de la aplicación"),
  p("Catálogo de lugares. Listado completo con filtro por categoría, buscador por nombre y orden por distancia. La ficha de cada lugar muestra fotos, descripción, horarios por día de la semana, teléfono, sitio web, precio de entrada y si es accesible para silla de ruedas."),
  p("Mapa y cercanía. Mapa con todos los lugares marcados y la posición del turista, filtro por categoría, lista de lo que hay cerca ordenada por distancia, botón para abrir la aplicación de mapas del teléfono, y una flecha que indica hacia donde queda un lugar lejano."),
  p("Agenda de eventos. Eventos ordenados por día, con detalle de horario, duración, lugar o dirección suelta, si son gratuitos, posibilidad de guardarlos con recordatorio, y aviso cuando un evento se cancela o se suspende."),
  p("Mi recorrido. Registro de una visita por código QR, por cercanía física o de forma manual, con una foto y una nota opcional asociadas. El turista puede ver su recorrido completo, en orden, con las fotos."),
  p("Favoritos y cuenta. Marcar un lugar como favorito, ver la lista de favoritos, y que esos favoritos y el recorrido se conserven si la persona cambia de teléfono. La cuenta solo hace falta para guardar cosas, no para mirar el catálogo o el mapa."),
  p("Audioguías. Reproducción de las audioguías grabadas para los lugares con archivo histórico, con pausa, avance y tiempo restante, y reproducción continuada con la pantalla apagada."),
  h2("Entidades de datos"),
  p("La aplicación trabaja con seis entidades principales. Los identificadores son cadenas de texto, las fechas viajan en formato ISO 8601 con zona horaria, y un campo sin valor se representa como nulo, nunca como cadena vacía ni como campo ausente."),
  table(
    [cell("Entidad", { header: true, width: 1600 }), cell("Campos principales", { header: true, width: 5400 }), cell("Notas", { header: true, width: 2000 })],
    [
      ["Lugar", "Nombre, categoría, descripción corta y larga, coordenadas, dirección, fotos, horarios por día, teléfono, sitio web, precio de entrada, audioguía, código QR, accesibilidad, estado activo", "Corazón del catálogo. Los horarios varían por día de la semana"],
      ["Categoría", "Nombre, icono, color y orden de listado", "Playas, termas, museos y patrimonio, gastronomía, artesanías, naturaleza, alojamiento"],
      ["Evento", "Título, descripción, lugar asociado o dirección suelta, coordenadas, inicio, fin, imagen, precio, estado", "El estado puede ser programado, suspendido, cancelado o finalizado"],
      ["Usuario", "Nombre, correo, avatar, fecha de alta, preferencias de categorías favoritas, aviso de proximidad y tema de la interfaz", "Preferencias incluyen el radio de aviso de proximidad en metros"],
      ["Favorito", "Usuario, lugar y fecha en que se guardó", "Relación simple entre un usuario y un lugar"],
      ["Visita", "Usuario, lugar, fecha y hora, origen del registro, foto local, nota y estado de sincronización", "El origen puede ser código QR, cercanía por GPS o carga manual"],
    ],
    [1600, 5400, 2000],
  ),
  spacer(),
  p("El campo de sincronización de la Visita existe porque una visita se registra parada frente al lugar, donde puede no haber señal. Se guarda primero en el teléfono sin sincronizar y se sube cuando vuelve la conexión. Esa cola local es parte del trabajo, no un detalle menor."),
  h2("Capacidades del dispositivo"),
  p("Las siguientes capacidades son de uso obligatorio en el trabajo integrador y tienen, en esta aplicación, un uso concreto y justificado."),
  table(
    [cell("Capacidad", { header: true, width: 2000 }), cell("Paquete", { header: true, width: 2800 }), cell("Uso en la aplicación", { header: true, width: 4200 })],
    [
      ["Cámara", "expo-camera", "Foto de la visita y lectura del código QR del cartel de cada lugar"],
      ["Galería", "expo-image-picker", "Elegir una foto ya sacada en vez de sacar una nueva"],
      ["Ubicación y mapa", "expo-location, react-native-maps", "Mapa de lugares, cálculo de distancia, botón de cómo llegar"],
      ["Notificaciones", "expo-notifications", "Aviso de proximidad a un lugar favorito y recordatorio de un evento guardado"],
      ["Persistencia y red", "expo-sqlite, expo-sqlite kv-store, expo-network", "Catálogo cacheado para uso sin conexión, cola de visitas sin sincronizar, preferencias"],
      ["Seguridad", "expo-secure-store, expo-local-authentication", "Token de sesión guardado y reingreso con huella o rostro"],
      ["Sensores y háptica", "expo-sensors, expo-haptics", "Flecha de dirección hacia un lugar con el magnetómetro, vibración al registrar una visita"],
      ["Sistema de archivos", "expo-file-system", "Guardado de audioguías y fotos en el dispositivo para uso sin señal"],
      ["Multimedia", "expo-audio, expo-video", "Reproducción de audioguías, incluso con la pantalla apagada"],
    ],
    [2000, 2800, 4200],
  ),
];

const contrato = [
  h1("5. Contrato de datos con la API"),
  p("La API de la cátedra todavía no está disponible. Mientras tanto, la aplicación se construye contra datos simulados que respetan exactamente la forma que va a tener la API real, para que el reemplazo, cuando llegue, se limite a la capa de servicios."),
  h2("Reglas de construcción"),
  p("Los tipos de datos se escriben una sola vez y no se modifican cuando llegue la API real. Los datos simulados se guardan tipados con esos mismos tipos, incluyendo casos poco habituales: un lugar sin audioguía, uno sin teléfono, una lista vacía, un texto largo y un error de red. Ninguna pantalla lee los datos simulados de forma directa: toda lectura pasa por una capa de servicios, que hoy devuelve el dato simulado y más adelante hace la llamada real a la red. Los servicios son asincrónicos desde el primer día, aunque el dato simulado responda al instante."),
  h2("Forma de la respuesta"),
  p("Toda respuesta exitosa de la API sigue el mismo formato, con los datos y la información de paginación. Toda respuesta de error sigue también un formato fijo, con un código identificable y un mensaje legible para mostrar en pantalla."),
  h2("Contrato preliminar en formato OpenAPI"),
  p("Se preparó un contrato preliminar en formato OpenAPI 3.0, en el archivo openapi.yaml de la raíz del proyecto, con los recursos de lugares, categorías, eventos, favoritos, visitas y autenticación. Este contrato documenta la forma exacta de la API tal como la describe el PRD del cliente, y sirve como referencia única mientras se construye la capa de servicios contra datos simulados. Se reemplaza o se ajusta en cuanto la cátedra publique la especificación oficial de su API."),
  callout("Publicación en SwaggerHub pendiente. La cuenta de SwaggerHub conectada a este proyecto todavía no está autorizada. El contrato preliminar se mantiene por ahora como archivo openapi.yaml dentro del repositorio, y se sube a SwaggerHub en cuanto se autorice la conexión, o se reemplaza directamente por la documentación que publique la cátedra junto con su API."),
];

const diseño = [
  h1("6. Diseño de interfaz"),
  p("La paleta de colores es la primera pieza del diseño de interfaz del proyecto. El punto de partida es el propio pedido del cliente: una aplicación que se usa afuera, al sol, caminando y con una sola mano, con contraste fuerte, letra grande y respeto por el modo oscuro del sistema operativo. Los colores base se inspiran en el paisaje de Colón: el río Uruguay, la costanera, el verde del Parque Nacional El Palmar y los tonos cálidos de la arquitectura colonial de la zona."),
  h2("Colores funcionales"),
  swatchTable([
    ["Primario, Azul Río", "Acciones principales, encabezados, elementos de marca", "0B6E8C"],
    ["Primario oscuro, Azul Río Profundo", "Variante para modo oscuro y estados de presión", "084C63"],
    ["Secundario, Verde Palmar", "Elementos de naturaleza, éxito de segundo orden", "3F7D45"],
    ["Acento, Terracota Atardecer", "Botón principal de cada pantalla, promociones, lo que tenés cerca", "D96C3F"],
    ["Éxito, Verde Confirmación", "Visita registrada, favorito guardado, acción confirmada", "3F8F5B"],
    ["Advertencia, Amarillo Aviso", "Evento suspendido, información que puede cambiar", "C9962C"],
    ["Error, Rojo Ladrillo", "Sin conexión, error de red, formulario inválido", "C24C4C"],
  ]),
  spacer(),
  h2("Superficies, modo claro y modo oscuro"),
  p("La aplicación respeta el modo oscuro del sistema, pedido de forma explícita por el cliente para la gente que usa la aplicación de noche o con el sol de frente."),
  table(
    [cell("Rol", { header: true, width: 2600 }), cell("Modo claro", { header: true, width: 3200, center: true }), cell("Modo oscuro", { header: true, width: 3200, center: true })],
    [
      ["Fondo", "#FBF7F0", "#10181A"],
      ["Superficie, tarjetas y barras", "#FFFFFF", "#17262A"],
      ["Texto principal", "#1F2A2E", "#EDEDE7"],
      ["Texto secundario", "#5C6B6E", "#A9B4B6"],
    ],
    [2600, 3200, 3200],
    { center: true },
  ),
  spacer(),
  p("El fondo claro usa un blanco cálido en lugar de blanco puro, para bajar el brillo percibido bajo sol directo. El texto principal no es negro puro, por el mismo motivo. La combinación de fondo y texto en ambos modos mantiene un contraste alto, acorde al pedido de letra grande y contraste fuerte para gente mayor y para uso a la intemperie."),
  h2("Paleta de categorías del catálogo"),
  p("Cada categoría de lugar turístico tiene un color propio para el icono de su marcador en el mapa y para las etiquetas de filtro, siguiendo el mismo esquema de datos que ya define el PRD, un campo color por categoría."),
  categoriaSwatchTable([
    ["Playas", "3AA0C4", "Tono celeste, distinto del azul primario para no confundirse con la marca"],
    ["Termas", "2E9E8F", "Verde azulado, asociado al agua termal"],
    ["Museos y patrimonio", "8E5A4A", "Mismo valor que usa el PRD en su propio ejemplo de datos"],
    ["Gastronomía", "D9822B", "Naranja cálido, distinto del acento para no competir con los botones de acción"],
    ["Artesanías", "8B5FA3", "Violeta, categoría con menor presencia visual en el resto de la aplicación"],
    ["Naturaleza", "3F7D45", "Reutiliza el verde secundario de la paleta funcional"],
    ["Alojamiento", "3B5BA5", "Azul más saturado que el primario, para distinguirse en el mapa"],
  ]),
  spacer(),
  p("Los siete colores se eligieron con saturación y luminosidad parejas entre sí, para que ninguna categoría se vea más importante que otra en el mapa o en los filtros, y con suficiente distancia de tono entre pares para que se puedan distinguir incluso con dificultades de percepción de color comunes."),
  h2("Capturas de pantalla"),
  callout("Pendiente. Esta sección se completa con capturas reales de las pantallas de la aplicación en cuanto el equipo tenga el primer recorrido navegable construido con Expo Router: inicio con mapa, listado de lugares, detalle de un lugar, y mi recorrido."),
];

const arquitectura = [
  h1("7. Arquitectura del sistema"),
  p("La aplicación se organiza en tres capas, siguiendo el criterio que fija el propio PRD del cliente para poder reemplazar los datos simulados por la API real sin reescribir pantallas."),
  table(
    [cell("Capa", { header: true, width: 2200 }), cell("Responsabilidad", { header: true, width: 6800 })],
    [
      ["Tipos", "Interfaces de TypeScript de cada entidad, en src tipos, escritas una sola vez a partir del contrato de datos"],
      ["Datos simulados", "Datos de ejemplo tipados contra esas interfaces, en src mocks, incluyendo los casos límite"],
      ["Servicios", "Funciones asincrónicas en src servicios que hoy devuelven el dato simulado y más adelante hacen la llamada real a la API. Es la única capa que cambia cuando la API esté disponible"],
    ],
    [2200, 6800],
  ),
  spacer(),
  callout("Pendiente. El diagrama de arquitectura completo, con la navegación de pantallas y el flujo de datos entre capas, se agrega a esta sección cuando el equipo confirme el reparto de pantallas por integrante."),
];

const estado = [
  h1("8. Estado de avance"),
  table(
    [cell("Punto", { header: true, width: 5000 }), cell("Estado", { header: true, width: 4000 })],
    [
      ["Propuesta recomendada", "Mi Ciudad, guía turística de Colón"],
      ["Confirmación de la propuesta por el equipo", "Pendiente"],
      ["Integrantes del equipo", "Equipo completo: Fernando Ruben Bareiro Ruiz, Natalia Ailén Gonzalez, Ballejo Micaela Celeste y Fernando Rodriguez"],
      ["Repositorio Git del proyecto", "Pendiente de creación"],
      ["Contrato de datos con la API", "Borrador preliminar en openapi.yaml"],
      ["Primeras pantallas construidas", "Pendiente"],
      ["Fecha de entrega", "A confirmar según el Campus Virtual"],
      ["Fecha de defensa oral", "A confirmar según la cátedra"],
    ],
    [5000, 4000],
  ),
];

const doc = new Document({
  creator: "Fernando Rodriguez",
  title: "Documentación Oficial del Proyecto, Trabajo Integrador de Desarrollo para Móviles",
  styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
  sections: [
    {
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } }, titlePage: true },
      ...headerFooter("Documentación Oficial del Proyecto, Trabajo Integrador de Desarrollo para Móviles"),
      children: [
        ...cover, ...toc(), ...intro, ...consigna, ...proyecto, ...especificación,
        ...contrato, ...diseño, ...arquitectura, ...estado,
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("Written:", OUT, buf.length, "bytes");
});
