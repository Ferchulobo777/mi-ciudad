import { useEffect } from "react";
import * as Location from "expo-location";
import { useSesion } from "@/hooks/use-sesion";
import { listarLugares } from "@/servicios/lugares";
import { notificarAhora } from "@/servicios/notificaciones";
import { listarFavoritos } from "@/servicios/favoritos";
import { leerRegistroDeAvisos, guardarRegistroDeAvisos } from "@/servicios/preferencias";
import { elegirLugarParaAvisar, lugaresDeInteres, registrarAviso } from "@/utils/proximidad";
import { distanciaEnMetros, formatearDistancia } from "@/utils/geo";

/**
 * Aviso de proximidad del PRD: mientras la app está abierta, sigue la
 * posición del turista y avisa cuando pasa cerca de uno de sus lugares
 * favoritos o de un lugar de sus categorías favoritas.
 * Funciona solo en primer plano a propósito: avisar con la app cerrada
 * exigiría el permiso de ubicación "siempre", que la teoría desaconseja pedir
 * para un caso así y que es el que más rechazos genera en las tiendas.
 */
export function useAvisoDeProximidad() {
  const { usuario, proximidad, categoriasFavoritas } = useSesion();
  const usuarioId = usuario?.id;
  const activo = Boolean(usuarioId) && proximidad.activo;
  const radio = proximidad.radioMetros;

  useEffect(() => {
    if (!activo) return;

    let suscripcion: Location.LocationSubscription | null = null;
    let suelto = false;

    (async () => {
      // Acá no se pide nada: los dos permisos se pidieron al prender el aviso
      // desde Mi perfil. Si después el turista los revocó, simplemente no hay
      // avisos.
      const permiso = await Location.getForegroundPermissionsAsync();
      if (!permiso.granted || suelto) return;

      const lugares = await listarLugares().catch(() => []);
      if (lugares.length === 0 || suelto || !usuarioId) return;

      const nueva = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 25 },
        async (lectura) => {
          const posicion = { latitud: lectura.coords.latitude, longitud: lectura.coords.longitude };
          // Los favoritos se leen en cada lectura y no una sola vez al
          // empezar: si el turista marca un lugar mientras camina, ese lugar
          // tiene que empezar a avisar sin reiniciar la app.
          const idsFavoritos = (await listarFavoritos(usuarioId).catch(() => [])).map((f) => f.lugarId);
          const candidatos = lugaresDeInteres(lugares, idsFavoritos, categoriasFavoritas);
          const ahora = new Date();
          const registro = leerRegistroDeAvisos();
          const lugar = elegirLugarParaAvisar(candidatos, posicion, radio, registro, ahora);
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
  }, [activo, radio, usuarioId, categoriasFavoritas]);
}

