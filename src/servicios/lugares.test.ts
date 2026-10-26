import { listarLugares, obtenerLugar } from "@/servicios/lugares";
import { ErrorDeApi, pedirApi } from "@/servicios/api";
import { categoriasSimuladas } from "@/mocks/categorias";
import { lugaresSimulados } from "@/mocks/lugares";
import * as Network from "expo-network";

// Sin base de datos: la caché se prueba aparte (cache.test.ts). Acá interesa
// el filtrado que hace la capa de servicios sobre lo que devuelve la API y
// cómo se desenvuelve el sobre { datos, meta } / { error }.
jest.mock("@/servicios/cache", () => ({
  conRespaldoEnCache: (_clave: string, pedir: () => Promise<unknown>) => pedir(),
}));

jest.mock("expo-network", () => ({
  getNetworkStateAsync: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
}));

function respuestaJson(estado: number, cuerpo: unknown) {
  return { ok: estado >= 200 && estado < 300, status: estado, json: async () => cuerpo } as Response;
}

// Los mocks quedan como datos de prueba con la misma forma que la API.
const fetchFalso = jest.fn(async (url: string) => {
  if (url.includes("/lugares")) {
    return respuestaJson(200, { datos: lugaresSimulados, meta: { total: lugaresSimulados.length, pagina: 1, porPagina: 500 } });
  }
  if (url.includes("/categorias")) {
    return respuestaJson(200, { datos: categoriasSimuladas, meta: { total: categoriasSimuladas.length, pagina: 1, porPagina: 100 } });
  }
  return respuestaJson(404, { error: { codigo: "RUTA_NO_ENCONTRADA", mensaje: "Esa dirección no existe en la API." } });
});

beforeAll(() => {
  globalThis.fetch = fetchFalso as unknown as typeof fetch;
});

describe("listarLugares", () => {
  it("filtra por categoría", async () => {
    const termas = await listarLugares({ categoriaId: "cat-termas" });
    expect(termas.length).toBeGreaterThan(0);
    expect(termas.every((l) => l.categoriaId === "cat-termas")).toBe(true);
  });

  it("busca sin importar tildes ni mayúsculas", async () => {
    const resultado = await listarLugares({ busqueda: "COLON" });
    expect(resultado.map((l) => l.nombre)).toContain("Termas de Colón");
  });

  it("devuelve una lista vacía si nada coincide con la búsqueda", async () => {
    expect(await listarLugares({ busqueda: "no existe este lugar" })).toEqual([]);
  });

  it("solo devuelve lugares activos", async () => {
    const todos = await listarLugares();
    expect(todos.every((l) => l.activo)).toBe(true);
  });

  it("pide el catálogo entero, incluidos los dados de baja", async () => {
    await listarLugares();
    const url = fetchFalso.mock.calls.at(-1)?.[0] ?? "";
    expect(url).toContain("porPagina=500");
    expect(url).toContain("actualizadoDesde=");
  });
});

describe("obtenerLugar", () => {
  it("devuelve null para un id que no existe", async () => {
    expect(await obtenerLugar("lugar-que-no-existe")).toBeNull();
  });
});

describe("pedirApi", () => {
  it("sin conexión falla con el código SIN_CONEXION sin llegar a hacer el pedido", async () => {
    jest.mocked(Network.getNetworkStateAsync).mockResolvedValueOnce({
      isConnected: false,
      isInternetReachable: false,
    } as Network.NetworkState);
    const pedidosAntes = fetchFalso.mock.calls.length;
    await expect(pedirApi("/lugares")).rejects.toMatchObject({ codigo: "SIN_CONEXION" });
    expect(fetchFalso.mock.calls.length).toBe(pedidosAntes);
  });

  it("convierte el sobre de error de la API en un ErrorDeApi con su código y estado", async () => {
    await expect(pedirApi("/no-existe")).rejects.toMatchObject({
      codigo: "RUTA_NO_ENCONTRADA",
      estadoHttp: 404,
    });
  });

  it("si el servidor no responde, lo trata como falta de conexión", async () => {
    fetchFalso.mockRejectedValueOnce(new TypeError("Network request failed"));
    await expect(pedirApi("/lugares")).rejects.toMatchObject({ codigo: "SIN_CONEXION" });
  });

  it("ErrorDeApi conserva el código para que la pantalla decida qué mostrar", () => {
    const error = new ErrorDeApi("LUGAR_NO_ENCONTRADO", "No existe ese lugar.", 404);
    expect(error.codigo).toBe("LUGAR_NO_ENCONTRADO");
    expect(error.message).toBe("No existe ese lugar.");
  });
});
