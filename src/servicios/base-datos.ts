import * as SQLite from "expo-sqlite";

const NOMBRE_BASE = "mi-ciudad.db";

// Se abre una sola vez y se reutiliza la misma promesa: si dos pantallas piden
// la base al mismo tiempo (por ejemplo, el Catálogo y el Detalle de lugar),
// no se dispara la migración dos veces.
let promesaBase: Promise<SQLite.SQLiteDatabase> | null = null;

export function obtenerBaseDeDatos(): Promise<SQLite.SQLiteDatabase> {
  if (!promesaBase) {
    promesaBase = SQLite.openDatabaseAsync(NOMBRE_BASE).then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS favoritos (
          id TEXT PRIMARY KEY NOT NULL,
          usuarioId TEXT NOT NULL,
          lugarId TEXT NOT NULL,
          creadoEn TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS eventos_guardados (
          id TEXT PRIMARY KEY NOT NULL,
          usuarioId TEXT NOT NULL,
          eventoId TEXT NOT NULL,
          idNotificacion TEXT,
          creadoEn TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS visitas (
          id TEXT PRIMARY KEY NOT NULL,
          usuarioId TEXT NOT NULL,
          lugarId TEXT NOT NULL,
          fechaHora TEXT NOT NULL,
          origen TEXT NOT NULL,
          fotoUri TEXT,
          nota TEXT,
          sincronizada INTEGER NOT NULL DEFAULT 0
        );
      `);
      return db;
    });
  }
  return promesaBase;
}
