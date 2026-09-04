import type { NuevaVisita, OrigenVisita, Visita } from "@/tipos";
import { obtenerBaseDeDatos } from "./base-datos";

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

// Se guarda siempre con sincronizada en false: no existe todavía la llamada
// real a la API de la cátedra para subirla (el contrato ya prevé este campo
// justamente para el caso del Parque Nacional El Palmar, sin señal).
export async function registrarVisita(usuarioId: string, nueva: NuevaVisita): Promise<Visita> {
  const db = await obtenerBaseDeDatos();
  const id = `visita-${usuarioId}-${Date.now()}`;

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
