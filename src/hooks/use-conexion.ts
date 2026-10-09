import { useNetworkState } from "expo-network";

/**
 * true con internet, false sin conexión y undefined mientras todavía no se
 * sabe (al abrir la app): en ese caso las pantallas no muestran el aviso de
 * "sin conexión", para no prenderlo en falso por un instante.
 */
export function useHayConexion(): boolean | undefined {
  const red = useNetworkState();
  if (red.isConnected === undefined) return undefined;
  return Boolean(red.isConnected) && red.isInternetReachable !== false;
}
