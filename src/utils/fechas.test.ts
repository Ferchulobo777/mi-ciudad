import { formatearHora, formatearEncabezadoDeDia } from "@/utils/fechas";

describe("formatearHora", () => {
  it("formatea la hora en formato de 12 horas con AM/PM en español", () => {
    const fecha = new Date(2026, 8, 4, 14, 30);
    expect(formatearHora(fecha)).toBe("02:30 p. m.");
  });

  it("agrega el cero a la izquierda en los minutos", () => {
    const fecha = new Date(2026, 8, 4, 9, 5);
    expect(formatearHora(fecha)).toBe("09:05 a. m.");
  });
});

describe("formatearEncabezadoDeDia", () => {
  const ahora = new Date(2026, 8, 4, 12, 0);

  it('devuelve "Hoy" para la misma fecha, sin importar la hora', () => {
    const fecha = new Date(2026, 8, 4, 23, 59);
    expect(formatearEncabezadoDeDia(fecha, ahora)).toBe("Hoy");
  });

  it('devuelve "Mañana" para el día siguiente', () => {
    const fecha = new Date(2026, 8, 5, 0, 1);
    expect(formatearEncabezadoDeDia(fecha, ahora)).toBe("Mañana");
  });

  it("devuelve el nombre del día para una fecha más lejana", () => {
    const fecha = new Date(2026, 8, 10);
    expect(formatearEncabezadoDeDia(fecha, ahora)).toBe("jueves, 10 de septiembre");
  });

  it("no confunde el mismo día del mes en otro año con hoy", () => {
    const fecha = new Date(2025, 8, 4);
    expect(formatearEncabezadoDeDia(fecha, ahora)).not.toBe("Hoy");
  });
});
