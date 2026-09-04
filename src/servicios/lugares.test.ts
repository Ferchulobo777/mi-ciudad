import { distanciaEnMetros, formatearDistancia, estaAbiertoAhora } from "@/servicios/lugares";
import type { Lugar } from "@/tipos";

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

  it("usa kilómetros con un decimal a partir de 1000 metros", () => {
    expect(formatearDistancia(1500)).toBe("1.5 km");
  });

  it("formatea una distancia larga en kilómetros", () => {
    expect(formatearDistancia(48200)).toBe("48.2 km");
  });
});

function crearLugarDePrueba(horarios: Lugar["horarios"]): Lugar {
  return {
    id: "lugar-de-prueba",
    nombre: "Lugar de prueba",
    categoriaId: "cat-prueba",
    descripcionCorta: "",
    descripcion: "",
    coordenadas: { latitud: 0, longitud: 0 },
    direccion: "",
    imagenes: [],
    horarios,
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

describe("estaAbiertoAhora", () => {
  it("está cerrado si no hay horario cargado para ese día", () => {
    const lugar = crearLugarDePrueba([{ dia: 1, abre: "09:00", cierra: "18:00" }]);
    const domingo = new Date(2026, 8, 6, 12, 0); // domingo = día 0
    expect(estaAbiertoAhora(lugar, domingo)).toBe(false);
  });

  it("está abierto dentro del horario del día", () => {
    const lugar = crearLugarDePrueba([{ dia: 1, abre: "09:00", cierra: "18:00" }]);
    const lunesAlMediodia = new Date(2026, 8, 7, 12, 0); // lunes = día 1
    expect(estaAbiertoAhora(lugar, lunesAlMediodia)).toBe(true);
  });

  it("está cerrado justo antes de la apertura", () => {
    const lugar = crearLugarDePrueba([{ dia: 1, abre: "09:00", cierra: "18:00" }]);
    const antesDeAbrir = new Date(2026, 8, 7, 8, 59);
    expect(estaAbiertoAhora(lugar, antesDeAbrir)).toBe(false);
  });

  it("sigue abierto en el minuto exacto del cierre", () => {
    const lugar = crearLugarDePrueba([{ dia: 1, abre: "09:00", cierra: "18:00" }]);
    const justoAlCierre = new Date(2026, 8, 7, 18, 0);
    expect(estaAbiertoAhora(lugar, justoAlCierre)).toBe(true);
  });

  it("está cerrado un minuto después del cierre", () => {
    const lugar = crearLugarDePrueba([{ dia: 1, abre: "09:00", cierra: "18:00" }]);
    const despuesDelCierre = new Date(2026, 8, 7, 18, 1);
    expect(estaAbiertoAhora(lugar, despuesDelCierre)).toBe(false);
  });
});
