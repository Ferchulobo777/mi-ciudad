import type { Evento } from "@/tipos";
import { eventosVigentes, formatearEncabezadoDeDia, formatearFechaDeEvento, formatearHora } from "@/utils/fechas";

function evento(id: string, inicio: Date, fin: Date | null, estado: Evento["estado"] = "programado"): Evento {
  return {
    id,
    titulo: id,
    descripcion: "",
    lugarId: null,
    direccionLibre: null,
    coordenadas: null,
    inicio: inicio.toISOString(),
    fin: fin ? fin.toISOString() : null,
    imagenUrl: null,
    precio: 0,
    estado,
  };
}

describe("formatearHora", () => {
  it("usa formato de 24 horas", () => {
    expect(formatearHora(new Date(2026, 8, 4, 14, 30))).toBe("14:30");
  });

  it("agrega el cero a la izquierda en la hora y los minutos", () => {
    expect(formatearHora(new Date(2026, 8, 4, 9, 5))).toBe("09:05");
  });

  it('muestra la medianoche como "00:00" y no como "24:00"', () => {
    expect(formatearHora(new Date(2026, 8, 4, 0, 0))).toBe("00:00");
  });
});

describe("formatearEncabezadoDeDia", () => {
  const ahora = new Date(2026, 8, 4, 12, 0);

  it('devuelve "Hoy" para la misma fecha, sin importar la hora', () => {
    expect(formatearEncabezadoDeDia(new Date(2026, 8, 4, 23, 59), ahora)).toBe("Hoy");
  });

  it('devuelve "Mañana" para el día siguiente', () => {
    expect(formatearEncabezadoDeDia(new Date(2026, 8, 5, 0, 1), ahora)).toBe("Mañana");
  });

  it("devuelve el nombre del día para una fecha más lejana", () => {
    expect(formatearEncabezadoDeDia(new Date(2026, 8, 10), ahora)).toBe("jueves, 10 de septiembre");
  });

  it("no confunde el mismo día del mes en otro año con hoy", () => {
    expect(formatearEncabezadoDeDia(new Date(2025, 8, 4), ahora)).not.toBe("Hoy");
  });
});

describe("formatearFechaDeEvento", () => {
  const ahora = new Date(2026, 8, 12, 10, 0);

  it("arma la línea de fecha del detalle, con hora de inicio y fin", () => {
    const peña = evento("pena", new Date(2026, 8, 12, 20, 0), new Date(2026, 8, 12, 23, 0));
    expect(formatearFechaDeEvento(peña, ahora)).toBe("Hoy, 12 de septiembre · 20:00 a 23:00");
  });

  it("muestra solo la hora de inicio si el evento no tiene fin", () => {
    const visita = evento("visita", new Date(2026, 8, 13, 10, 0), null);
    expect(formatearFechaDeEvento(visita, ahora)).toBe("Mañana, 13 de septiembre · 10:00");
  });
});

describe("eventosVigentes", () => {
  const ahora = new Date(2026, 8, 12, 18, 0);

  it("descarta los eventos que ya terminaron", () => {
    const terminado = evento("terminado", new Date(2026, 8, 12, 10, 0), new Date(2026, 8, 12, 12, 0));
    const proximo = evento("proximo", new Date(2026, 8, 12, 20, 0), new Date(2026, 8, 12, 23, 0));
    expect(eventosVigentes([terminado, proximo], ahora).map((e) => e.id)).toEqual(["proximo"]);
  });

  it("mantiene un evento que está en curso", () => {
    const enCurso = evento("en-curso", new Date(2026, 8, 12, 17, 0), new Date(2026, 8, 12, 19, 0));
    expect(eventosVigentes([enCurso], ahora)).toHaveLength(1);
  });

  it("descarta los finalizados aunque su fecha sea futura", () => {
    const finalizado = evento("finalizado", new Date(2026, 8, 13, 10, 0), null, "finalizado");
    expect(eventosVigentes([finalizado], ahora)).toHaveLength(0);
  });

  it("mantiene los suspendidos, para que quien lo iba a ver se entere", () => {
    const suspendido = evento("suspendido", new Date(2026, 8, 12, 21, 0), null, "suspendido");
    expect(eventosVigentes([suspendido], ahora)).toHaveLength(1);
  });

  it("los ordena por hora de inicio", () => {
    const tarde = evento("tarde", new Date(2026, 8, 13, 21, 0), null);
    const temprano = evento("temprano", new Date(2026, 8, 13, 9, 0), null);
    expect(eventosVigentes([tarde, temprano], ahora).map((e) => e.id)).toEqual(["temprano", "tarde"]);
  });
});
