import type { NuevaVisita, OrigenVisita, Visita } from "@/tipos";
import { obtenerBaseDeDatos } from "./base-datos";
import { hayInternet, simularPedido } from "./api";

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

export async function listarVisitas(usuarioId: string): Promise<Visita[]> {
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

// Simula el POST /visitas. Con la API real, acá va el fetch con el token en
// Authorization: Bearer y la subida de la foto.
async function subirVisita(visita: Visita): Promise<void> {
  await simularPedido(visita, 300);
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
    if (!(await hayInternet())) return 0;
    const db = await obtenerBaseDeDatos();
    const pendientes = await db.getAllAsync<FilaVisita>(
      "SELECT * FROM visitas WHERE usuarioId = ? AND sincronizada = 0 ORDER BY fechaHora ASC",
      usuarioId,
    );

    let subidas = 0;
    for (const fila of pendientes) {
      try {
        await subirVisita(filaAVisita(fila));
      } catch {
        break; // Se cortó la señal a mitad de camino: el resto queda para la próxima.
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
