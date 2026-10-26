import type { NuevaVisita, OrigenVisita, Visita } from "@/tipos";
import { obtenerBaseDeDatos } from "./base-datos";
import { ErrorDeApi, hayInternet, hayTokenDeApi, pedirApi, subirArchivo } from "./api";

interface FilaVisita {
  id: string;
  usuarioId: string;
  lugarId: string;
  fechaHora: string;
  origen: string;
  fotoUri: string | null;
  nota: string | null;
  sincronizada: number;
}

function filaAVisita(fila: FilaVisita): Visita {
  return {
    id: fila.id,
    usuarioId: fila.usuarioId,
    lugarId: fila.lugarId,
    fechaHora: fila.fechaHora,
    origen: fila.origen as OrigenVisita,
    fotoUri: fila.fotoUri,
    nota: fila.nota,
    sincronizada: fila.sincronizada === 1,
  };
}

// Aviso mínimo para que las pantallas que muestran el contador de visitas
// pendientes se actualicen cuando la sincronización termina en segundo
// plano, sin tener que salir y volver a entrar.
const oyentes = new Set<() => void>();

export function alCambiarLasVisitas(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

function avisarCambio() {
  oyentes.forEach((oyente) => oyente());
}

// La visita se guarda primero en el teléfono, siempre con sincronizada en
// false: se registra parada frente al lugar, donde puede no haber señal. La
// subida queda a cargo de sincronizarVisitasPendientes.
export async function registrarVisita(usuarioId: string, nueva: NuevaVisita): Promise<Visita> {
  const db = await obtenerBaseDeDatos();
  const id = `vis-${usuarioId}-${Date.now()}`;

  await db.runAsync(
    "INSERT INTO visitas (id, usuarioId, lugarId, fechaHora, origen, fotoUri, nota, sincronizada) VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
    id,
    usuarioId,
    nueva.lugarId,
    nueva.fechaHora,
    nueva.origen,
    nueva.fotoUri,
    nueva.nota,
  );
  avisarCambio();
  return { id, usuarioId, sincronizada: false, ...nueva };
}

// Las visitas que la cuenta ya tiene en el servidor (por ejemplo, registradas
// desde otro teléfono) se suman a la tabla local como sincronizadas. Las que
// solo existen acá no se tocan: siguen en la cola hasta que se suban.
async function traerVisitasDeLaCuenta(usuarioId: string): Promise<void> {
  if (!hayTokenDeApi()) return;
  let remotas: Visita[];
  try {
    remotas = await pedirApi<Visita[]>("/yo/visitas?porPagina=500");
  } catch {
    return;
  }
  const db = await obtenerBaseDeDatos();
  for (const visita of remotas) {
    await db.runAsync(
      "INSERT OR IGNORE INTO visitas (id, usuarioId, lugarId, fechaHora, origen, fotoUri, nota, sincronizada) VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
      visita.id,
      usuarioId,
      visita.lugarId,
      visita.fechaHora,
      visita.origen,
      visita.fotoUri,
      visita.nota,
    );
  }
}

export async function listarVisitas(usuarioId: string): Promise<Visita[]> {
  await traerVisitasDeLaCuenta(usuarioId);
  const db = await obtenerBaseDeDatos();
  const filas = await db.getAllAsync<FilaVisita>(
    "SELECT * FROM visitas WHERE usuarioId = ? ORDER BY fechaHora DESC",
    usuarioId,
  );
  return filas.map(filaAVisita);
}

export async function contarVisitasPendientes(usuarioId: string): Promise<number> {
  const db = await obtenerBaseDeDatos();
  const fila = await db.getFirstAsync<{ cantidad: number }>(
    "SELECT COUNT(*) AS cantidad FROM visitas WHERE usuarioId = ? AND sincronizada = 0",
    usuarioId,
  );
  return fila?.cantidad ?? 0;
}

function esArchivoLocal(uri: string): boolean {
  return !/^https?:\/\//i.test(uri);
}

// La foto se sube antes que la visita porque la API solo acepta la url que
// devuelve POST /archivos, nunca un file:// del teléfono. El id es el mismo
// que se generó al guardarla sin señal: POST /yo/visitas es idempotente por
// id, así que si se corta la conexión después de subirla y se reintenta, no
// queda una visita duplicada.
async function subirVisita(visita: Visita): Promise<void> {
  const fotoUri = visita.fotoUri && esArchivoLocal(visita.fotoUri) ? (await subirArchivo(visita.fotoUri)).url : visita.fotoUri;

  await pedirApi("/yo/visitas", {
    metodo: "POST",
    cuerpo: {
      id: visita.id,
      lugarId: visita.lugarId,
      fechaHora: visita.fechaHora,
      origen: visita.origen,
      fotoUri,
      nota: visita.nota,
    },
  });
}

let sincronizacionEnCurso: Promise<number> | null = null;

/**
 * Sube la cola de visitas guardadas sin señal. Se llama al volver la
 * conexión y al entrar a Mi recorrido; si ya hay una sincronización en
 * curso, se reutiliza en vez de subir dos veces la misma visita.
 * Devuelve cuántas se subieron.
 */
export function sincronizarVisitasPendientes(usuarioId: string): Promise<number> {
  if (sincronizacionEnCurso) return sincronizacionEnCurso;

  sincronizacionEnCurso = (async () => {
    // Sin sesión no hay a qué cuenta subirlas: quedan en la cola.
    if (!hayTokenDeApi() || !(await hayInternet())) return 0;
    const db = await obtenerBaseDeDatos();
    const pendientes = await db.getAllAsync<FilaVisita>(
      "SELECT * FROM visitas WHERE usuarioId = ? AND sincronizada = 0 ORDER BY fechaHora ASC",
      usuarioId,
    );

    let subidas = 0;
    for (const fila of pendientes) {
      try {
        await subirVisita(filaAVisita(fila));
      } catch (error) {
        // Un rechazo por los datos (4xx) es propio de esa visita: se saltea
        // para que no frene a las demás. Cualquier otro error es de red o del
        // servidor, y entonces el resto queda para la próxima.
        const estado = error instanceof ErrorDeApi ? error.estadoHttp : null;
        if (estado !== null && estado >= 400 && estado < 500 && estado !== 401) continue;
        break;
      }
      await db.runAsync("UPDATE visitas SET sincronizada = 1 WHERE id = ?", fila.id);
      subidas++;
    }
    if (subidas > 0) avisarCambio();
    return subidas;
  })().finally(() => {
    sincronizacionEnCurso = null;
  });

  return sincronizacionEnCurso;
}
