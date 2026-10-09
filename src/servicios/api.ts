import * as Network from "expo-network";

// Forma de respuesta que fija la cátedra para su API ({ datos, meta } en el
// éxito, { error: { codigo, mensaje } } en el error). El mock ya responde con
// esa forma para que, el día que se reemplace por un fetch real, los
// servicios que la desenvuelven no tengan que cambiar.
export interface RespuestaLista<T> {
  datos: T[];
  meta: { total: number; pagina: number; porPagina: number };
}

export class ErrorDeApi extends Error {
  readonly codigo: string;

  constructor(codigo: string, mensaje: string) {
    super(mensaje);
    this.codigo = codigo;
  }
}

export async function hayInternet(): Promise<boolean> {
  try {
    const estado = await Network.getNetworkStateAsync();
    return Boolean(estado.isConnected) && estado.isInternetReachable !== false;
  } catch {
    // Si ni siquiera se puede consultar el estado de la red, se asume que
    // hay: el pedido real va a fallar por su cuenta si no es así.
    return true;
  }
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

/**
 * Simula un pedido a la API mientras la cátedra no publique la real. Sin
 * conexión falla igual que fallaría un fetch, para que la caché local y los
 * estados de error de las pantallas se puedan probar de verdad (con el modo
 * avión), y no solo en teoría.
 */
export async function simularPedido<T>(respuesta: T, ms = 400): Promise<T> {
  if (!(await hayInternet())) {
    throw new ErrorDeApi("SIN_CONEXION", "No hay conexión a internet.");
  }
  await esperar(ms);
  return respuesta;
}

export function envolverLista<T>(datos: T[]): RespuestaLista<T> {
  return { datos, meta: { total: datos.length, pagina: 1, porPagina: datos.length } };
}
