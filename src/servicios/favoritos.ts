import type { Favorito } from "@/tipos";
import { obtenerBaseDeDatos } from "./base-datos";

// Los favoritos van a expo-sqlite y no a un arreglo en memoria: tienen que
// sobrevivir al cierre de la aplicación, que es el requisito de persistencia
// local de la cátedra.
export async function listarFavoritos(usuarioId: string): Promise<Favorito[]> {
  const db = await obtenerBaseDeDatos();
  return db.getAllAsync<Favorito>("SELECT * FROM favoritos WHERE usuarioId = ? ORDER BY creadoEn DESC", usuarioId);
}

export async function esFavorito(usuarioId: string, lugarId: string): Promise<boolean> {
  const db = await obtenerBaseDeDatos();
  const fila = await db.getFirstAsync(
    "SELECT id FROM favoritos WHERE usuarioId = ? AND lugarId = ?",
    usuarioId,
    lugarId,
  );
  return fila !== null;
}

export async function alternarFavorito(usuarioId: string, lugarId: string): Promise<boolean> {
  const db = await obtenerBaseDeDatos();
  const existente = await db.getFirstAsync<{ id: string }>(
    "SELECT id FROM favoritos WHERE usuarioId = ? AND lugarId = ?",
    usuarioId,
    lugarId,
  );

  if (existente) {
    await db.runAsync("DELETE FROM favoritos WHERE id = ?", existente.id);
    return false;
  }

  await db.runAsync(
    "INSERT INTO favoritos (id, usuarioId, lugarId, creadoEn) VALUES (?, ?, ?, ?)",
    `fav-${usuarioId}-${lugarId}`,
    usuarioId,
    lugarId,
    new Date().toISOString(),
  );
  return true;
}
