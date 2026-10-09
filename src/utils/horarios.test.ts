import { describirHorario, estaAbiertoAhora, semanaDeHorarios } from "@/utils/horarios";
import type { Lugar } from "@/tipos";

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

// El 6 de septiembre de 2026 es domingo (día 0), el 7 es lunes (día 1).
const lunesAlMediodia = new Date(2026, 8, 7, 12, 0);

describe("estaAbiertoAhora", () => {
  const lugar = crearLugarDePrueba([{ dia: 1, abre: "09:00", cierra: "18:00" }]);

  it("está cerrado si no hay horario cargado para ese día", () => {
    expect(estaAbiertoAhora(lugar, new Date(2026, 8, 6, 12, 0))).toBe(false);
  });

  it("está abierto dentro del horario del día", () => {
    expect(estaAbiertoAhora(lugar, lunesAlMediodia)).toBe(true);
  });

  it("está cerrado justo antes de la apertura", () => {
    expect(estaAbiertoAhora(lugar, new Date(2026, 8, 7, 8, 59))).toBe(false);
  });

  it("sigue abierto en el minuto exacto del cierre", () => {
    expect(estaAbiertoAhora(lugar, new Date(2026, 8, 7, 18, 0))).toBe(true);
  });

  it("está cerrado un minuto después del cierre", () => {
    expect(estaAbiertoAhora(lugar, new Date(2026, 8, 7, 18, 1))).toBe(false);
  });
});

describe("describirHorario", () => {
  it("no dice 'cerrado' de un lugar sin horario, como una playa", () => {
    expect(describirHorario(crearLugarDePrueba([]), lunesAlMediodia)).toEqual({
      estado: "sin-horario",
      texto: "Acceso libre, sin horario",
    });
  });

  it("dice a qué hora cierra cuando está abierto", () => {
    const lugar = crearLugarDePrueba([{ dia: 1, abre: "09:00", cierra: "19:00" }]);
    expect(describirHorario(lugar, lunesAlMediodia)).toEqual({ estado: "abierto", texto: "Abierto ahora · cierra 19:00" });
  });

  it("reconoce un lugar abierto las 24 horas", () => {
    const lugar = crearLugarDePrueba([{ dia: 1, abre: "00:00", cierra: "23:59" }]);
    expect(describirHorario(lugar, lunesAlMediodia).texto).toBe("Abierto las 24 horas");
  });

  it("dice que abre hoy más tarde si todavía no abrió", () => {
    const lugar = crearLugarDePrueba([{ dia: 1, abre: "18:00", cierra: "23:00" }]);
    expect(describirHorario(lugar, lunesAlMediodia)).toEqual({ estado: "cerrado", texto: "Cerrado · abre hoy a las 18:00" });
  });

  it("dice que abre mañana si ya cerró y mañana tiene horario", () => {
    const lugar = crearLugarDePrueba([
      { dia: 1, abre: "09:00", cierra: "11:00" },
      { dia: 2, abre: "10:00", cierra: "19:00" },
    ]);
    expect(describirHorario(lugar, lunesAlMediodia).texto).toBe("Cerrado · abre mañana a las 10:00");
  });

  it("nombra el día cuando el próximo horario es más adelante en la semana", () => {
    // Solo abre los jueves: un lunes tiene que nombrar el día, no decir "mañana".
    const lugar = crearLugarDePrueba([{ dia: 4, abre: "09:00", cierra: "19:00" }]);
    expect(describirHorario(lugar, lunesAlMediodia).texto).toBe("Cerrado · abre el jueves a las 09:00");
  });
});

describe("semanaDeHorarios", () => {
  it("arma la semana de lunes a domingo, con 'Cerrado' en los días sin horario", () => {
    const semana = semanaDeHorarios([
      { dia: 0, abre: "10:00", cierra: "20:00" },
      { dia: 2, abre: "09:00", cierra: "19:00" },
    ]);
    expect(semana).toHaveLength(7);
    expect(semana[0]).toEqual({ dia: "lunes", texto: "Cerrado" });
    expect(semana[1]).toEqual({ dia: "martes", texto: "09:00 a 19:00" });
    expect(semana[6]).toEqual({ dia: "domingo", texto: "10:00 a 20:00" });
  });
});
