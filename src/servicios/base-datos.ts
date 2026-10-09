import * as SQLite from "expo-sqlite";

const NOMBRE_BASE = "mi-ciudad.db";

// Cada posición del arreglo es una versión del esquema. La versión actual de
// la base queda guardada en PRAGMA user_version, así que al abrir solo se
// corren las migraciones que faltan: un teléfono que ya tenía la app
// instalada no pierde sus favoritos ni sus visitas al actualizarla.
const MIGRACIONES = [
  `
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
  `,
  // Versión 2: copia local de las respuestas de la API (catálogo y agenda
  // disponibles sin señal) y marca para no avisar dos veces que se
  // suspendió un evento guardado.
  `
  ALTER TABLE eventos_guardados ADD COLUMN avisoCambioEnviado INTEGER NOT NULL DEFAULT 0;
  CREATE TABLE IF NOT EXISTS cache_api (
    clave TEXT PRIMARY KEY NOT NULL,
    valor TEXT NOT NULL,
    guardadoEn TEXT NOT NULL
  );
  `,
];

async function migrar(db: SQLite.SQLiteDatabase): Promise<void> {
  const fila = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const versionActual = fila?.user_version ?? 0;

  for (let version = versionActual; version < MIGRACIONES.length; version++) {
    // Cada migración va en su propia transacción: si se corta a la mitad, la
    // base no queda con la tabla creada pero con la versión sin actualizar.
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRACIONES[version]);
      await db.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
}

// Se abre una sola vez y se reutiliza la misma promesa: si dos pantallas piden
// la base al mismo tiempo, no se dispara la migración dos veces.
let promesaBase: Promise<SQLite.SQLiteDatabase> | null = null;

export function obtenerBaseDeDatos(): Promise<SQLite.SQLiteDatabase> {
  if (!promesaBase) {
    promesaBase = SQLite.openDatabaseAsync(NOMBRE_BASE).then(async (db) => {
      await db.execAsync("PRAGMA journal_mode = WAL;");
      await migrar(db);
      return db;
    });
  }
  return promesaBase;
}
