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
| Mapas y ubicación | `expo-location` + enlaces nativos al mapa del dispositivo |
| Íconos | `@react-native-vector-icons/ionicons` |
| Estilos | `StyleSheet` nativo de React Native |
| Testing | Jest + `@testing-library/react-native` (unidad) · Maestro (E2E) |

## Cómo probarlo en tu celular (guía paso a paso, sin experiencia previa)

Esta guía asume que nunca instalaste nada de Expo ni de React Native. Son cuatro partes: instalar
herramientas en la compu, bajar el proyecto, instalar una app en el celular, y conectar las dos
cosas.

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

### 4. Levantar el servidor y conectar el celular

Importante: **la computadora y el celular tienen que estar conectados a la misma red Wi-Fi**. Si
la compu está por cable y el celular por Wi-Fi, puede no funcionar — conectá la compu también por
Wi-Fi si podés.

En la terminal, adentro de la carpeta del proyecto:

```bash
npx expo start
```

Después de unos segundos va a aparecer un código QR en la terminal. Con el celular:

- **Android**: abrí Expo Go y tocá el botón de escanear (o usá directamente la cámara del
  celular, que en Android suele reconocer el QR y ofrecer abrirlo en Expo Go).
- **iPhone**: abrí la app de **Cámara** (no Expo Go) y apuntá al QR — te va a aparecer un aviso
  arriba para abrirlo en Expo Go.

La primera vez que abre, la app tarda un par de minutos en compilarse (verás una barra de
progreso). Las veces siguientes es mucho más rápido.

Si el QR no te sirve (por ejemplo, estás probando el proyecto por SSH o en un entorno sin
pantalla), fijate en la terminal una línea que dice `Metro waiting on exp://` seguida de una
dirección como `exp://192.168.x.x:8081` — esa misma dirección se puede escribir a mano en Expo Go,
tocando "Enter URL manually".

### 5. Qué probar

Con la app abierta en el celular:

- **Catálogo** (primera pestaña): buscador y filtro por categoría de los lugares turísticos.
- Tocá un lugar → vas al **Detalle**: marcá el corazón de favorito (te va a pedir iniciar sesión
  la primera vez) y probá "Cómo llegar" (abre el mapa nativo del teléfono).
- **Agenda**: tocá un evento y "Guardar con recordatorio" — programa una notificación local.
- **Ingresar**, con el usuario de prueba: `maria.villalba@correo.com` / `colon2026`. También podés
  crear una cuenta nueva desde "Crear cuenta".
- **Yo** (última pestaña, con sesión iniciada): cambiá el tema (claro/oscuro/sistema), tocá el
  avatar para sacarte o elegir una foto de perfil (con recorte nativo), y entrá a "Mis favoritos".

Cerrá la app del todo y volvé a abrirla: la sesión, los favoritos, el tema y la foto tienen que
seguir ahí — es la parte de persistencia local que pide la cátedra.

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
  (no datos móviles), y que el firewall de Windows no esté bloqueando Node.js — si aparece un
  aviso de "Windows Defender Firewall" al arrancar `expo start`, tocá "Permitir acceso".

El proyecto se prueba con [Expo Go](https://expo.dev/go) durante todo el desarrollo. Recién
migraría a un development build si en algún momento hiciera falta una librería nativa fuera del
SDK de Expo (por ahora no hace falta).

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
