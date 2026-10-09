import { useEffect } from "react";
import * as Location from "expo-location";
import { useSesion } from "@/hooks/use-sesion";
import { listarLugares } from "@/servicios/lugares";
import { notificarAhora } from "@/servicios/notificaciones";
import { leerRegistroDeAvisos, guardarRegistroDeAvisos } from "@/servicios/preferencias";
import { elegirLugarParaAvisar, registrarAviso } from "@/utils/proximidad";
import { distanciaEnMetros, formatearDistancia } from "@/utils/geo";

/**
 * Aviso de proximidad del PRD: mientras la app está abierta, sigue la
 * posición del turista y avisa cuando pasa cerca de un lugar del catálogo.
 * Funciona solo en primer plano a propósito: avisar con la app cerrada
 * exigiría el permiso de ubicación "siempre", que la teoría desaconseja pedir
 * para un caso así y que es el que más rechazos genera en las tiendas.
 */
export function useAvisoDeProximidad() {
  const { usuario, proximidad } = useSesion();
  const activo = Boolean(usuario) && proximidad.activo;
  const radio = proximidad.radioMetros;

  useEffect(() => {
    if (!activo) return;

    let suscripcion: Location.LocationSubscription | null = null;
    let suelto = false;

    (async () => {
      // Acá no se pide nada: los dos permisos se pidieron al prender el aviso
      // desde el Perfil. Si después el turista los revocó, simplemente no hay
      // avisos.
      const permiso = await Location.getForegroundPermissionsAsync();
      if (!permiso.granted || suelto) return;

      const lugares = await listarLugares().catch(() => []);
      if (lugares.length === 0 || suelto) return;

      const nueva = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 25 },
        (lectura) => {
          const posicion = { latitud: lectura.coords.latitude, longitud: lectura.coords.longitude };
          const ahora = new Date();
          const registro = leerRegistroDeAvisos();
          const lugar = elegirLugarParaAvisar(lugares, posicion, radio, registro, ahora);
          if (!lugar) return;

          guardarRegistroDeAvisos(registrarAviso(registro, lugar.id, ahora));
          notificarAhora({
            titulo: `Estás cerca de ${lugar.nombre}`,
            cuerpo: `A ${formatearDistancia(distanciaEnMetros(posicion, lugar.coordenadas))}. Tocá para ver horarios y cómo llegar.`,
            ruta: `/lugar/${lugar.id}`,
          });
        },
      );

      // Si la pantalla se desmontó mientras se esperaba al GPS, el cleanup
      // ya corrió y no tenía qué soltar: hay que soltarla acá para no dejar
      // el GPS prendido de fondo.
      if (suelto) nueva.remove();
      else suscripcion = nueva;
    })();

    return () => {
      suelto = true;
      suscripcion?.remove();
    };
  }, [activo, radio]);
}

