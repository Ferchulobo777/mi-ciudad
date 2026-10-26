import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Storage } from "expo-sqlite/kv-store";
import { pedirApi } from "./api";
import { tienePermisoDeNotificaciones } from "./notificaciones";

// Las push son las que manda el servidor: hoy, el aviso de que un evento
// guardado se suspendió, se canceló o vuelve a estar programado. Para eso la
// API necesita el token de Expo de este teléfono, que se registra en
// POST /dispositivos. Los recordatorios siguen siendo notificaciones locales.

const CLAVE_TOKEN_REGISTRADO = "push:token";

/**
 * Pide el token de Expo y lo registra en la cuenta. Solo actúa si el permiso
 * de notificaciones ya está concedido: el permiso se pide en contexto (al
 * guardar un evento o desde Mi perfil), nunca acá. Devuelve el token o null.
 *
 * En un emulador no hay token, y en Expo Go para Android las push no existen
 * desde el SDK 53 (necesitan un development build o el APK): en esos casos
 * devuelve null y la app sigue con las notificaciones locales.
 */
export async function registrarDispositivoPush(): Promise<string | null> {
  if (!Device.isDevice || !(await tienePermisoDeNotificaciones())) return null;
  // El projectId lo agrega `eas init` en app.json; sin él Expo no sabe a qué
  // proyecto pertenece el token.
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) return null;

  try {
    const Notifications = await import("expo-notifications");
    const { data: tokenExpo } = await Notifications.getExpoPushTokenAsync({ projectId });
    await pedirApi("/dispositivos", {
      metodo: "POST",
      cuerpo: { tokenExpo, plataforma: Platform.OS === "ios" ? "ios" : "android" },
    });
    Storage.setItemSync(CLAVE_TOKEN_REGISTRADO, tokenExpo);
    return tokenExpo;
  } catch {
    // Sin señal o sin soporte de push: se reintenta en el próximo inicio.
    return null;
  }
}

/**
 * Al cerrar la sesión se da de baja el token, para que los avisos de esta
 * cuenta no le lleguen a quien use el teléfono después. Se llama antes de
 * borrar el token de sesión, porque el DELETE necesita estar autenticado.
 */
export async function darDeBajaDispositivoPush(): Promise<void> {
  const tokenExpo = Storage.getItemSync(CLAVE_TOKEN_REGISTRADO);
  if (!tokenExpo) return;
  try {
    await pedirApi(`/dispositivos/${encodeURIComponent(tokenExpo)}`, { metodo: "DELETE" });
  } catch {
    // Si falla la red, el token queda en el servidor; si otra cuenta entra en
    // este teléfono, la API se lo pasa al usuario nuevo al registrarlo.
  }
  Storage.removeItemSync(CLAVE_TOKEN_REGISTRADO);
}

/** Manda una push de prueba a los teléfonos de la cuenta. Devuelve a cuántos llegó. */
export async function probarPush(): Promise<number> {
  const { enviadas } = await pedirApi<{ enviadas: number }>("/dispositivos/prueba", { metodo: "POST" });
  return enviadas;
}
