import type { Evento } from "@/tipos";
import { eventosSimulados } from "@/mocks/eventos";
import { obtenerBaseDeDatos } from "./base-datos";
import { programarRecordatorio, cancelarRecordatorio } from "./notificaciones";

function simularLatenciaDeRed<T>(valor: T, ms = 400): Promise<T> {
  return new Promise((resolver) => setTimeout(() => resolver(valor), ms));
}

export async function listarEventos(): Promise<Evento[]> {
  await simularLatenciaDeRed(null);
  return [...eventosSimulados].sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
}

export async function obtenerEvento(id: string): Promise<Evento | null> {
  await simularLatenciaDeRed(null);
  return eventosSimulados.find((e) => e.id === id) ?? null;
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
  return { guardado: true, conRecordatorio: idNotificacion !== null };
}
