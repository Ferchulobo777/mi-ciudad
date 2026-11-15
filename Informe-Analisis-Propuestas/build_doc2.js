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
  callout("El proyecto que se documenta a continuación, Mi Ciudad, guía turística de Colón, es la propuesta recomendada en el documento Propuestas de Desarrollo y fue confirmada por el equipo completo el 3 de septiembre de 2026. La aplicación ya está construida: las secciones de diseño de interfaz, arquitectura y estado de avance describen su versión actual."),
];

const consigna = [
  h1("2. La consigna del trabajo integrador"),
  h2("Objetivo"),
  p("La cátedra pide desarrollar y entregar la versión final de la aplicación móvil solicitada por el cliente en el PRD asignado al grupo, construida con React Native y Expo. La aplicación debe integrar servicios del dispositivo, consumo de la API de la cátedra, persistencia local y resguardo de credenciales, y se entrega como un build instalable, no como código para compilar."),
  h2("Formato de entrega"),
  p("El trabajo es grupal, con los mismos integrantes declarados por el equipo. La entrega incluye el enlace de un build de release generado con el perfil preview de EAS, instalable y usable sin depender de Metro ni de la computadora de ningún integrante, junto con el código fuente en un repositorio Git o un archivo comprimido. El código fuente debe incluir los archivos eas.json y app.json, y excluir la carpeta node_modules."),
  h2("Defensa oral"),
  p("La entrega incluye una defensa oral obligatoria, grupal, de quince a veinte minutos, en la fecha que informe la cátedra. Se demuestra la aplicación funcionando en un teléfono, con Expo Go o con el build entregado, y cada integrante explica la parte que desarrolló y responde preguntas sobre su código. Lo que se evalúa es que el equipo pueda explicar cada línea de lo que entrega. Sin defensa no hay integrador aprobado, aunque la entrega esté completa."),
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
      ["Ubicación y mapa", "expo-location, react-native-maps", "Mapa de lugares con filtro por categoría, cálculo de distancia, ruta caminando y botón de cómo llegar"],
      ["Notificaciones", "expo-notifications", "Notificaciones locales: aviso de proximidad a un lugar favorito o de una categoría favorita y recordatorio de un evento guardado. Notificaciones push que manda la API cuando un evento guardado se suspende o se cancela"],
      ["Persistencia y red", "expo-sqlite, expo-sqlite kv-store, expo-network", "Catálogo y agenda cacheados para uso sin conexión y cola de visitas sin sincronizar con expo-sqlite; preferencias del usuario con kv-store; aviso del estado de la red"],
      ["Seguridad", "expo-secure-store, expo-local-authentication", "Token de sesión guardado y reingreso con huella o rostro"],
      ["Sensores y háptica", "expo-sensors, expo-haptics", "Flecha de dirección hacia un lugar con el magnetómetro, vibración al registrar una visita"],
      ["Sistema de archivos", "expo-file-system", "Guardado de audioguías y fotos en el dispositivo para uso sin señal"],
      ["Multimedia", "expo-audio", "Reproducción de audioguías con controles a la vista, incluso con la pantalla apagada"],
    ],
    [2000, 2800, 4200],
  ),
  spacer(),
  p("Decisión sobre el mapa. El mapa usa react-native-maps, como pide la consigna: Google Maps en Android y Apple Maps en iOS. La build de Android necesita una clave propia de Google Maps; para no dejarla escrita en el repositorio, se carga como variable de entorno de EAS y el archivo app.config.js la agrega al compilar. Si un build no tiene la clave, la aplicación muestra la lista de lugares en lugar del mapa, en vez de cerrarse. Durante el desarrollo se probó una versión con Leaflet dentro de un WebView, que se descartó a pedido de la cátedra."),
  h2("Alcance de esta versión"),
  p("Algunos puntos de la especificación tienen límites o decisiones propias en esta versión."),
  table(
    [cell("Punto", { header: true, width: 2600 }), cell("Situación en esta versión", { header: true, width: 6400 })],
    [
      ["Fotos de los lugares", "Las fotos las sirve la API de la cátedra desde su almacenamiento. Si un lugar no tiene foto, la ficha muestra una imagen con el color y el icono de su categoría."],
      ["Datos de la API", "La aplicación consume la API de la cátedra (api-mi-ciudad), publicada por el grupo en Render con la base de datos y los archivos en Supabase. Sin conexión, muestra la última copia guardada en el teléfono."],
      ["Servidor gratuito", "El plan gratuito de Render suspende la API cuando no se usa: la primera carga puede tardar cerca de un minuto, y la aplicación espera hasta sesenta segundos antes de mostrar el error."],
      ["Favoritos y recorrido entre teléfonos", "Se guardan primero en el teléfono con expo-sqlite y se sincronizan con la cuenta en la API, así que se conservan al cambiar de teléfono. Las visitas registradas sin señal quedan en una cola y se suben al volver la conexión."],
      ["Aviso de proximidad", "Funciona mientras la aplicación está abierta. Avisar con la aplicación cerrada exigiría el permiso de ubicación permanente, que no se pide para este caso."],
    ],
    [2600, 6400],
  ),
];

