import type { Posicion } from "@/servicios/ubicacion";

// OSRM (Open Source Routing Machine) tiene un servidor de demostración público
// y gratuito, sin API key ni cuenta de facturación: mismo criterio que los
// tiles de OpenStreetMap del mapa. Al ser un servidor de la comunidad pensado
// para pruebas, no hay garantía de disponibilidad — por eso cualquier falla
// se traduce en `null` en vez de una excepción, y la pantalla sigue mostrando
// el mapa sin la línea de ruta en ese caso.
const URL_BASE_OSRM = "https://router.project-osrm.org/route/v1/foot";

export interface RutaCalculada {
  puntos: Posicion[];
  distanciaMetros: number;
  duracionSegundos: number;
}

interface RespuestaOsrm {
  routes?: {
    distance: number;
    duration: number;
    geometry: { coordinates: [number, number][] };
  }[];
}

export async function calcularRuta(origen: Posicion, destino: Posicion): Promise<RutaCalculada | null> {
  try {
    const coordenadas = `${origen.longitud},${origen.latitud};${destino.longitud},${destino.latitud}`;
    const respuesta = await fetch(`${URL_BASE_OSRM}/${coordenadas}?overview=full&geometries=geojson`);
    if (!respuesta.ok) return null;

    const datos = (await respuesta.json()) as RespuestaOsrm;
    const ruta = datos.routes?.[0];
    if (!ruta) return null;

    return {
      // OSRM devuelve [longitud, latitud] por punto, al revés de como se
      // maneja el resto de la app.
      puntos: ruta.geometry.coordinates.map(([longitud, latitud]) => ({ latitud, longitud })),
      distanciaMetros: ruta.distance,
      duracionSegundos: ruta.duration,
    };
  } catch {
    return null;
  }
}
