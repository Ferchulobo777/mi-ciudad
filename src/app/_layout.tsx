import { useEffect } from "react";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SesionProvider, useSesion } from "@/hooks/use-sesion";
import { useTema } from "@/hooks/use-tema";
import { Presentacion } from "@/components/presentacion";
import { escucharToquesEnNotificaciones } from "@/servicios/notificaciones";

// Se evita que la splash nativa se oculte sola: se la deja visible hasta que
// se resuelve si hay una sesión guardada, para no mostrar un parpadeo entre la
// splash nativa y la pantalla de la aplicación.
SplashScreen.preventAutoHideAsync().catch(() => {});

function NavegacionRaiz() {
  const { estaListo } = useSesion();
  const tema = useTema();

  useEffect(() => {
    if (estaListo) SplashScreen.hideAsync();
  }, [estaListo]);

  // Tocar un aviso lleva directo a la pantalla que trae en data.ruta (el
  // evento guardado, el lugar cercano), esté la app abierta, minimizada o
  // cerrada. Se escucha recién cuando la navegación ya está montada.
  useEffect(() => {
    if (!estaListo) return;
    return escucharToquesEnNotificaciones((ruta) => router.push(ruta as never));
  }, [estaListo]);

  if (!estaListo) return <Presentacion />;

  // Las pestañas viven dentro de este Stack y las pantallas de detalle se
  // apilan encima (navegación anidada, Unidad 3): así "atrás" vuelve a la
  // pantalla de la que se vino y el detalle ocupa toda la pantalla, sin la
  // barra de pestañas, como en los mockups.
  //
  // El grupo (tabs) no se protege en bloque con Stack.Protected: el mapa,
  // el catálogo y la agenda no piden cuenta (el PRD lo exige). Lo que sí
  // necesita sesión, como registrar una visita, lo resuelve cada pantalla.
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tema.fondo } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="catalogo" />
      <Stack.Screen name="mapa" />
      <Stack.Screen name="favoritos" />
      <Stack.Screen name="lugar/[id]/index" />
      <Stack.Screen
        name="lugar/[id]/visitar"
        options={{ presentation: "transparentModal", animation: "slide_from_bottom", contentStyle: { backgroundColor: "transparent" } }}
      />
      <Stack.Screen name="evento/[id]" />
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
