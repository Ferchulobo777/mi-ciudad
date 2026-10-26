# Mi Ciudad

Guía turística de Colón, Entre Ríos. Trabajo integrador de la asignatura Desarrollo para Móviles,
Tecnicatura Universitaria en Desarrollo Web (FCAD, UNER), 2026, segundo cuatrimestre.

![Expo SDK](https://img.shields.io/badge/Expo%20SDK-57-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=black)
![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Expo Router](https://img.shields.io/badge/Expo%20Router-file--based-4630EB?logo=expo&logoColor=white)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-informational)

Una aplicación pensada para el turista que camina por Colón: catálogo de lugares, mapa y
cercanía, agenda de eventos, registro del propio recorrido y audioguías, con un fuerte foco en que
todo eso siga funcionando sin conexión (el caso de prueba de referencia es el Parque Nacional El
Palmar, con muy poca señal).

## Integrantes

- Fernando Rodriguez
- Natalia Ailén Gonzalez
- Ballejo Micaela Celeste
- Fernando Ruben Bareiro Ruiz

## Documentación del proyecto

En la carpeta `Informe-Analisis-Propuestas/`:

| Documento | Contenido |
|---|---|
| `1 - Propuestas de Desarrollo.pdf` | Las cinco propuestas de la cátedra, comparadas, y por qué elegimos Mi Ciudad |
| `2 - Documentación Oficial del Proyecto.pdf` | Consigna, especificación funcional, contrato de datos, diseño de interfaz, arquitectura y estado de avance |
| `3 - Diseño Técnico y Pantallas, Mi Ciudad.pdf` | Requisitos funcionales y no funcionales, casos de uso, diagrama de clases y las trece pantallas |

Las pantallas de diseño están también en `Mockups-Propuestas/` (`exports/` tiene las imágenes) y
el contrato de datos con la API, en `openapi.yaml`.

## Tecnologías

| Área | Tecnología |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 57 · [React Native](https://reactnative.dev) 0.86 · React 19.2 |
| Lenguaje | TypeScript (modo estricto) |
| Navegación | [Expo Router](https://docs.expo.dev/router/introduction/) (basada en archivos) |
| Autenticación | `expo-secure-store` + `expo-local-authentication` (huella/rostro) |
| Persistencia y red | `expo-sqlite` (favoritos, visitas, copia offline del catálogo y la agenda) · `expo-sqlite/kv-store` (preferencias) · `expo-network` |
| Mapas y ubicación | `react-native-maps` (Google Maps en Android, Apple Maps en iOS) + `expo-location` · ruta caminando con OSRM |
| Cámara y archivos | `expo-camera` (QR) · `expo-image-picker` · `expo-file-system` (API nueva: `File`/`Directory`/`Paths`) |
| Sensores y háptica | `expo-sensors` (magnetómetro, flecha hacia el lugar) · `expo-haptics` |
| Notificaciones | `expo-notifications`: locales (recordatorio de evento, aviso de proximidad) y push del servidor (evento guardado suspendido, cancelado o reprogramado) |
| Multimedia | `expo-audio` (audioguías, también con la pantalla bloqueada) |
| Íconos | `@react-native-vector-icons/ionicons` |
| Estilos | `StyleSheet` nativo de React Native |
| Testing | Jest + `@testing-library/react-native` (unidad) · Maestro (E2E) |

En Android, `react-native-maps` usa Google Maps: Expo Go trae su propia clave, pero la build de
release necesita una clave de Google Maps propia. La clave no va en el repositorio: se carga como
variable de EAS (`GOOGLE_MAPS_API_KEY`) y `app.config.js` la pasa al plugin al compilar. Si un
build se arma sin clave, la app no intenta dibujar el mapa (Google Maps la cerraría) y muestra la
lista de lugares en su lugar (`src/utils/mapa.ts`).

## Cómo probarlo en tu celular (guía paso a paso, sin experiencia previa)

Esta guía asume que nunca instalaste nada de Expo ni de React Native. Son cuatro partes: instalar
herramientas en la compu, bajar el proyecto, instalar una app en el celular, y conectar las dos
cosas.

### 1. Herramientas que hacen falta en la computadora

- **Node.js** (versión 20 o más nueva). Se instala desde [nodejs.org](https://nodejs.org/es):
  descargá la versión "LTS" y seguí el instalador. Para confirmar que quedó instalado, abrí una
  terminal (PowerShell en Windows, Terminal en Mac) y escribí:
  ```bash
  node --version
  ```
  Tiene que mostrar un número tipo `v20.x.x` o más alto.
- **Git**. Se instala desde [git-scm.com](https://git-scm.com/downloads). Sirve para bajar
  ("clonar") el proyecto.

No hace falta instalar Android Studio ni Xcode para esta guía: se prueba directo en el celular con
la app Expo Go, sin compilar nada nativo.

### 2. Bajar el proyecto e instalar sus dependencias

En una terminal, parado en la carpeta donde quieras guardar el proyecto:

```bash
git clone https://github.com/Ferchulobo777/mi-ciudad.git
cd mi-ciudad
npm install
```

`npm install` puede tardar varios minutos la primera vez: está bajando todas las librerías que usa
la app. Si al final ves algo como `added 850 packages`, salió bien.

### 3. Instalar Expo Go en el celular

- **Android**: buscá "Expo Go" en Google Play e instalala.
- **iPhone**: buscá "Expo Go" en el App Store e instalala.

Es gratis y no hace falta crear cuenta para lo que necesitamos acá.

### 4. Levantar la API de la cátedra y apuntar la app a ella

La app consume la API oficial de la cátedra, `api-mi-ciudad`, del repositorio
[franco-ruisdias-uner/api-proyectos-mobile](https://github.com/franco-ruisdias-uner/api-proyectos-mobile).
Sin Docker hace falta Node 24 y pnpm (`corepack enable`):

```bash
git clone https://github.com/franco-ruisdias-uner/api-proyectos-mobile.git
cd api-proyectos-mobile/api-mi-ciudad
copy .env.example .env
pnpm install
pnpm db:reiniciar
pnpm dev
```

Al arrancar, la API muestra una línea `Desde el teléfono (misma red wifi): http://192.168.x.x:3000/salud`.
Abrí esa dirección en el navegador **del celular**: tiene que mostrar `{"datos":{"estado":"ok",...}}`.
Si no carga, es el firewall de Windows (permitir Node.js en redes privadas).

En la carpeta de la app, copiá `.env.example` a `.env.local` y poné esa dirección, sin `/salud`:

```bash
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
```

`localhost` no sirve: para el celular, `localhost` es el propio celular. Para el APK de entrega hay
que usar la API publicada con `https` (sección 9 del README de la API: Render + Supabase), porque
una app instalada no puede depender de la IP de una notebook.

### 5. Levantar el servidor de la app y conectar el celular

Importante: **la computadora y el celular tienen que estar conectados a la misma red Wi-Fi**. Si
la compu está por cable y el celular por Wi-Fi, puede no funcionar; conectá la compu también por
Wi-Fi si podés.

En la terminal, adentro de la carpeta del proyecto:

```bash
npx expo start
```

Después de unos segundos va a aparecer un código QR en la terminal. Con el celular:

- **Android**: abrí Expo Go y tocá el botón de escanear (o usá directamente la cámara del
  celular, que en Android suele reconocer el QR y ofrecer abrirlo en Expo Go).
- **iPhone**: abrí la app de **Cámara** (no Expo Go) y apuntá al QR. Te va a aparecer un aviso
  arriba para abrirlo en Expo Go.

La primera vez que abre, la app tarda un par de minutos en compilarse (verás una barra de
progreso). Las veces siguientes es mucho más rápido.

Si el QR no te sirve (por ejemplo, estás probando el proyecto por SSH o en un entorno sin
pantalla), fijate en la terminal una línea que dice `Metro waiting on exp://` seguida de una
dirección como `exp://192.168.x.x:8081`. Esa misma dirección se puede escribir a mano en Expo Go,
tocando "Enter URL manually".

### 6. Qué probar

La app tiene cuatro pestañas, igual que las pantallas del documento de diseño: **Mapa** (inicio),
**Agenda**, **Mi recorrido** y **Mi perfil**. El catálogo completo se abre con la lupa del inicio.
Mirar lugares, el mapa y la agenda no pide cuenta; guardar cosas (favoritos, eventos, visitas) sí.

- **Ingresar**: en la pestaña **Mi perfil**, con la usuaria de demo de la API
  `lucia@mail.com` / `lucia1234` (trae favoritos, visitas y un evento guardado) o
  `nuevo@demo.ar` / `nuevo1234` (cuenta vacía). También podés crear una cuenta nueva desde
  "Registrate". Si ya ingresaste antes y el teléfono tiene huella o rostro, aparece "Ingresar con
  huella" (reutiliza el último token, que dura 30 días).
- **Mapa (inicio)**: tocá "Usar mi ubicación" en la tarjeta azul para ver "Cerca tuyo" ordenado
  por distancia (si no das permiso, se calcula desde el centro de Colón y la app sigue andando).
  Tocá la vista previa del mapa para abrir el **mapa completo**: marcadores por categoría, filtro
  con los chips de arriba, y el botón de abajo a la derecha para centrarte.
- **Lupa → Catálogo**: buscador (sin importar tildes: "colon" encuentra "Termas de Colón"),
  filtro por categoría, orden por distancia o por nombre, y el corazón de cada tarjeta para marcar
  un favorito sin entrar al detalle.
- Tocá un lugar → **Detalle**: estado del horario ("Abierto ahora · cierra 22:00", o cuándo
  abre), horarios de la semana, teléfono, precio y el corazón de favorito. Con la ubicación
  activada se ven además la distancia y, si el lugar está a más de 200 m, la **flecha** que apunta
  hacia dónde queda (usa el magnetómetro: sostené el teléfono horizontal). "Ver en el mapa" traza
  la ruta caminando y "Cómo llegar" abre la app de mapas del teléfono.
- **Audioguía** (en el Molino Forclaz): reproducir, pausar, adelantar o retroceder 15 s y ver
  cuánto falta. En la build de release sigue sonando con el teléfono bloqueado.
- **Agenda**: tocá un evento y "Guardar con recordatorio" (con sesión iniciada). Programa una
  notificación local una hora antes, y tocar esa notificación abre el evento. El evento
  suspendido aparece marcado en rojo y no se puede guardar.
- **Registrar visita** (con sesión iniciada): desde el Detalle de un lugar, probá las tres formas:
  código QR, por cercanía (tenés que estar a menos de 200 m del lugar) o carga manual, con foto y
  nota. Los QR de los carteles tienen el formato `COLON:<id del lugar>`, por ejemplo
  `COLON:lug-004`; se puede generar uno con cualquier generador de QR para probarlo.
  Un QR que no es de Mi Ciudad muestra un aviso y la cámara sigue escaneando. La visita aparece
  después en **Mi recorrido**.
- **Mi perfil** (con sesión iniciada): foto de perfil (cámara o galería, con recorte nativo), "Mis
  favoritos", **Categorías favoritas**, **Aviso de proximidad** y tema claro/oscuro/sistema. El
  aviso de proximidad pide ubicación y notificaciones al prenderlo, y avisa de tus lugares
  favoritos y de los lugares de tus categorías favoritas: una sola vez por lugar y por día,
  mientras la app está abierta.
- **Notificaciones push** (en el APK, no en Expo Go para Android): en **Mi perfil**, "Probar
  notificaciones push" registra el teléfono en la API (`POST /dispositivos`) y pide una push de
  prueba. Para ver el flujo real: guardá un evento, ingresá a la API como
  `turismo@colon.demo.ar` y suspendé ese evento con `PATCH /eventos/:id/estado` desde Swagger
  (`/docs`): llega el aviso, y tocarlo abre el evento. Al cerrar sesión el teléfono se da de baja.

**Sin conexión (el caso de El Palmar)**: abrí la app una vez con señal, poné el teléfono en modo
avión y volvé a abrirla. Aparece "Sin conexión · mostrando datos guardados" y el catálogo y la
agenda se ven igual, porque salen de la copia guardada en SQLite. El mapa, que necesita internet,
se reemplaza por un aviso. Registrá una visita: queda como "pendiente de subir" y en el inicio
aparece "1 visita esperando para sincronizar". Al sacar el modo avión se sube sola y el ícono pasa
a una tilde verde.

Cerrá la app del todo y volvé a abrirla: la sesión, los favoritos, las preferencias, la foto y las
visitas registradas tienen que seguir ahí. Es la parte de persistencia local que pide la cátedra.

### Problemas comunes

- **"Port 8081 is being used by another process"**: quedó un servidor anterior corriendo. Cerrá
  esa terminal (o el proceso `node` correspondiente) y volvé a correr `npx expo start`.
- **Pantalla roja al abrir, mencionando un archivo que "no se puede resolver"**: casi siempre es
  la caché de Metro, no un error real del código. Se soluciona así:
  ```bash
  npx expo start --clear
  ```
  Si con eso no alcanza, cerrá el servidor y borrá también la carpeta `.expo` de este proyecto y
  la carpeta `node_modules` (después corré `npm install` de nuevo).
- **El celular no logra conectarse**: confirmá que esté en la misma red Wi-Fi que la computadora
  (no datos móviles), y que el firewall de Windows no esté bloqueando Node.js. Si aparece un
  aviso de "Windows Defender Firewall" al arrancar `expo start`, tocá "Permitir acceso".
- **El mapa no aparece en el APK**: el build se armó sin `GOOGLE_MAPS_API_KEY` (ver
  "Tecnologías"); la app muestra la lista de lugares en su lugar. Sin conexión también se
  muestra un aviso en vez del mapa.

El proyecto se prueba con [Expo Go](https://expo.dev/go) durante todo el desarrollo: todas las
librerías que usa están incluidas en Expo Go. Tres cosas solo se ven completas en la build de
release, porque dependen de config plugins o de credenciales: las notificaciones push (en Android
salieron de Expo Go en el SDK 53), el audio en segundo plano con controles en la pantalla
bloqueada, y el ícono propio de las notificaciones en Android.

### Build de entrega (APK)

La consigna pide un build de release instalable sin Metro:

```bash
npx expo install --check
npm test
eas build --platform android --profile preview
```

Antes del primer build:

1. `eas login` y `eas init`: vincula el proyecto y agrega a `app.json` el `projectId` que usan las
   push para pedir el token de Expo.
2. Push en Android: crear un proyecto en Firebase con el paquete `com.miciudad.app`, descargar
   `google-services.json` y cargarlo en EAS como variable de tipo archivo `GOOGLE_SERVICES_JSON`
   (no se sube al repositorio). Después, `eas credentials` → Android → *Google Service Account
   Key for FCM V1* con la clave de cuenta de servicio de ese proyecto.
3. El perfil `preview` de `eas.json` ya apunta a la API publicada en Render
   (`https://api-mi-ciudad-ex12.onrender.com`). Si se quiere usar otra (por ejemplo una IP de la
   red con `http://`, para lo que el build habilita tráfico sin cifrar con
   `expo-build-properties`), se cambia ahí. La clave `GOOGLE_MAPS_API_KEY`, si se tiene, va como
   variable de EAS del entorno `preview` (expo.dev → Environment variables).

Al terminar, `eas build` devuelve el link del APK, que es lo que se entrega.

## Tests

```bash
npm test                    # Jest: validaciones, distancias, horarios, QR, proximidad, caché offline
maestro test .maestro/      # E2E: necesita la build instalada (com.miciudad.app) en un celular o emulador
```

## Estructura del proyecto

```
src/
├── app/          # pantallas y rutas (Expo Router): (tabs)/ son las cuatro pestañas
├── components/   # componentes de UI reutilizables
├── constants/    # paleta de colores y constantes de la app
├── hooks/        # hooks propios (sesión, tema, ubicación, conexión, aviso de proximidad, sincronización)
├── mocks/        # datos de prueba para los tests de Jest, con la misma forma que la API
├── servicios/    # capa de servicios: API de la cátedra, caché offline, SQLite, notificaciones y push, archivos
├── tipos/        # interfaces de TypeScript de cada entidad
└── utils/        # funciones puras y testeadas (validaciones, distancias, horarios, QR, proximidad)
```

Toda lectura de datos pasa por `src/servicios/`. `servicios/api.ts` es el único módulo que habla
con la API de la cátedra: arma la URL con `EXPO_PUBLIC_API_URL`, agrega `Authorization: Bearer`,
desenvuelve el sobre `{ datos, meta }` y convierte `{ error: { codigo, mensaje } }` en un
`ErrorDeApi`. Las pantallas no cambiaron al pasar de los datos simulados a la API real. Cada
respuesta se guarda en SQLite: si después falla la red, se muestra la última copia. Favoritos,
visitas y eventos guardados se escriben primero en el teléfono y se copian a la cuenta cuando hay
señal (las visitas suben su foto antes con `POST /archivos`).

## Paleta

Paleta "Costa Entrerriana", inspirada en el paisaje de Colón: el río Uruguay, la costanera, el
verde del Parque Nacional El Palmar y los tonos cálidos de la arquitectura colonial de la zona.

| | Color | Uso |
|---|---|---|
| ![#0B6E8C](https://placehold.co/16x16/0B6E8C/0B6E8C.png) | `#0B6E8C` Azul Río | Primario |
| ![#3F7D45](https://placehold.co/16x16/3F7D45/3F7D45.png) | `#3F7D45` Verde Palmar | Secundario |
| ![#D96C3F](https://placehold.co/16x16/D96C3F/D96C3F.png) | `#D96C3F` Terracota Atardecer | Acento |
