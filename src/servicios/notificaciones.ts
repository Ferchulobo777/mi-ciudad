import { Platform } from "react-native";
import type { NotificationResponse } from "expo-notifications";
import type { Evento } from "@/tipos";
import { formatearHora } from "@/utils/fechas";

// Las notificaciones locales funcionan en Expo Go; lo que se sacó de Expo Go
// en Android desde el SDK 53 son las push (ver servicios/push.ts). Igual se carga el módulo de forma
// diferida y con manejo de error: si por algún motivo no está disponible, la
// app sigue funcionando sin avisos en vez de romper la pantalla que los usa.
// (Los `import type` se borran al compilar: no cargan el módulo antes de
// tiempo.)
type ModuloNotificaciones = typeof import("expo-notifications");

const CANAL_AVISOS = "avisos";

let promesaModulo: Promise<ModuloNotificaciones | null> | null = null;

function cargarModulo(): Promise<ModuloNotificaciones | null> {
  if (!promesaModulo) {
    promesaModulo = import("expo-notifications")
      .then((Notifications) => {
        // Se declara una sola vez, al cargar el módulo. Sin handler, una
        // notificación que llega con la app abierta no se muestra: parece que
        // se perdió (el error número uno según la teoría de la Unidad 4).
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

// En Android 13+ el cartel de permiso no aparece si no existe al menos un
// canal: por eso se crea antes de pedirlo, nunca después.
async function asegurarCanal(Notifications: ModuloNotificaciones): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CANAL_AVISOS, {
    name: "Avisos de Mi Ciudad",
    description: "Recordatorios de eventos guardados y lugares cercanos.",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

/** Consulta sin mostrar el cartel del sistema. */
export async function tienePermisoDeNotificaciones(): Promise<boolean> {
  const Notifications = await cargarModulo();
  if (!Notifications) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

/**
 * Se llama recién cuando el turista activa algo que necesita avisos (guardar
 * un evento, prender el aviso de proximidad), nunca al abrir la app: pedir el
 * permiso sin contexto es la forma más rápida de perderlo para siempre.
 */
export async function pedirPermisoDeNotificaciones(): Promise<boolean> {
  const Notifications = await cargarModulo();
  if (!Notifications) return false;

  await asegurarCanal(Notifications);
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  const pedido = await Notifications.requestPermissionsAsync();
  return pedido.status === "granted";
}

/**
 * Programa el recordatorio una hora antes del evento (o en el momento, si ya
 * falta menos). Devuelve el id de la notificación, que se guarda para poder
 * cancelar justo esa si el turista saca el evento: reprogramar sin cancelar
 * duplicaría los avisos.
 */
export async function programarRecordatorio(evento: Evento): Promise<string | null> {
  const Notifications = await cargarModulo();
  if (!Notifications || !(await pedirPermisoDeNotificaciones())) return null;

  const inicio = new Date(evento.inicio);
  const unaHoraAntes = new Date(inicio.getTime() - 60 * 60 * 1000);
  const fechaDeAviso = unaHoraAntes.getTime() > Date.now() ? unaHoraAntes : new Date(Date.now() + 5000);

  return Notifications.scheduleNotificationAsync({
    content: {
      title: evento.titulo,
      body: `Empieza a las ${formatearHora(inicio)}${evento.direccionLibre ? " · " + evento.direccionLibre : ""}`,
      // La ruta y no el texto: es lo que permite que tocar el aviso lleve
      // directo al detalle del evento.
      data: { ruta: `/evento/${evento.id}` },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fechaDeAviso,
      channelId: CANAL_AVISOS,
    },
  });
}

export async function cancelarRecordatorio(idNotificacion: string): Promise<void> {
  const Notifications = await cargarModulo();
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(idNotificacion);
}

interface AvisoInmediato {
  titulo: string;
  cuerpo: string;
  ruta: string;
}

/** Para avisos que responden a algo que acaba de pasar (proximidad, evento suspendido). */
export async function notificarAhora({ titulo, cuerpo, ruta }: AvisoInmediato): Promise<void> {
  const Notifications = await cargarModulo();
  if (!Notifications || !(await tienePermisoDeNotificaciones())) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: titulo, body: cuerpo, data: { ruta } },
    trigger: { channelId: CANAL_AVISOS },
  });
}

/**
 * Escucha los toques sobre una notificación y devuelve la ruta que trae en
 * `data`. Cubre también el caso de la app cerrada: el toque que la abrió
 * queda guardado como "última respuesta" y se procesa al arrancar.
 * Devuelve la función que suelta la suscripción, para el cleanup del efecto.
 */
export function escucharToquesEnNotificaciones(alTocar: (ruta: string) => void): () => void {
  let suscripcion: { remove: () => void } | null = null;
  let suelto = false;

  cargarModulo().then((Notifications) => {
    if (!Notifications || suelto) return;

    // Las locales traen la ruta armada; las push del servidor traen el id
    // del evento que cambió de estado.
    const rutaDe = (respuesta: NotificationResponse) => {
      const datos = respuesta.notification.request.content.data;
      if (typeof datos?.ruta === "string") return datos.ruta;
      if (datos?.tipo === "evento-estado" && typeof datos.eventoId === "string") return `/evento/${datos.eventoId}`;
      return null;
    };

    const ultima = Notifications.getLastNotificationResponse();
    if (ultima) {
      const ruta = rutaDe(ultima);
      Notifications.clearLastNotificationResponse();
      if (ruta) alTocar(ruta);
    }

    suscripcion = Notifications.addNotificationResponseReceivedListener((respuesta) => {
      const ruta = rutaDe(respuesta);
      if (ruta) alTocar(ruta);
    });
  });

  return () => {
    suelto = true;
    suscripcion?.remove();
  };
}
