import type { Categoria, Lugar } from "@/tipos";
import { categoriasSimuladas } from "@/mocks/categorias";
import { lugaresSimulados } from "@/mocks/lugares";

function simularLatenciaDeRed<T>(valor: T, ms = 400): Promise<T> {
  return new Promise((resolver) => setTimeout(() => resolver(valor), ms));
}

// Fórmula de haversine, para poder ordenar por distancia sin depender todavía
// de expo-location: la posición del turista se recibe como parámetro y se
// simula desde la pantalla mientras no esté conectado el sensor real de GPS.
export function distanciaEnMetros(a: { latitud: number; longitud: number }, b: { latitud: number; longitud: number }) {
  const radioTierra = 6371000;
  const radianes = (grados: number) => (grados * Math.PI) / 180;
  const dLat = radianes(b.latitud - a.latitud);
  const dLon = radianes(b.longitud - a.longitud);
  const factor =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radianes(a.latitud)) * Math.cos(radianes(b.latitud)) * Math.sin(dLon / 2) ** 2;
  return radioTierra * 2 * Math.atan2(Math.sqrt(factor), Math.sqrt(1 - factor));
}

export async function listarCategorias(): Promise<Categoria[]> {
  await simularLatenciaDeRed(null);
  return [...categoriasSimuladas].sort((a, b) => a.orden - b.orden);
}

interface FiltroLugares {
  categoriaId?: string | null;
  busqueda?: string;
}

export async function listarLugares(filtro: FiltroLugares = {}): Promise<Lugar[]> {
  await simularLatenciaDeRed(null);
  let resultado = lugaresSimulados.filter((lugar) => lugar.activo);

  if (filtro.categoriaId) {
    resultado = resultado.filter((lugar) => lugar.categoriaId === filtro.categoriaId);
  }
  if (filtro.busqueda?.trim()) {
    const termino = filtro.busqueda.trim().toLowerCase();
    resultado = resultado.filter((lugar) => lugar.nombre.toLowerCase().includes(termino));
  }
  return resultado;
}

export async function obtenerLugaresPorIds(ids: string[]): Promise<Lugar[]> {
  await simularLatenciaDeRed(null);
  return lugaresSimulados.filter((lugar) => ids.includes(lugar.id));
}

export async function obtenerLugar(id: string): Promise<Lugar | null> {
  await simularLatenciaDeRed(null);
  return lugaresSimulados.find((lugar) => lugar.id === id) ?? null;
}

// 0 es domingo, igual que Date.getDay(): mismo criterio documentado en Horario.
export function estaAbiertoAhora(lugar: Lugar, ahora = new Date()): boolean {
  const horarioDeHoy = lugar.horarios.find((h) => h.dia === ahora.getDay());
  if (!horarioDeHoy) return false;

  const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
  const [horaApertura, minutoApertura] = horarioDeHoy.abre.split(":").map(Number);
  const [horaCierre, minutoCierre] = horarioDeHoy.cierra.split(":").map(Number);
  const minutosApertura = horaApertura * 60 + minutoApertura;
  const minutosCierre = horaCierre * 60 + minutoCierre;

  return minutosActuales >= minutosApertura && minutosActuales <= minutosCierre;
}