const contrato = [
  h1("5. Contrato de datos con la API"),
  p("La aplicación consume la API que publicó la cátedra para Mi Ciudad (api-mi-ciudad, construida con NestJS). Antes de que estuviera disponible, el equipo escribió un contrato preliminar a partir del PRD y construyó la aplicación contra datos de prueba con esa misma forma. Cuando la cátedra publicó la API, el cambio se limitó a la capa de servicios."),
  h2("Reglas de construcción"),
  p("Los tipos de datos se escribieron una sola vez y coinciden con los de la API. Ninguna pantalla habla con la red: toda lectura pasa por la capa de servicios, que arma la dirección a partir de una variable de entorno, agrega el token de sesión, abre la envoltura de la respuesta y convierte cada error en un objeto con el código y el mensaje que manda la API. Los datos de prueba quedaron para los tests automáticos."),
  h2("Forma de la respuesta"),
  p("Toda respuesta exitosa de la API sigue el mismo formato, con los datos y la información de paginación. Toda respuesta de error sigue también un formato fijo, con un código identificable y un mensaje legible para mostrar en pantalla."),
  h2("Contrato preliminar y documentación de la API"),
  p("El contrato preliminar está en el archivo openapi.yaml de la raíz del proyecto, en formato OpenAPI 3.0, con los recursos de lugares, categorías, eventos, favoritos, visitas y autenticación. La especificación completa de la API de la cátedra se consulta en la documentación Swagger que expone la propia API, en la ruta /docs."),
];

