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

## Cómo correrlo

```bash
npm install
npx expo start
```

Se prueba con [Expo Go](https://expo.dev/go) durante el desarrollo. El proyecto migra a un
development build recién cuando haga falta una librería nativa fuera del SDK de Expo.

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
