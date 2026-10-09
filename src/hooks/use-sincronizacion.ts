import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useNetworkState } from "expo-network";
import { useSesion } from "@/hooks/use-sesion";
import { alCambiarLasVisitas, contarVisitasPendientes, sincronizarVisitasPendientes } from "@/servicios/visitas";
import { revisarCambiosEnEventosGuardados } from "@/servicios/eventos";

/**
 * Se monta una sola vez, en el layout de las pestañas. Cada vez que vuelve la
 * conexión sube la cola de visitas guardadas sin señal y revisa si algún
 * evento guardado se suspendió. useNetworkState es reactivo: no hace falta
 * escuchar los cambios de red a mano.
 */
export function useSincronizacionAlVolverLaConexion() {
  const { usuario } = useSesion();
  const red = useNetworkState();
  const conInternet = Boolean(red.isConnected) && red.isInternetReachable !== false;
  const usuarioId = usuario?.id;

  useEffect(() => {
    if (!usuarioId || !conInternet) return;
    sincronizarVisitasPendientes(usuarioId).catch(() => {});
    revisarCambiosEnEventosGuardados(usuarioId).catch(() => {});
  }, [usuarioId, conInternet]);
}

/** Cantidad de visitas que todavía no se subieron, actualizada en vivo. */
export function useVisitasPendientes(): number {
  const { usuario } = useSesion();
  const usuarioId = usuario?.id;
  const [pendientes, setPendientes] = useState(0);

  const contar = useCallback(() => {
    if (!usuarioId) {
      setPendientes(0);
      return;
    }
    contarVisitasPendientes(usuarioId)
      .then(setPendientes)
      .catch(() => {});
  }, [usuarioId]);

  // useFocusEffect y no useEffect: la pestaña no se desmonta al cambiar de
  // pantalla, así que un useEffect contaría una sola vez.
  useFocusEffect(contar);
  useEffect(() => alCambiarLasVisitas(contar), [contar]);

  return pendientes;
}
