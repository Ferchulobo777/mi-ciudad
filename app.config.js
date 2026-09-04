// La API key de Google Maps para Android no puede vivir en un app.json estático
// si el repositorio es público: por eso la configuración pasó a este archivo,
// que lee la key desde una variable de entorno (.env, fuera del control de
// versiones) en vez de tenerla escrita en texto plano.
module.exports = {
  expo: {
    name: "Mi Ciudad",
    slug: "mi-ciudad",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "miciudad",
    userInterfaceStyle: "automatic",
    android: {
      package: "com.miciudad.app",
      adaptiveIcon: {
        backgroundColor: "#0B6E8C",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID,
        },
      },
    },
    ios: {
      bundleIdentifier: "com.miciudad.app",
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#0B6E8C",
          image: "./assets/images/splash-icon.png",
          imageWidth: 76,
        },
      ],
      "expo-secure-store",
      "@react-native-vector-icons/ionicons",
      "expo-sqlite",
      "expo-image",
      [
        "expo-image-picker",
        {
          photosPermission: "Mi Ciudad usa tus fotos para elegir tu foto de perfil.",
          cameraPermission:
            "Mi Ciudad usa la cámara para sacar tu foto de perfil y para registrar tus visitas.",
        },
      ],
      [
        "expo-camera",
        {
          cameraPermission:
            "Mi Ciudad usa la cámara para escanear el código QR de un lugar y para la foto de tu visita.",
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Mi Ciudad usa tu ubicación para mostrar los lugares cercanos y para registrar una visita por cercanía.",
        },
      ],
      "expo-dev-client",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
