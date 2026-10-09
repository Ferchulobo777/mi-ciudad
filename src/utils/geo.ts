import type { Coordenadas } from "@/tipos";

const RADIO_TIERRA_METROS = 6371000;

function aRadianes(grados: number): number {
  return (grados * Math.PI) / 180;
}

function aGrados(radianes: number): number {
  return (radianes * 180) / Math.PI;
}

// Fórmula de haversine. Recibe las dos posiciones como parámetro en vez de
// leer el GPS acá adentro, así sirve igual con la posición real del turista
// que con la de respaldo cuando no dio permiso de ubicación.
export function distanciaEnMetros(a: Coordenadas, b: Coordenadas): number {
  const dLat = aRadianes(b.latitud - a.latitud);
  const dLon = aRadianes(b.longitud - a.longitud);
  const factor =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(a.latitud)) * Math.cos(aRadianes(b.latitud)) * Math.sin(dLon / 2) ** 2;
  return RADIO_TIERRA_METROS * 2 * Math.atan2(Math.sqrt(factor), Math.sqrt(1 - factor));
}

// Coma decimal, como se escribe en Argentina ("1,1 km"), igual que en los
// mockups del documento de diseño.
export function formatearDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros / 10) * 10} m`;
  return `${(metros / 1000).toFixed(1).replace(".", ",")} km`;
}

/**
 * Rumbo inicial desde `origen` hacia `destino`, en grados de 0 a 360 medidos
 * en sentido horario desde el norte (0 = norte, 90 = este).
 */
export function rumboEnGrados(origen: Coordenadas, destino: Coordenadas): number {
  const lat1 = aRadianes(origen.latitud);
  const lat2 = aRadianes(destino.latitud);
  const dLon = aRadianes(destino.longitud - origen.longitud);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (aGrados(Math.atan2(y, x)) + 360) % 360;
}

const PUNTOS_CARDINALES = ["norte", "noreste", "este", "sureste", "sur", "suroeste", "oeste", "noroeste"];

// Ocho sectores de 45° centrados en cada punto: el norte va de 337,5° a 22,5°.
export function puntoCardinal(grados: number): string {
  const normalizado = ((grados % 360) + 360) % 360;
  return PUNTOS_CARDINALES[Math.round(normalizado / 45) % 8];
}

export function ordenarPorDistancia<T extends { coordenadas: Coordenadas }>(elementos: T[], desde: Coordenadas): T[] {
  return [...elementos].sort((a, b) => distanciaEnMetros(desde, a.coordenadas) - distanciaEnMetros(desde, b.coordenadas));
}