const diseño = [
  h1("6. Diseño de interfaz"),
  p("La paleta de colores es la primera pieza del diseño de interfaz del proyecto. El punto de partida es el propio pedido del cliente: una aplicación que se usa afuera, al sol, caminando y con una sola mano, con contraste fuerte, letra grande y respeto por el modo oscuro del sistema operativo. Los colores base se inspiran en el paisaje de Colón: el río Uruguay, la costanera, el verde del Parque Nacional El Palmar y los tonos cálidos de la arquitectura colonial de la zona."),
  h2("Colores funcionales"),
  swatchTable([
    ["Primario, Azul Río", "Acciones principales, encabezados, elementos de marca", "0B6E8C"],
    ["Primario oscuro, Azul Río Profundo", "Color de referencia de la marca. En la aplicación el modo oscuro mantiene el Azul Río, porque esta variante pierde contraste sobre el fondo oscuro", "084C63"],
    ["Secundario, Verde Palmar", "Elementos de naturaleza, éxito de segundo orden", "3F7D45"],
    ["Acento, Terracota Atardecer", "Favoritos y detalles que tienen que resaltar sin competir con los botones principales, que usan el Azul Río", "D96C3F"],
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
  p("Las pantallas de la aplicación siguen las trece pantallas del documento Diseño Técnico y Pantallas, que se actualizó con los cambios hechos durante el desarrollo: la pestaña Mi perfil, las categorías favoritas y la opción de marcar un favorito desde el catálogo."),
];

const arquitectura = [
  h1("7. Arquitectura del sistema"),
  p("La aplicación se organiza en capas, siguiendo el criterio que fija el propio PRD del cliente: que el origen de los datos se pueda cambiar sin reescribir pantallas. Cada capa solo conoce a la que tiene debajo."),
  table(
    [cell("Capa", { header: true, width: 2200 }), cell("Responsabilidad", { header: true, width: 6800 })],
    [
      ["Pantallas", "Archivos de src app. Expo Router arma las rutas a partir de la carpeta, sin registrar nada a mano"],
      ["Componentes", "Piezas reutilizables en src components: botón, tarjeta de lugar, encabezado, reproductor de audioguía, flecha hacia el lugar, avisos de estado"],
      ["Hooks", "Lógica compartida en src hooks: sesión, tema, ubicación con sus permisos, conexión, aviso de proximidad y sincronización de visitas"],
      ["Servicios", "Funciones asincrónicas en src servicios: datos de la API, base de datos local, copia sin conexión, notificaciones, archivos, audio y vibración. Es la única capa que habla con la API, por eso conectar la API de la cátedra no cambió las pantallas"],
      ["Utilidades", "Funciones puras en src utils, cubiertas por pruebas de unidad: distancias y rumbos, horarios, precios, fechas, códigos QR y reglas del aviso de proximidad"],
      ["Tipos y datos de prueba", "Interfaces de TypeScript en src tipos, que coinciden con las de la API, y datos de prueba tipados en src mocks para los tests automáticos"],
    ],
    [2200, 6800],
  ),
  spacer(),
  h2("Navegación"),
  p("El primer nivel es una pila de pantallas (Stack). Adentro de ella están las cuatro pestañas, que son la base de la aplicación, y encima se apilan las pantallas de detalle, sin barra de pestañas y con el botón de volver a la pantalla anterior."),
  table(
    [cell("Nivel", { header: true, width: 2600 }), cell("Pantallas", { header: true, width: 6400 })],
    [
      ["Pestañas", "Mapa (inicio), Agenda, Mi recorrido y Mi perfil"],
      ["Pantallas apiladas", "Catálogo, mapa completo, detalle de lugar, detalle de evento y favoritos"],
      ["Modales", "Ingreso, registro, y registrar visita como hoja que sube desde abajo"],
    ],
    [2600, 6400],
  ),
  spacer(),
  h2("Flujo de datos sin conexión"),
  p("Cada pantalla pide los datos a un servicio. El servicio consulta la API y guarda la respuesta en una tabla de expo-sqlite; si la consulta falla por falta de conexión, devuelve la última copia guardada, y si tampoco hay copia, la pantalla muestra el error con la opción de reintentar. Las visitas se guardan primero en el teléfono con el estado sin sincronizar, y cuando expo-network informa que volvió la conexión se suben solas."),
  h2("Reparto por integrante"),
  table(
    [cell("Integrante", { header: true, width: 2800 }), cell("Área a cargo", { header: true, width: 6200 })],
    [
      ["Fernando Rodriguez", "Presentación del proyecto, repositorio, pruebas y entrega del build"],
      ["Natalia Ailén Gonzalez", "Diseño de interfaz: pantallas, paleta y temas, navegación, componentes, accesibilidad e identidad de la aplicación"],
      ["Fernando Ruben Bareiro Ruiz", "Capa de servicios y datos, persistencia y funcionamiento sin conexión, ubicación, mapa y magnetómetro"],
      ["Micaela Celeste Ballejo", "Cuenta y seguridad, registro de visitas con cámara, código QR y archivos, vibración y notificaciones"],
    ],
    [2800, 6200],
  ),
];

const estado = [
  h1("8. Estado de avance"),
  table(
    [cell("Punto", { header: true, width: 5000 }), cell("Estado", { header: true, width: 4000 })],
    [
      ["Propuesta elegida", "Mi Ciudad, guía turística de Colón"],
      ["Confirmación de la propuesta por el equipo", "Confirmada el 3 de septiembre de 2026"],
      ["Integrantes del equipo", "Equipo completo: Fernando Rodriguez, Natalia Ailén Gonzalez, Fernando Ruben Bareiro Ruiz y Micaela Celeste Ballejo"],
      ["Repositorio Git del proyecto", "github.com/Ferchulobo777/mi-ciudad"],
      ["API de la cátedra", "Conectada y publicada en Render, con la base de datos y los archivos en Supabase"],
      ["Aplicación", "Trece pantallas construidas y los diez requisitos mínimos implementados"],
      ["Pruebas", "108 pruebas de unidad con Jest y dos flujos de prueba de punta a punta con Maestro"],
      ["Build de release (APK)", "Generado con el perfil preview de EAS y disponible en Google Drive"],
      ["Fecha de entrega", "15 de noviembre de 2026, según el Campus Virtual"],
      ["Defensa", "En video, entregado junto con el trabajo"],
    ],
    [5000, 4000],
  ),
];

const doc = new Document({
  creator: "Fernando Rodriguez",
  lastModifiedBy: "Fernando Rodriguez",
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
