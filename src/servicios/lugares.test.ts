import { listarLugares, obtenerLugar } from "@/servicios/lugares";
import { ErrorDeApi, simularPedido } from "@/servicios/api";
import * as Network from "expo-network";

// Sin base de datos: la caché se prueba aparte (cache.test.ts). Acá interesa
// el filtrado que hace la capa de servicios sobre lo que devuelve la API.
jest.mock("@/servicios/cache", () => ({
  conRespaldoEnCache: (_clave: string, pedir: () => Promise<unknown>) => pedir(),
}));

jest.mock("expo-network", () => ({
  getNetworkStateAsync: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
}));

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
});

describe("obtenerLugar", () => {
  it("devuelve null para un id que no existe", async () => {
    expect(await obtenerLugar("lugar-que-no-existe")).toBeNull();
  });
});

describe("simularPedido", () => {
  it("sin conexión falla con el código SIN_CONEXION, como fallaría un fetch real", async () => {
    jest.mocked(Network.getNetworkStateAsync).mockResolvedValueOnce({
      isConnected: false,
      isInternetReachable: false,
    } as Network.NetworkState);
    await expect(simularPedido("datos")).rejects.toMatchObject({ codigo: "SIN_CONEXION" });
    await expect(simularPedido("datos", 0)).resolves.toBe("datos");
  });

  it("ErrorDeApi conserva el código para que la pantalla decida qué mostrar", () => {
    const error = new ErrorDeApi("LUGAR_NO_ENCONTRADO", "No existe ese lugar.");
    expect(error.codigo).toBe("LUGAR_NO_ENCONTRADO");
    expect(error.message).toBe("No existe ese lugar.");
  });
});
