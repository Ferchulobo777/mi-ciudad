import type { Evento } from "@/tipos";

// Formato de 24 horas fijo: así se lee la hora en Argentina ("20:00", no
// "8:00 p. m."), y no queda librado a cómo resuelve el locale cada motor de
// JavaScript (Hermes en el teléfono, Node en los tests). Se usa hourCycle
// h23 y no hour12: false porque algunos motores con esa opción muestran la
// medianoche como "24:00".
export function formatearHora(fecha: Date): string {
  return fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

function esMismoDia(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function formatearEncabezadoDeDia(fecha: Date, ahora = new Date()): string {
  const mañana = new Date(ahora);
  mañana.setDate(ahora.getDate() + 1);

  if (esMismoDia(fecha, ahora)) return "Hoy";
  if (esMismoDia(fecha, mañana)) return "Mañana";
  return fecha.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
}

/** "Hoy, 12 de septiembre · 20:00 a 23:00", como en el mockup del detalle de evento. */
export function formatearFechaDeEvento(evento: Evento, ahora = new Date()): string {
  const inicio = new Date(evento.inicio);
  const fecha = inicio.toLocaleDateString("es-AR", { day: "numeric", month: "long" });
  const encabezado = formatearEncabezadoDeDia(inicio, ahora);
  const dia = encabezado === "Hoy" || encabezado === "Mañana" ? `${encabezado}, ${fecha}` : encabezado;
  const horario = evento.fin
    ? `${formatearHora(inicio)} a ${formatearHora(new Date(evento.fin))}`
    : formatearHora(inicio);
  return `${dia} · ${horario}`;
}

/**
 * La agenda arranca por hoy (lo pide el PRD): se descartan los eventos que ya
 * terminaron. Un evento sin hora de fin se considera terminado cuando pasa su
 * hora de inicio.
 */
export function eventosVigentes(eventos: Evento[], ahora = new Date()): Evento[] {
  return eventos
    .filter((evento) => evento.estado !== "finalizado")
    .filter((evento) => new Date(evento.fin ?? evento.inicio).getTime() >= ahora.getTime())
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
}
