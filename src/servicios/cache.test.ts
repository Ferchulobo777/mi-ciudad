import { conRespaldoEnCache } from "@/servicios/cache";

// Base de datos falsa en memoria (Jest exige el prefijo "mock" para usarla
// dentro de jest.mock). Lo que se prueba acá es la decisión de
// cuándo usar la copia guardada, no expo-sqlite, que ya está probado por
// Expo.
const mockTabla = new Map<string, string>();
jest.mock("@/servicios/base-datos", () => ({
  obtenerBaseDeDatos: async () => ({
    runAsync: async (_sql: string, clave: string, valor: string) => {
      mockTabla.set(clave, valor);
    },
    getFirstAsync: async (_sql: string, clave: string) => (mockTabla.has(clave) ? { valor: mockTabla.get(clave) } : null),
  }),
}));

beforeEach(() => mockTabla.clear());

describe("conRespaldoEnCache", () => {
  it("con conexión devuelve lo que trae la API y lo guarda", async () => {
    const resultado = await conRespaldoEnCache("lugares", async () => ["termas", "molino"]);
    expect(resultado).toEqual(["termas", "molino"]);
    expect(JSON.parse(mockTabla.get("lugares") as string)).toEqual(["termas", "molino"]);
  });

  it("sin conexión devuelve lo último que se guardó (el caso del Parque El Palmar)", async () => {
    await conRespaldoEnCache("lugares", async () => ["termas", "molino"]);
    const resultado = await conRespaldoEnCache("lugares", async () => {
      throw new Error("Sin señal");
    });
    expect(resultado).toEqual(["termas", "molino"]);
  });

  it("sin conexión y sin nada guardado, el error llega a la pantalla", async () => {
    await expect(
      conRespaldoEnCache("eventos", async () => {
        throw new Error("Sin señal");
      }),
    ).rejects.toThrow("Sin señal");
  });

  it("cada clave guarda su propia copia", async () => {
    await conRespaldoEnCache("lugares", async () => ["termas"]);
    await expect(
      conRespaldoEnCache("eventos", async () => {
        throw new Error("Sin señal");
      }),
    ).rejects.toThrow();
  });
});
