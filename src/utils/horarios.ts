import type { Horario, Lugar } from "@/tipos";

export const NOMBRES_DE_DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function aMinutos(hora: string): number {
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
}

function horarioDelDia(horarios: Horario[], dia: number): Horario | undefined {
  return horarios.find((h) => h.dia === dia);
}

// 0 es domingo, igual que Date.getDay(): mismo criterio documentado en Horario.
export function estaAbiertoAhora(lugar: Lugar, ahora = new Date()): boolean {
  const deHoy = horarioDelDia(lugar.horarios, ahora.getDay());
  if (!deHoy) return false;
  const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
  return minutosActuales >= aMinutos(deHoy.abre) && minutosActuales <= aMinutos(deHoy.cierra);
}

export type EstadoHorario = "abierto" | "cerrado" | "sin-horario";

export interface DescripcionHorario {
  estado: EstadoHorario;
  texto: string;
}

/**
 * Arma el texto de estado que muestran la tarjeta y el detalle de un lugar
 * ("Abierto ahora · cierra 19:00", "Cerrado · abre mañana a las 09:00").
 * El PRD insiste en no volver a mandar a nadie a una puerta cerrada, así que
 * cuando está cerrado se dice también cuándo abre.
 */
export function describirHorario(lugar: Lugar, ahora = new Date()): DescripcionHorario {
  // Una playa o la costanera no tienen horario: no corresponde decir que
  // están "cerradas" solo porque no hay una franja cargada.
  if (lugar.horarios.length === 0) return { estado: "sin-horario", texto: "Acceso libre, sin horario" };

  const hoy = ahora.getDay();
  const deHoy = horarioDelDia(lugar.horarios, hoy);
  const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();

  if (deHoy && estaAbiertoAhora(lugar, ahora)) {
    const todoElDia = deHoy.abre === "00:00" && deHoy.cierra === "23:59";
    return { estado: "abierto", texto: todoElDia ? "Abierto las 24 horas" : `Abierto ahora · cierra ${deHoy.cierra}` };
  }
  if (deHoy && minutosActuales < aMinutos(deHoy.abre)) {
    return { estado: "cerrado", texto: `Cerrado · abre hoy a las ${deHoy.abre}` };
  }

  for (let salto = 1; salto <= 7; salto++) {
    const dia = (hoy + salto) % 7;
    const siguiente = horarioDelDia(lugar.horarios, dia);
    if (!siguiente) continue;
    const cuando = salto === 1 ? "mañana" : `el ${NOMBRES_DE_DIAS[dia]}`;
    return { estado: "cerrado", texto: `Cerrado · abre ${cuando} a las ${siguiente.abre}` };
  }
  return { estado: "cerrado", texto: "Cerrado" };
}

/** Semana ordenada de lunes a domingo, como se lee un horario en un cartel. */
export function semanaDeHorarios(horarios: Horario[]): { dia: string; texto: string }[] {
  return [1, 2, 3, 4, 5, 6, 0].map((dia) => {
    const horario = horarioDelDia(horarios, dia);
    return {
      dia: NOMBRES_DE_DIAS[dia],
      texto: horario ? `${horario.abre} a ${horario.cierra}` : "Cerrado",
    };
  });
}
