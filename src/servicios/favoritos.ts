import type { Favorito } from "@/tipos";
import { obtenerBaseDeDatos } from "./base-datos";
import { hayTokenDeApi, pedirApi } from "./api";

// Los favoritos van a expo-sqlite y no a un arreglo en memoria: tienen que
// sobrevivir al cierre de la aplicación, que es el requisito de persistencia
// local de la cátedra. La cuenta en la API es la fuente de verdad (así se
// recuperan en otro teléfono), y la tabla local es la copia que permite
// verlos y marcarlos sin señal.

/**
 * Trae los favoritos de la cuenta y reemplaza la copia local del usuario.
 * Si no hay sesión o no hay red, se queda con lo que ya estaba guardado.
 */
async function traerFavoritosDeLaCuenta(usuarioId: string): Promise<void> {
  if (!hayTokenDeApi()) return;
  let remotos: Favorito[];
  try {
    remotos = await pedirApi<Favorito[]>("/yo/favoritos?porPagina=100");
  } catch {
    return;
  }

  const db = await obtenerBaseDeDatos();
  // Borrar e insertar dentro de una transacción: si algo falla a mitad de
  // camino, la tabla no queda vacía.
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM favoritos WHERE usuarioId = ?", usuarioId);
    for (const favorito of remotos) {
      await db.runAsync(
        "INSERT OR REPLACE INTO favoritos (id, usuarioId, lugarId, creadoEn) VALUES (?, ?, ?, ?)",
        favorito.id,
        usuarioId,
        favorito.lugarId,
        favorito.creadoEn,
      );
    }
  });
}

export async function listarFavoritos(usuarioId: string): Promise<Favorito[]> {
  await traerFavoritosDeLaCuenta(usuarioId);
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

// PUT y DELETE de la API son idempotentes ("un toque"), así que mandar el
// mismo cambio dos veces no duplica nada. Si no hay red, el cambio queda
// solo en el teléfono hasta la próxima lectura con conexión.
async function sincronizarFavoritoEnCuenta(lugarId: string, esFavoritoAhora: boolean): Promise<void> {
  if (!hayTokenDeApi()) return;
  try {
    await pedirApi(`/yo/favoritos/${encodeURIComponent(lugarId)}`, {
      metodo: esFavoritoAhora ? "PUT" : "DELETE",
    });
  } catch {
    // Sin conexión: el corazón ya cambió en pantalla y en la base local.
  }
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
    await sincronizarFavoritoEnCuenta(lugarId, false);
    return false;
  }

  await db.runAsync(
    "INSERT INTO favoritos (id, usuarioId, lugarId, creadoEn) VALUES (?, ?, ?, ?)",
    `fav-${usuarioId}-${lugarId}`,
    usuarioId,
    lugarId,
    new Date().toISOString(),
  );
  await sincronizarFavoritoEnCuenta(lugarId, true);
  return true;
}
