import type { Categoria, Lugar } from "@/tipos";
import { pedirApi } from "./api";
import { conRespaldoEnCache } from "./cache";

// Única puerta de entrada a los lugares y categorías: ninguna pantalla habla
// con la API directamente (regla del PRD).
//
// El catálogo se baja entero en un solo pedido (la API admite hasta 500 por
// página) y se guarda en la caché local: es lo que permite seguir viendo los
// lugares dentro de El Palmar, sin señal. Por eso el filtrado y la búsqueda se
// hacen acá y no con los parámetros de GET /lugares, que exigirían red en
// cada búsqueda. El actualizadoDesde con una fecha muy vieja es lo que indica
// la cátedra para que también vengan los lugares dados de baja; se descartan
// más abajo con el campo activo.
async function pedirLugares(): Promise<Lugar[]> {
  return pedirApi<Lugar[]>("/lugares?porPagina=500&actualizadoDesde=2000-01-01T00:00:00-03:00");
}

async function pedirCategorias(): Promise<Categoria[]> {
  return pedirApi<Categoria[]>("/categorias?porPagina=100");
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
