import { obtenerBaseDeDatos } from "./base-datos";

async function guardarEnCache(clave: string, valor: unknown): Promise<void> {
  const db = await obtenerBaseDeDatos();
  await db.runAsync(
    "INSERT OR REPLACE INTO cache_api (clave, valor, guardadoEn) VALUES (?, ?, ?)",
    clave,
    JSON.stringify(valor),
    new Date().toISOString(),
  );
}

async function leerDeCache<T>(clave: string): Promise<T | null> {
  const db = await obtenerBaseDeDatos();
  const fila = await db.getFirstAsync<{ valor: string }>("SELECT valor FROM cache_api WHERE clave = ?", clave);
  return fila ? (JSON.parse(fila.valor) as T) : null;
}

/**
 * Primero la red; si el pedido falla, lo último que se guardó. Es lo que
 * permite que el turista que abrió la app en el hotel siga viendo los lugares
 * dentro del Parque Nacional El Palmar, donde no hay señal. Si tampoco hay
 * nada guardado, el error sube a la pantalla para que muestre su estado de
 * error con la opción de reintentar.
 */
export async function conRespaldoEnCache<T>(clave: string, pedir: () => Promise<T>): Promise<T> {
  try {
    const valor = await pedir();
    await guardarEnCache(clave, valor);
    return valor;
  } catch (error) {
    const guardado = await leerDeCache<T>(clave);
    if (guardado !== null) return guardado;
    throw error;
  }
}
