import type { Lugar } from "@/tipos";
import {
  MINUTOS_ENTRE_AVISOS,
  claveDelDia,
  elegirLugarParaAvisar,
  lugaresDeInteres,
  registrarAviso,
  registroVacio,
} from "@/utils/proximidad";

function lugar(id: string, latitud: number, longitud: number): Lugar {
  return {
    id,
    nombre: id,
    categoriaId: "cat-prueba",
    descripcionCorta: "",
    descripcion: "",
    coordenadas: { latitud, longitud },
    direccion: "",
    imagenes: [],
    horarios: [],
    telefono: null,
    sitioWeb: null,
    precioEntrada: null,
    audioguia: null,
    codigoQr: null,
    accesible: false,
    activo: true,
    actualizadoEn: "2026-01-01T00:00:00-03:00",
  };
}

// Un milésimo de grado de latitud son unos 111 metros.
const turista = { latitud: -32.2, longitud: -58.14 };
const aCien = lugar("a-cien-metros", -32.2009, -58.14);
const aDoscientos = lugar("a-doscientos-metros", -32.2018, -58.14);
const aUnKilometro = lugar("a-un-kilometro", -32.209, -58.14);
const ahora = new Date(2026, 9, 9, 15, 0);

describe("elegirLugarParaAvisar", () => {
  it("avisa del lugar más cercano dentro del radio", () => {
    const elegido = elegirLugarParaAvisar([aDoscientos, aCien, aUnKilometro], turista, 250, registroVacio(ahora), ahora);
    expect(elegido?.id).toBe("a-cien-metros");
  });

  it("no avisa si no hay ningún lugar dentro del radio", () => {
    expect(elegirLugarParaAvisar([aUnKilometro], turista, 250, registroVacio(ahora), ahora)).toBeNull();
  });

  it("respeta el radio elegido en el perfil", () => {
    expect(elegirLugarParaAvisar([aDoscientos], turista, 100, registroVacio(ahora), ahora)).toBeNull();
    expect(elegirLugarParaAvisar([aDoscientos], turista, 250, registroVacio(ahora), ahora)?.id).toBe("a-doscientos-metros");
  });

  it("no repite el aviso de un lugar el mismo día", () => {
    const yaAvisado = { dia: claveDelDia(ahora), lugaresAvisados: ["a-cien-metros"], ultimoAviso: null };
    const elegido = elegirLugarParaAvisar([aCien, aDoscientos], turista, 250, yaAvisado, ahora);
    expect(elegido?.id).toBe("a-doscientos-metros");
  });

  it("vuelve a avisar del mismo lugar al día siguiente", () => {
    const ayer = { dia: "2026-10-08", lugaresAvisados: ["a-cien-metros"], ultimoAviso: new Date(2026, 9, 8, 15, 0).getTime() };
    expect(elegirLugarParaAvisar([aCien], turista, 250, ayer, ahora)?.id).toBe("a-cien-metros");
  });

  it("no avisa de nada si el último aviso fue hace menos del intervalo mínimo", () => {
    const haceUnRato = registrarAviso(registroVacio(ahora), "otro-lugar", new Date(ahora.getTime() - 60 * 1000));
    expect(elegirLugarParaAvisar([aCien], turista, 250, haceUnRato, ahora)).toBeNull();
  });

  it("vuelve a avisar pasado el intervalo mínimo", () => {
    const antes = new Date(ahora.getTime() - (MINUTOS_ENTRE_AVISOS + 1) * 60 * 1000);
    const registro = registrarAviso(registroVacio(antes), "otro-lugar", antes);
    expect(elegirLugarParaAvisar([aCien], turista, 250, registro, ahora)?.id).toBe("a-cien-metros");
  });
});

describe("lugaresDeInteres", () => {
  const termas = { ...lugar("termas", -32.2, -58.14), categoriaId: "cat-termas" };
  const molino = { ...lugar("molino", -32.2, -58.14), categoriaId: "cat-museos" };
  const playa = { ...lugar("playa", -32.2, -58.14), categoriaId: "cat-playas" };

  it("incluye los lugares marcados como favoritos", () => {
    expect(lugaresDeInteres([termas, molino, playa], ["molino"], []).map((l) => l.id)).toEqual(["molino"]);
  });

  it("incluye los lugares de las categorías favoritas", () => {
    expect(lugaresDeInteres([termas, molino, playa], [], ["cat-playas"]).map((l) => l.id)).toEqual(["playa"]);
  });

  it("suma las dos cosas sin repetir lugares", () => {
    const resultado = lugaresDeInteres([termas, molino, playa], ["termas"], ["cat-termas", "cat-museos"]);
    expect(resultado.map((l) => l.id)).toEqual(["termas", "molino"]);
  });

  it("si el turista no marcó nada, no hay de qué avisar", () => {
    expect(lugaresDeInteres([termas, molino, playa], [], [])).toEqual([]);
  });
});

describe("registrarAviso", () => {
  it("agrega el lugar y guarda el momento del aviso", () => {
    const registro = registrarAviso(registroVacio(ahora), "a-cien-metros", ahora);
    expect(registro).toEqual({ dia: "2026-10-09", lugaresAvisados: ["a-cien-metros"], ultimoAviso: ahora.getTime() });
  });

  it("descarta lo avisado el día anterior al registrar uno nuevo", () => {
    const ayer = { dia: "2026-10-08", lugaresAvisados: ["viejo"], ultimoAviso: 0 };
    expect(registrarAviso(ayer, "nuevo", ahora).lugaresAvisados).toEqual(["nuevo"]);
  });
});
