import * as Location from "expo-location";

export interface Posicion {
  latitud: number;
  longitud: number;
}

export interface EstadoPermisoUbicacion {
  concedido: boolean;
  /** false cuando el turista ya lo negó y el sistema no vuelve a mostrar el cartel. */
  puedePreguntarDeNuevo: boolean;
  /** true mientras nunca se preguntó (estado "undetermined"). */
  sinPreguntar: boolean;
}

function aEstado(respuesta: Location.LocationPermissionResponse): EstadoPermisoUbicacion {
  return {
    concedido: respuesta.granted,
    puedePreguntarDeNuevo: respuesta.canAskAgain,
    sinPreguntar: respuesta.status === Location.PermissionStatus.UNDETERMINED,
  };
}

/** Consulta sin molestar: no muestra ningún cartel. */
export async function consultarPermisoDeUbicacion(): Promise<EstadoPermisoUbicacion> {
  return aEstado(await Location.getForegroundPermissionsAsync());
}

/** Muestra el cartel del sistema. Solo "mientras uso la app": la de segundo plano no hace falta. */
export async function pedirPermisoDeUbicacion(): Promise<EstadoPermisoUbicacion> {
  return aEstado(await Location.requestForegroundPermissionsAsync());
}

function aPosicion(objeto: Location.LocationObject): Posicion {
  return { latitud: objeto.coords.latitude, longitud: objeto.coords.longitude };
}

// Última posición leída en cualquier pantalla: así el Detalle o el Mapa
// arrancan con un valor útil en vez de esperar de nuevo al GPS.
let ultimaPosicion: Posicion | null = null;

export function ultimaPosicionConocida(): Posicion | null {
  return ultimaPosicion;
}

/**
 * El doble pedido que propone la teoría: primero la última posición conocida
 * (instantánea, puede estar un poco vieja) y después la lectura precisa. La
 * pantalla recibe las dos por `alRecibir`, así muestra algo enseguida y lo
 * corrige cuando llega la buena.
 */
export async function leerPosicion(alRecibir: (posicion: Posicion) => void): Promise<void> {
  try {
    const rapida = await Location.getLastKnownPositionAsync();
    if (rapida) {
      ultimaPosicion = aPosicion(rapida);
      alRecibir(ultimaPosicion);
    }
    const precisa = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    ultimaPosicion = aPosicion(precisa);
    alRecibir(ultimaPosicion);
  } catch {
    // GPS apagado desde el sistema o sin señal satelital: la pantalla sigue con la
    // posición que ya tenía (o con la de respaldo).
  }
}

/**
 * Para "Por cercanía" en Registrar visita: el turista acaba de tocar esa
 * opción, así que es el momento justo para pedir el permiso si falta. Si lo
 * niega, devuelve null y la pantalla ofrece las otras dos formas de registro.
 */
export async function obtenerPosicionActual(): Promise<Posicion | null> {
  const estado = await consultarPermisoDeUbicacion();
  if (!estado.concedido && !(await pedirPermisoDeUbicacion()).concedido) return null;
  try {
    const posicion = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    ultimaPosicion = aPosicion(posicion);
    return ultimaPosicion;
  } catch {
    return null;
  }
}
