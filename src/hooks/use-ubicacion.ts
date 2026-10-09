import { useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";
import {
  consultarPermisoDeUbicacion,
  leerPosicion,
  pedirPermisoDeUbicacion,
  ultimaPosicionConocida,
  type EstadoPermisoUbicacion,
  type Posicion,
} from "@/servicios/ubicacion";

export type EstadoUbicacion = "resolviendo" | "sin-preguntar" | "concedida" | "denegada";

function estadoDesde(permiso: EstadoPermisoUbicacion): EstadoUbicacion {
  if (permiso.concedido) return "concedida";
  return permiso.sinPreguntar ? "sin-preguntar" : "denegada";
}

/**
 * Ubicación del turista con las tres ramas del permiso que pide la teoría:
 * mientras se resuelve, sin permiso (todavía sin preguntar o negado) y
 * concedido. Al montarse solo consulta, no muestra el cartel: el pedido lo
 * dispara `pedir`, desde un botón que explica para qué es.
 */
export function useUbicacion() {
  const [estado, setEstado] = useState<EstadoUbicacion>("resolviendo");
  const [posicion, setPosicion] = useState<Posicion | null>(ultimaPosicionConocida());
  const [puedePreguntarDeNuevo, setPuedePreguntarDeNuevo] = useState(true);

  const aplicarPermiso = useCallback((permiso: EstadoPermisoUbicacion) => {
    setEstado(estadoDesde(permiso));
    setPuedePreguntarDeNuevo(permiso.puedePreguntarDeNuevo);
    if (permiso.concedido) leerPosicion(setPosicion);
  }, []);

  useEffect(() => {
    let vigente = true;
    consultarPermisoDeUbicacion()
      .then((permiso) => {
        if (vigente) aplicarPermiso(permiso);
      })
      .catch(() => {
        if (vigente) setEstado("denegada");
      });
    return () => {
      vigente = false;
    };
  }, [aplicarPermiso]);

  const pedir = useCallback(async () => {
    // Con canAskAgain en false el sistema ya no muestra el cartel: la única
    // salida es que el turista lo habilite desde los ajustes del teléfono.
    if (estado === "denegada" && !puedePreguntarDeNuevo) {
      await Linking.openSettings();
      return;
    }
    aplicarPermiso(await pedirPermisoDeUbicacion());
  }, [estado, puedePreguntarDeNuevo, aplicarPermiso]);

  const actualizar = useCallback(() => {
    if (estado === "concedida") leerPosicion(setPosicion);
  }, [estado]);

  return { estado, posicion, puedePreguntarDeNuevo, pedir, actualizar };
}
