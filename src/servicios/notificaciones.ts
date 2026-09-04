import type { Evento } from "@/tipos";
import { formatearHora } from "@/utils/fechas";

// En Android, expo-notifications no funciona dentro de Expo Go desde el SDK
// 53: hace falta un development build. Se carga de forma diferida y con
// manejo de error para que guardar un evento siga funcionando igual, sin el
// recordatorio, en vez de romper toda la pantalla de Agenda apenas se abre.
type ModuloNotificaciones = typeof import("expo-notifications");

let promesaModulo: Promise<ModuloNotificaciones | null> | null = null;

function cargarModulo(): Promise<ModuloNotificaciones | null> {
  if (!promesaModulo) {
    promesaModulo = import("expo-notifications")
      .then((Notifications) => {
        // Las notificaciones que dispara la propia app tienen que verse
        // aunque esté abierta en primer plano, si no expo-notifications las
        // descarta en silencio.
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
        return Notifications;
      })
      .catch(() => null);
  }
  return promesaModulo;
}

export async function hayPermisoDeNotificaciones(): Promise<boolean> {
  const Notifications = await cargarModulo();
  if (!Notifications) return false;

  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  const { status: nuevoEstado } = await Notifications.requestPermissionsAsync();
  return nuevoEstado === "granted";
}

// El recordatorio se dispara una hora antes del evento; si falta menos de una
// hora, se dispara en el momento (evento.inicio ya pasó de largo la ventana
// habitual de aviso previo). Devuelve null si no se pudo programar, ya sea
// por falta de permiso o porque el entorno no lo soporta (Expo Go/Android).
export async function programarRecordatorio(evento: Evento): Promise<string | null> {
  const Notifications = await cargarModulo();
  if (!Notifications) return null;

  const permiso = await hayPermisoDeNotificaciones();
  if (!permiso) return null;

  const inicio = new Date(evento.inicio);
  const unaHoraAntes = new Date(inicio.getTime() - 60 * 60 * 1000);
  const fechaDeAviso = unaHoraAntes.getTime() > Date.now() ? unaHoraAntes : inicio;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: evento.titulo,
      body: `Empieza a las ${formatearHora(inicio)}${evento.direccionLibre ? " · " + evento.direccionLibre : ""}`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fechaDeAviso,
    },
  });
}

export async function cancelarRecordatorio(idNotificacion: string): Promise<void> {
  const Notifications = await cargarModulo();
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(idNotificacion);
}
