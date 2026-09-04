import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SesionProvider, useSesion } from "@/hooks/use-sesion";
import { Presentacion } from "@/components/presentacion";

// Se evita que la splash nativa se oculte sola: se la deja visible hasta que
// se resuelve si hay una sesión guardada, para no mostrar un parpadeo entre la
// splash nativa y la pantalla de la aplicación.
SplashScreen.preventAutoHideAsync().catch(() => {});

function NavegacionRaiz() {
  const { estaListo } = useSesion();

  useEffect(() => {
    if (estaListo) SplashScreen.hideAsync();
  }, [estaListo]);

  if (!estaListo) return <Presentacion />;

  // El catálogo, el mapa y la agenda no piden cuenta (RF06): por eso el grupo
  // (app) no está protegido acá. Lo que sí requiere sesión, como favoritos o
  // mi recorrido, se protege pantalla por pantalla más adelante, cuando existan.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(app)" />
      <Stack.Screen name="login" options={{ presentation: "modal" }} />
      <Stack.Screen name="registro" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function LayoutRaiz() {
  return (
    <SesionProvider>
      <NavegacionRaiz />
    </SesionProvider>
  );
}
