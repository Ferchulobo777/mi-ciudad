import type { Categoria, Lugar } from "@/tipos";
import { categoriasSimuladas } from "@/mocks/categorias";
import { lugaresSimulados } from "@/mocks/lugares";
import { envolverLista, simularPedido } from "./api";
import { conRespaldoEnCache } from "./cache";

// Única puerta de entrada a los lugares y categorías: ninguna pantalla
// importa los mocks directamente (regla del PRD). Hoy cada función simula un
// GET a la API; cuando la cátedra publique la real, lo único que cambia es el
// cuerpo de pedirLugares/pedirCategorias por un fetch.
async function pedirLugares(): Promise<Lugar[]> {
  const respuesta = await simularPedido(envolverLista(lugaresSimulados));
  return respuesta.datos;
}

async function pedirCategorias(): Promise<Categoria[]> {
  const respuesta = await simularPedido(envolverLista(categoriasSimuladas));
  return respuesta.datos;
}

async function obtenerCatalogoCompleto(): Promise<Lugar[]> {
  const lugares = await conRespaldoEnCache("lugares", pedirLugares);
  return lugares.filter((lugar) => lugar.activo);
}

export async function listarCategorias(): Promise<Categoria[]> {
  const categorias = await conRespaldoEnCache("categorias", pedirCategorias);
  return [...categorias].sort((a, b) => a.orden - b.orden);
}

interface FiltroLugares {
  categoriaId?: string | null;
  busqueda?: string;
}

export async function listarLugares(filtro: FiltroLugares = {}): Promise<Lugar[]> {
  let resultado = await obtenerCatalogoCompleto();

  if (filtro.categoriaId) {
    resultado = resultado.filter((lugar) => lugar.categoriaId === filtro.categoriaId);
  }
  if (filtro.busqueda?.trim()) {
    const termino = normalizar(filtro.busqueda);
    resultado = resultado.filter((lugar) => normalizar(lugar.nombre).includes(termino));
  }
  return resultado;
}

// Sin tildes ni mayúsculas: el turista escribe "colon" o "museo" en el
// teclado del celular, al sol y con una mano, y tiene que encontrar igual
// "Termas de Colón" o "Museos".
function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export async function obtenerLugaresPorIds(ids: string[]): Promise<Lugar[]> {
  const lugares = await obtenerCatalogoCompleto();
  return lugares.filter((lugar) => ids.includes(lugar.id));
}

export async function obtenerLugar(id: string): Promise<Lugar | null> {
  const lugares = await obtenerCatalogoCompleto();
  return lugares.find((lugar) => lugar.id === id) ?? null;
}

export async function obtenerCategoria(id: string): Promise<Categoria | null> {
  const categorias = await listarCategorias();
  return categorias.find((categoria) => categoria.id === id) ?? null;
}
