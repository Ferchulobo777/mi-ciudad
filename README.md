# Mi Ciudad

Guía turística de Colón, Entre Ríos. Trabajo integrador de Desarrollo para Móviles, Tecnicatura
Universitaria en Desarrollo Web (FCAD, UNER), 2026.

![Expo SDK](https://img.shields.io/badge/Expo%20SDK-57-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-informational)

Catálogo de lugares, mapa, agenda de eventos, registro del recorrido y audioguías, pensado para
seguir funcionando sin conexión (el caso de referencia es el Parque Nacional El Palmar).

## Integrantes

- Fernando Rodriguez
- Natalia Ailén Gonzalez
- Ballejo Micaela Celeste
- Fernando Ruben Bareiro Ruiz

## Instalar la app

APK de Android: **https://expo.dev/artifacts/eas/23HqpJ_F12dqSp6o_8ChCWCDbyET5m8JIlbgR9jB2eM.apk**

Abrir el link desde el teléfono, descargar e instalar (Android pide permitir la instalación de
apps de origen desconocido). La app usa la API publicada en `https://api-mi-ciudad-ex12.onrender.com`;
el servidor gratuito se suspende sin uso, así que la primera carga puede demorar cerca de un minuto.

Cuentas de demo:

| Email | Contraseña | |
|---|---|---|
| `lucia@mail.com` | `lucia1234` | Con favoritos, visitas y un evento guardado |
| `nuevo@demo.ar` | `nuevo1234` | Cuenta vacía |

## Funcionalidades

- **Catálogo y detalle**: búsqueda sin importar tildes, filtro por categoría, orden por distancia,
  horarios, favoritos y "Cómo llegar".
- **Mapa** con `react-native-maps`: marcadores por categoría y ruta a pie hasta un lugar.
- **Agenda** de eventos con recordatorio local una hora antes.
- **Mi recorrido**: registro de visitas por QR (`COLON:<id del lugar>`), cercanía o carga manual,
  con foto y nota.
- **Audioguías** con `expo-audio`, también con la pantalla bloqueada.
- **Sin conexión**: el catálogo y la agenda se leen de la copia guardada en SQLite, y las visitas
  quedan en cola hasta que vuelve la señal.
- **Notificaciones**: locales (recordatorios y aviso de proximidad) y push del servidor cuando un
  evento guardado se suspende, se cancela o se reprograma.
- **Cuenta**: sesión en `expo-secure-store` y reingreso con huella o rostro.
- **Sensores**: flecha hacia el lugar con el magnetómetro y vibración al confirmar.

## Tecnologías

| Área | Tecnología |
|---|---|
| Base | Expo SDK 57, React Native 0.86, React 19.2, TypeScript, Expo Router |
| Datos y red | API de la cátedra (`api-mi-ciudad`), `expo-sqlite`, `expo-sqlite/kv-store`, `expo-network` |
| Dispositivo | `expo-location`, `react-native-maps`, `expo-camera`, `expo-image-picker`, `expo-file-system`, `expo-sensors`, `expo-haptics` |
| Notificaciones y multimedia | `expo-notifications`, `expo-audio` |
| Seguridad | `expo-secure-store`, `expo-local-authentication` |
| Tests | Jest, Testing Library, Maestro |

## Correr el proyecto

```bash
git clone https://github.com/Ferchulobo777/mi-ciudad.git
cd mi-ciudad
npm install
npx expo start
```

Antes de arrancar, copiar `.env.example` a `.env.local` y poner la dirección de la API, por
ejemplo `EXPO_PUBLIC_API_URL=https://api-mi-ciudad-ex12.onrender.com` (o la IP de la computadora
si la API corre localmente). Después, escanear el QR con Expo Go. Las push no funcionan en Expo Go
para Android: se prueban con el APK.

## Build de entrega

```bash
eas build --platform android --profile preview
```

El perfil `preview` genera el APK apuntando a la API publicada. Las claves (`google-services.json`
y la clave de Google Maps) se cargan como variables de EAS y no forman parte del repositorio.

## Tests

```bash
npm test                 # Jest: validaciones, distancias, horarios, QR, proximidad y caché
maestro test .maestro/   # E2E sobre la app instalada
```

## Estructura

```
src/
├── app/          # pantallas y rutas (Expo Router)
├── components/   # componentes reutilizables
├── constants/    # paleta y constantes
├── hooks/        # sesión, tema, ubicación, conexión, sincronización
├── servicios/    # capa de servicios: API, caché, SQLite, notificaciones, archivos
├── tipos/        # tipos de cada entidad
└── utils/        # funciones puras con tests
```

## Documentación

En `Informe-Analisis-Propuestas/`: análisis de las propuestas, documentación del proyecto y
diseño técnico con las pantallas. Los mockups están en `Mockups-Propuestas/`.
