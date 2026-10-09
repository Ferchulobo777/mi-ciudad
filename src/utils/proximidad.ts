import type { Coordenadas, Lugar } from "@/tipos";
import { distanciaEnMetros } from "@/utils/geo";

export interface RegistroDeAvisos {
  /** Día al que corresponde el registro, en formato AAAA-MM-DD local. */
  dia: string;
  lugaresAvisados: string[];
  /** Momento del último aviso de proximidad, en milisegundos. */
  ultimoAviso: number | null;
}

// Además del tope de un aviso por lugar por día que pide el PRD, se deja un
// intervalo mínimo entre avisos: caminando por la peatonal se pasa por varios
// lugares en pocas cuadras, y el PRD es explícito en que eso no puede
// convertirse en doce notificaciones seguidas.
export const MINUTOS_ENTRE_AVISOS = 10;

export function claveDelDia(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function registroVacio(ahora: Date): RegistroDeAvisos {
  return { dia: claveDelDia(ahora), lugaresAvisados: [], ultimoAviso: null };
}

/**
 * Decide si corresponde avisar y de qué lugar. Si hay varios dentro del
 * radio, se avisa solo del más cercano: un aviso agrupado vale más que varios
 * sueltos. Es una función pura para poder probarla sin GPS ni notificaciones.
 */
export function elegirLugarParaAvisar(
  lugares: Lugar[],
  posicion: Coordenadas,
  radioMetros: number,
  registro: RegistroDeAvisos,
  ahora: Date,
): Lugar | null {
  const vigente = registro.dia === claveDelDia(ahora) ? registro : registroVacio(ahora);

  if (vigente.ultimoAviso !== null && ahora.getTime() - vigente.ultimoAviso < MINUTOS_ENTRE_AVISOS * 60 * 1000) {
    return null;
  }

  let elegido: Lugar | null = null;
  let menorDistancia = Infinity;
  for (const lugar of lugares) {
    if (vigente.lugaresAvisados.includes(lugar.id)) continue;
    const distancia = distanciaEnMetros(posicion, lugar.coordenadas);
    if (distancia <= radioMetros && distancia < menorDistancia) {
      elegido = lugar;
      menorDistancia = distancia;
    }
  }
  return elegido;
}

export function registrarAviso(registro: RegistroDeAvisos, lugarId: string, ahora: Date): RegistroDeAvisos {
  const vigente = registro.dia === claveDelDia(ahora) ? registro : registroVacio(ahora);
  return {
    dia: vigente.dia,
    lugaresAvisados: [...vigente.lugaresAvisados, lugarId],
    ultimoAviso: ahora.getTime(),
  };
}
