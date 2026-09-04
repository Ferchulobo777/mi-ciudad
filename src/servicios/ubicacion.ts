import * as Location from "expo-location";

export async function hayPermisoDeUbicacion(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status === "granted") return true;
  const { status: nuevoEstado } = await Location.requestForegroundPermissionsAsync();
  return nuevoEstado === "granted";
}

export interface Posicion {
  latitud: number;
  longitud: number;
}

// Si el usuario niega el permiso, se devuelve null en vez de tirar una
// excepción: la pantalla que llama decide qué mostrar (RNF08, la app tiene
// que seguir siendo usable sin ubicación).
export async function obtenerPosicionActual(): Promise<Posicion | null> {
  const permiso = await hayPermisoDeUbicacion();
  if (!permiso) return null;

  const posicion = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { latitud: posicion.coords.latitude, longitud: posicion.coords.longitude };
}
