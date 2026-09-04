# Mi Ciudad

Guía turística de Colón, Entre Ríos. Trabajo integrador de la asignatura Desarrollo para Móviles,
Tecnicatura Universitaria en Desarrollo Web (FCAD, UNER) — 2026, segundo cuatrimestre.

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

- Fernando Ruben Bareiro Ruiz
- Natalia Ailén Gonzalez
- Ballejo Micaela Celeste
- Fernando Rodriguez

## Tecnologías

| Área | Tecnología |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 57 · [React Native](https://reactnative.dev) 0.86 · React 19.2 |
| Lenguaje | TypeScript (modo estricto) |
| Navegación | [Expo Router](https://docs.expo.dev/router/introduction/) (basada en archivos) |
| Autenticación | `expo-secure-store` + `expo-local-authentication` (huella/rostro) |
| Persistencia | `expo-sqlite` |
| Mapas y ubicación | `react-native-maps` + `expo-location` |
| Cámara y sensores | `expo-camera` (QR) · `expo-haptics` · `expo-network` |
| Íconos | `@react-native-vector-icons/ionicons` |
| Estilos | `StyleSheet` nativo de React Native |
| Testing | Jest + `@testing-library/react-native` (unidad) · Maestro (E2E) |

## Cómo probarlo en tu celular (guía paso a paso, sin experiencia previa)

Esta guía asume que nunca instalaste nada de Expo ni de React Native. Son cinco partes: instalar
herramientas en la compu, bajar el proyecto, instalar el build de desarrollo en el celular, cargar
la variable de entorno del mapa, y conectar las dos cosas.

> **Por qué ya no alcanza con Expo Go**: la pantalla de Mapa usa `react-native-maps`, una librería
> nativa que no viene incluida en la app genérica de Expo Go. A partir de acá cada persona necesita
> instalarse una vez un **build de desarrollo** propio de Mi Ciudad (se genera en la nube con EAS,
> gratis, sin tocar Android Studio ni Xcode) y usar esa app en vez de Expo Go. Es un paso más la
> primera vez, pero después se sigue trabajando exactamente igual que con Expo Go (mismo
> `npx expo start`, mismo QR).

### 1. Herramientas que hacen falta en la computadora

- **Node.js** (versión 20 o más nueva). Se instala desde [nodejs.org](https://nodejs.org/es) —
  descargá la versión "LTS" y seguí el instalador. Para confirmar que quedó instalado, abrí una
  terminal (PowerShell en Windows, Terminal en Mac) y escribí:
  ```bash
  node --version
  ```
  Tiene que mostrar un número tipo `v20.x.x` o más alto.
- **Git**. Se instala desde [git-scm.com](https://git-scm.com/downloads). Sirve para bajar
  ("clonar") el proyecto.
- Una **cuenta gratuita en [expo.dev](https://expo.dev/signup)**: hace falta para que EAS te
  compile el build de desarrollo en la nube.

No hace falta instalar Android Studio ni Xcode para esta guía: el build de desarrollo se compila
en los servidores de Expo (EAS), no en tu computadora.

### 2. Bajar el proyecto e instalar sus dependencias

En una terminal, parado en la carpeta donde quieras guardar el proyecto:

```bash
git clone https://github.com/Ferchulobo777/mi-ciudad.git
cd mi-ciudad
npm install
```

`npm install` puede tardar varios minutos la primera vez: está bajando todas las librerías que usa
la app. Si al final ves algo como `added 850 packages`, salió bien.

### 3. Cargar la API key del mapa

La pantalla de Mapa necesita una API key de Google Maps para mostrar el mapa en Android (en iPhone
no hace falta, usa Apple Maps). Pedile a Fernando la key del proyecto y creá un archivo `.env` en
la raíz del proyecto (al lado de `package.json`) con este contenido:

```bash
GOOGLE_MAPS_API_KEY_ANDROID=la-key-que-te-pasaron
```

Hay un archivo `.env.example` en el proyecto con la plantilla. El archivo `.env` nunca se sube al
repositorio (está en `.gitignore`) — cada persona tiene el suyo, local.

### 4. Instalar el build de desarrollo en el celular (una sola vez)

Con este paso instalás una versión de Mi Ciudad con soporte para el mapa nativo. Reemplaza a Expo
Go — se hace una sola vez, no en cada sesión de trabajo.

```bash
npm install -g eas-cli
eas login
eas build --profile development --platform android
```

`eas login` te va a pedir el usuario y contraseña de la cuenta de expo.dev que creaste en el paso
1. El build tarda entre 10 y 20 minutos (se hace en los servidores de Expo, podés dejarlo
corriendo). Al terminar, la terminal te muestra un link para descargar un archivo `.apk` — abrilo
desde el navegador del celular (o escaneá el QR que también te ofrece) e instalalo, permitiendo
"orígenes desconocidos" si Android lo pide (es normal para un build de desarrollo, no viene de
Google Play).

> **iPhone**: el equivalente es `eas build --profile development --platform ios`, pero un build de
> desarrollo para iOS necesita una cuenta paga de Apple Developer para poder instalarse fuera de la
> App Store. Si no la tenés, probá en un Android mientras tanto.

### 5. Levantar el servidor y conectar el celular

Importante: **la computadora y el celular tienen que estar conectados a la misma red Wi-Fi**. Si
la compu está por cable y el celular por Wi-Fi, puede no funcionar — conectá la compu también por
Wi-Fi si podés.

En la terminal, adentro de la carpeta del proyecto:

```bash
npx expo start --dev-client
```

Después de unos segundos va a aparecer un código QR en la terminal. Abrí la app que instalaste en
el paso anterior (se llama "Mi Ciudad", no Expo Go) y escaneá el QR desde ahí — la propia app tiene
un botón de escanear al abrirla.

Si el QR no te sirve (por ejemplo, estás probando el proyecto por SSH o en un entorno sin
pantalla), fijate en la terminal una línea que dice `Metro waiting on exp://` seguida de una
dirección como `exp://192.168.x.x:8081` — esa misma dirección se puede escribir a mano en la app,
tocando "Enter URL manually".

Para las sesiones siguientes de trabajo alcanza con repetir este paso 5 (`npx expo start
--dev-client`): el build del celular no cambia salvo que se agregue otra librería nativa nueva —
en ese caso hay que repetir el paso 4.

### 6. Qué probar

Con la app abierta en el celular:

- **Catálogo** (primera pestaña): buscador y filtro por categoría de los lugares turísticos.
- Tocá un lugar → vas al **Detalle**: marcá el corazón de favorito (te va a pedir iniciar sesión
  la primera vez) y probá "Cómo llegar" (abre el mapa nativo del teléfono).
- **Mapa**: los lugares aparecen como marcadores de colores (uno por categoría). Tocá uno para ver
  su nombre y distancia, y "Ver detalle" para ir a esa pantalla. El botón redondo de abajo a la
  derecha centra el mapa en tu ubicación actual.
- **Agenda**: tocá un evento y "Guardar con recordatorio" — programa una notificación local.
- **Ingresar**, con el usuario de prueba: `maria.villalba@correo.com` / `colon2026`. También podés
  crear una cuenta nueva desde "Crear cuenta".
- **Mi recorrido**: desde el Detalle de un lugar, "Registrar visita" — probá las tres formas
  (código QR, por cercanía con el GPS, o carga manual), con foto opcional.
- **Yo** (última pestaña, con sesión iniciada): cambiá el tema (claro/oscuro/sistema), tocá el
  avatar para sacarte o elegir una foto de perfil (con recorte nativo), y entrá a "Mis favoritos".
- Apagá el Wi-Fi del celular con la app abierta: en el Catálogo tiene que aparecer el aviso de
  "Sin conexión · mostrando datos guardados".

Cerrá la app del todo y volvé a abrirla: la sesión, los favoritos, el tema, la foto y las visitas
registradas tienen que seguir ahí — es la parte de persistencia local que pide la cátedra.

### Problemas comunes

- **"Port 8081 is being used by another process"**: quedó un servidor anterior corriendo. Cerrá
  esa terminal (o el proceso `node` correspondiente) y volvé a correr `npx expo start --dev-client`.
- **Pantalla roja al abrir, mencionando un archivo que "no se puede resolver"**: casi siempre es
  la caché de Metro, no un error real del código. Se soluciona así:
  ```bash
  npx expo start --dev-client --clear
  ```
  Si con eso no alcanza, cerrá el servidor y borrá también la carpeta `.expo` de este proyecto y
  la carpeta `node_modules` (después corré `npm install` de nuevo).
- **El celular no logra conectarse**: confirmá que esté en la misma red Wi-Fi que la computadora
  (no datos móviles), y que el firewall de Windows no esté bloqueando Node.js — si aparece un
  aviso de "Windows Defender Firewall" al arrancar `expo start`, tocá "Permitir acceso".
- **El mapa aparece en blanco (solo en Android)**: revisá que el archivo `.env` tenga la key
  correcta y que el paso 4 (instalar el build de desarrollo) se haya hecho después de tener esa
  key cargada — la key se compila adentro del `.apk`, así que si se agrega o cambia hay que volver
  a correr `eas build`.
- **"command not found: eas"**: el paso 4 no terminó de instalar `eas-cli` globalmente. Probá de
  nuevo `npm install -g eas-cli` y, si seguís en Windows, abrí una terminal nueva después.

## Estructura del proyecto

```
src/
├── app/          # pantallas y rutas (Expo Router)
├── components/    # componentes de UI reutilizables
├── constants/    # paleta de colores y constantes de la app
├── hooks/        # hooks propios (sesión, tema)
├── mocks/        # datos simulados, tipados contra el contrato de datos
├── servicios/    # capa de servicios (hoy contra mocks, después contra la API real)
├── tipos/        # interfaces de TypeScript de cada entidad
└── utils/        # funciones puras (validaciones, cálculos)
```

Toda lectura de datos pasa por `src/servicios/`, que hoy devuelve datos simulados y más adelante
va a hacer la llamada real a la API de la cátedra, sin que las pantallas necesiten cambiar.

## Paleta

Paleta "Costa Entrerriana", inspirada en el paisaje de Colón: el río Uruguay, la costanera, el
verde del Parque Nacional El Palmar y los tonos cálidos de la arquitectura colonial de la zona.

| | Color | Uso |
|---|---|---|
| ![#0B6E8C](https://placehold.co/16x16/0B6E8C/0B6E8C.png) | `#0B6E8C` Azul Río | Primario |
| ![#3F7D45](https://placehold.co/16x16/3F7D45/3F7D45.png) | `#3F7D45` Verde Palmar | Secundario |
| ![#D96C3F](https://placehold.co/16x16/D96C3F/D96C3F.png) | `#D96C3F` Terracota Atardecer | Acento |
