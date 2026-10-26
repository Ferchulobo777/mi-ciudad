import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import type { Posicion } from "@/servicios/ubicacion";

// Centro de Colón: encuadre del mapa cuando todavía no hay lugares ni posición.
export const CENTRO_DE_COLON: Posicion = { latitud: -32.2246, longitud: -58.1489 };

/**
 * ¿Se puede dibujar el mapa nativo? En iOS usa Apple Maps y en Expo Go viene
 * la clave de Google de Expo, así que siempre. En un build de Android hace
 * falta la clave propia (GOOGLE_MAPS_API_KEY al compilar, ver app.config.js):
 * sin ella Google Maps cierra la app al abrir el mapa, así que en ese caso se
 * ofrece la lista de lugares en su lugar.
 */
export function hayMapaNativo(): boolean {
  if (Platform.OS !== "android") return true;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return true;
  return Constants.expoConfig?.extra?.mapaNativo === true;
}

/** Del formato de la app (latitud, longitud) al de react-native-maps. */
export function aCoordenada(p: Posicion): { latitude: number; longitude: number } {
  return { latitude: p.latitud, longitude: p.longitud };
}

/**
 * Estilo nocturno para Google Maps (Android). En iOS el modo oscuro lo da
 * Apple Maps con `userInterfaceStyle`.
 */
export const ESTILO_MAPA_OSCURO = [
  { elementType: "geometry", stylers: [{ color: "#1d2c30" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#a9b4b6" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#10181a" }] },
  { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c3f44" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#17262a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e2a33" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#1a2a22" }] },
];
