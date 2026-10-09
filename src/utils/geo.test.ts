import { distanciaEnMetros, formatearDistancia, ordenarPorDistancia, puntoCardinal, rumboEnGrados } from "@/utils/geo";

describe("distanciaEnMetros", () => {
  it("devuelve 0 para el mismo punto", () => {
    const punto = { latitud: -32.2246, longitud: -58.1489 };
    expect(distanciaEnMetros(punto, punto)).toBe(0);
  });

  it("calcula ~111.2 km para un grado de latitud, sobre el ecuador", () => {
    const distancia = distanciaEnMetros({ latitud: 0, longitud: 0 }, { latitud: 1, longitud: 0 });
    expect(distancia).toBeCloseTo(111194.9, 0);
  });

  it("calcula la distancia entre dos lugares reales de Colón", () => {
    const termas = { latitud: -32.1998, longitud: -58.1462 };
    const costanera = { latitud: -32.2087, longitud: -58.1418 };
    expect(distanciaEnMetros(termas, costanera)).toBeCloseTo(1072.7, 0);
  });
});

describe("formatearDistancia", () => {
  it("redondea a la decena de metros más cercana cuando es menor a 1 km", () => {
    expect(formatearDistancia(432)).toBe("430 m");
  });

  it("no agrega decimales para distancias cortas", () => {
    expect(formatearDistancia(50)).toBe("50 m");
  });

  it("usa kilómetros con un decimal y coma decimal a partir de 1000 metros", () => {
    expect(formatearDistancia(1500)).toBe("1,5 km");
  });

  it("formatea una distancia larga en kilómetros", () => {
    expect(formatearDistancia(48200)).toBe("48,2 km");
  });
});

describe("rumboEnGrados", () => {
  const origen = { latitud: -32.2246, longitud: -58.1489 };

  it("da 0° para un punto exactamente al norte", () => {
    expect(rumboEnGrados(origen, { latitud: -32.2, longitud: -58.1489 })).toBeCloseTo(0, 5);
  });

  it("da ~90° para un punto al este", () => {
    expect(rumboEnGrados(origen, { latitud: -32.2246, longitud: -58.1 })).toBeCloseTo(90, 0);
  });

  it("da 180° para un punto al sur", () => {
    expect(rumboEnGrados(origen, { latitud: -32.3, longitud: -58.1489 })).toBeCloseTo(180, 5);
  });

  it("siempre devuelve un valor entre 0 y 360", () => {
    const alOeste = rumboEnGrados(origen, { latitud: -32.2246, longitud: -58.2 });
    expect(alOeste).toBeGreaterThanOrEqual(0);
    expect(alOeste).toBeLessThan(360);
    expect(alOeste).toBeCloseTo(270, 0);
  });
});

describe("puntoCardinal", () => {
  it("nombra los cuatro puntos principales", () => {
    expect(puntoCardinal(0)).toBe("norte");
    expect(puntoCardinal(90)).toBe("este");
    expect(puntoCardinal(180)).toBe("sur");
    expect(puntoCardinal(270)).toBe("oeste");
  });

  it("nombra los intermedios", () => {
    expect(puntoCardinal(45)).toBe("noreste");
    expect(puntoCardinal(225)).toBe("suroeste");
  });

  it("agrupa en el norte los rumbos cercanos a 360°", () => {
    expect(puntoCardinal(350)).toBe("norte");
    expect(puntoCardinal(-10)).toBe("norte");
  });
});

describe("ordenarPorDistancia", () => {
  it("ordena del más cercano al más lejano sin modificar el arreglo original", () => {
    const desde = { latitud: -32.2, longitud: -58.14 };
    const lejos = { id: "lejos", coordenadas: { latitud: -32.3, longitud: -58.14 } };
    const cerca = { id: "cerca", coordenadas: { latitud: -32.201, longitud: -58.14 } };
    const original = [lejos, cerca];

    expect(ordenarPorDistancia(original, desde).map((l) => l.id)).toEqual(["cerca", "lejos"]);
    expect(original.map((l) => l.id)).toEqual(["lejos", "cerca"]);
  });
});
