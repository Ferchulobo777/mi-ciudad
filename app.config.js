// Completa app.json con lo que no puede ir en el repositorio. Las claves
// salen de variables de entorno de EAS al compilar en la nube:
// - GOOGLE_MAPS_API_KEY: la clave de Google Maps para Android. Sin ella el
//   build igual se arma, pero la app muestra la lista de lugares en vez del
//   mapa (ver utils/mapa.ts). Expo Go y iOS no la necesitan.
// - GOOGLE_SERVICES_JSON: el google-services.json de Firebase (variable de
//   tipo archivo). Android lo necesita para recibir notificaciones push.
// Además, si la API se usa por http (la API corriendo en una computadora de
// la red), el APK tiene que permitir tráfico sin cifrar: Android lo bloquea
// por defecto en los builds de release.
const fs = require("fs");

module.exports = ({ config }) => {
  const claveMapas = process.env.GOOGLE_MAPS_API_KEY;
  const googleServices =
    process.env.GOOGLE_SERVICES_JSON ?? (fs.existsSync("./google-services.json") ? "./google-services.json" : undefined);

  const apiSinCifrar = (process.env.EXPO_PUBLIC_API_URL ?? "").startsWith("http://");
  const plugins = [...config.plugins, ["react-native-maps", claveMapas ? { androidGoogleMapsApiKey: claveMapas } : {}]];
  if (apiSinCifrar) plugins.push(["expo-build-properties", { android: { usesCleartextTraffic: true } }]);

  return {
    ...config,
    android: {
      ...config.android,
      ...(googleServices ? { googleServicesFile: googleServices } : {}),
    },
    plugins,
    extra: {
      ...config.extra,
      mapaNativo: Boolean(claveMapas),
    },
  };
};
