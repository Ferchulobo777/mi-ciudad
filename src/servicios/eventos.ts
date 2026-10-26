import type { Evento } from "@/tipos";
import { eventosVigentes } from "@/utils/fechas";
import { hayTokenDeApi, pedirApi } from "./api";
import { conRespaldoEnCache } from "./cache";
import { obtenerBaseDeDatos } from "./base-datos";
import { programarRecordatorio, cancelarRecordatorio, notificarAhora } from "./notificaciones";
import { registrarDispositivoPush } from "./push";

// Sin filtros de día la API arranca la agenda en hoy, que es justo lo que
// muestra la pantalla; 100 es el máximo por página que admite /eventos.
async function pedirEventos(): Promise<Evento[]> {
  return pedirApi<Evento[]>("/eventos?porPagina=100");
}

// Además del recordatorio local, el evento se guarda en la cuenta: así la API
// sabe a quién avisar si Turismo lo suspende o lo cancela. Si no hay señal en
// ese momento no se bloquea al turista; la copia local y el recordatorio ya
// quedaron hechos.
async function sincronizarGuardadoEnCuenta(eventoId: string, guardado: boolean): Promise<void> {
  if (!hayTokenDeApi()) return;
  try {
    await pedirApi(`/yo/eventos-guardados/${encodeURIComponent(eventoId)}`, {
      metodo: guardado ? "PUT" : "DELETE",
    });
  } catch {
    // Se reintenta solo la próxima vez que el turista toque el botón.
  }
}

async function obtenerTodos(): Promise<Evento[]> {
  return conRespaldoEnCache("eventos", pedirEventos);
}

export async function listarEventos(): Promise<Evento[]> {
  return eventosVigentes(await obtenerTodos());
}

export async function obtenerEvento(id: string): Promise<Evento | null> {
  const eventos = await obtenerTodos();
  return eventos.find((e) => e.id === id) ?? null;
}

export async function listarIdsDeEventosGuardados(usuarioId: string): Promise<string[]> {
  const db = await obtenerBaseDeDatos();
  const filas = await db.getAllAsync<{ eventoId: string }>(
    "SELECT eventoId FROM eventos_guardados WHERE usuarioId = ?",
    usuarioId,
  );
  return filas.map((f) => f.eventoId);
}

export async function estaGuardado(usuarioId: string, eventoId: string): Promise<boolean> {
  const db = await obtenerBaseDeDatos();
  const fila = await db.getFirstAsync(
    "SELECT id FROM eventos_guardados WHERE usuarioId = ? AND eventoId = ?",
    usuarioId,
    eventoId,
  );
  return fila !== null;
}

// Guardar un evento programa el recordatorio; sacarlo cancela esa
// notificación puntual, para no dejar avisos huérfanos de eventos que el
// turista ya no quiere ver.
export async function alternarGuardadoConRecordatorio(
  usuarioId: string,
  evento: Evento,
): Promise<{ guardado: boolean; conRecordatorio: boolean }> {
  const db = await obtenerBaseDeDatos();
  const existente = await db.getFirstAsync<{ id: string; idNotificacion: string | null }>(
    "SELECT id, idNotificacion FROM eventos_guardados WHERE usuarioId = ? AND eventoId = ?",
    usuarioId,
    evento.id,
  );

  if (existente) {
    if (existente.idNotificacion) await cancelarRecordatorio(existente.idNotificacion);
    await db.runAsync("DELETE FROM eventos_guardados WHERE id = ?", existente.id);
    await sincronizarGuardadoEnCuenta(evento.id, false);
    return { guardado: false, conRecordatorio: false };
  }

  const idNotificacion = await programarRecordatorio(evento);
  await db.runAsync(
    "INSERT INTO eventos_guardados (id, usuarioId, eventoId, idNotificacion, creadoEn) VALUES (?, ?, ?, ?, ?)",
    `evg-${usuarioId}-${evento.id}`,
    usuarioId,
    evento.id,
    idNotificacion,
    new Date().toISOString(),
  );
  await sincronizarGuardadoEnCuenta(evento.id, true);
  // Guardar un evento es el momento en que se pide el permiso de avisos: si
  // se concedió, se registra el teléfono para recibir la push si el evento
  // se suspende o se cancela.
  if (idNotificacion !== null) registrarDispositivoPush();
  return { guardado: true, conRecordatorio: idNotificacion !== null };
}

/**
 * El PRD pide que, si un evento guardado se suspende o se cancela (por
 * lluvia, por ejemplo), quien lo guardó se entere. Se revisa cada vez que se
 * actualiza la agenda: si cambió el estado, se cancela el recordatorio (ya no
 * tiene sentido) y se avisa una sola vez.
 */
export async function revisarCambiosEnEventosGuardados(usuarioId: string): Promise<void> {
  const db = await obtenerBaseDeDatos();
  const guardados = await db.getAllAsync<{ id: string; eventoId: string; idNotificacion: string | null }>(
    "SELECT id, eventoId, idNotificacion FROM eventos_guardados WHERE usuarioId = ? AND avisoCambioEnviado = 0",
    usuarioId,
  );
  if (guardados.length === 0) return;

  let eventos: Evento[];
  try {
    eventos = await obtenerTodos();
  } catch {
    return; // Sin red y sin copia local no hay con qué comparar.
  }

  for (const guardado of guardados) {
    const evento = eventos.find((e) => e.id === guardado.eventoId);
    if (!evento || (evento.estado !== "suspendido" && evento.estado !== "cancelado")) continue;

    if (guardado.idNotificacion) await cancelarRecordatorio(guardado.idNotificacion);
    await db.runAsync(
      "UPDATE eventos_guardados SET avisoCambioEnviado = 1, idNotificacion = NULL WHERE id = ?",
      guardado.id,
    );
    await notificarAhora({
      titulo: evento.estado === "suspendido" ? "Evento suspendido" : "Evento cancelado",
      cuerpo: `${evento.titulo}: ${evento.estado === "suspendido" ? "se suspendió" : "se canceló"}. Tocá para ver el detalle.`,
      ruta: `/evento/${evento.id}`,
    });
  }
}
