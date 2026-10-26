import * as Network from "expo-network";

// Forma de respuesta que fija la cátedra para su API: { datos, meta } en el
// éxito y { error: { codigo, mensaje } } en el error. Este módulo es el único
// que conoce ese "sobre"; los servicios reciben directamente los datos.
export interface RespuestaLista<T> {
  datos: T[];
  meta: { total: number; pagina: number; porPagina: number };
}

export class ErrorDeApi extends Error {
  readonly codigo: string;
  readonly estadoHttp: number | null;

  constructor(codigo: string, mensaje: string, estadoHttp: number | null = null) {
    super(mensaje);
    this.codigo = codigo;
    this.estadoHttp = estadoHttp;
  }
}

// La dirección sale de una variable EXPO_PUBLIC_ (se fija al compilar) y no
// queda escrita en el código: en desarrollo apunta a la IP de la notebook en
// la red wifi, y en el APK a la API publicada con https, porque una app
// instalada no puede depender de la computadora de nadie.
export const URL_BASE_API = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/+$/, "");

// El plan gratuito de Render duerme el servicio y la primera llamada puede
// tardar cerca de un minuto en despertarlo; con menos margen la app daría por
// caída una API que solo estaba arrancando.
const TIEMPO_MAXIMO_MS = 60_000;

let tokenDeSesion: string | null = null;

/**
 * La sesión vive en el contexto de React, pero los servicios no son
 * componentes y no pueden leerlo. Por eso el contexto le avisa a este módulo
 * cada vez que el token cambia, y todos los pedidos que necesitan cuenta lo
 * toman de acá.
 */
export function establecerTokenDeApi(token: string | null): void {
  tokenDeSesion = token;
}

export function hayTokenDeApi(): boolean {
  return tokenDeSesion !== null;
}

export async function hayInternet(): Promise<boolean> {
  try {
    const estado = await Network.getNetworkStateAsync();
    return Boolean(estado.isConnected) && estado.isInternetReachable !== false;
  } catch {
    // Si ni siquiera se puede consultar el estado de la red, se asume que
    // hay: el pedido real va a fallar por su cuenta si no es así.
    return true;
  }
}

type Metodo = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface OpcionesPedido {
  metodo?: Metodo;
  cuerpo?: unknown;
  /** Para validar un token que todavía no es el de la sesión activa (el guardado del arranque anterior). */
  token?: string | null;
}

async function ejecutar(ruta: string, init: RequestInit): Promise<Response> {
  if (!(await hayInternet())) {
    throw new ErrorDeApi("SIN_CONEXION", "No hay conexión a internet.");
  }
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS);
  try {
    return await fetch(`${URL_BASE_API}${ruta}`, { ...init, signal: controlador.signal });
  } catch {
    // fetch solo rechaza cuando no hubo respuesta (sin red, servidor apagado,
    // IP equivocada o tiempo agotado). Para la pantalla es el mismo caso: no
    // se pudo hablar con el servidor, y la caché local puede cubrirlo.
    throw new ErrorDeApi("SIN_CONEXION", "No pudimos conectarnos con el servidor. Probá de nuevo en un rato.");
  } finally {
    clearTimeout(temporizador);
  }
}

async function desenvolver<T>(respuesta: Response): Promise<T> {
  if (respuesta.status === 204) return undefined as T;

  const cuerpo = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const error = cuerpo?.error;
    throw new ErrorDeApi(
      error?.codigo ?? "ERROR_INTERNO",
      error?.mensaje ?? "Algo salió mal de nuestro lado. Probá de nuevo en un rato.",
      respuesta.status,
    );
  }
  return cuerpo?.datos as T;
}

function cabeceras(token: string | null | undefined, conCuerpoJson: boolean): Record<string, string> {
  const resultado: Record<string, string> = { Accept: "application/json" };
  if (conCuerpoJson) resultado["Content-Type"] = "application/json";
  const tokenAUsar = token === undefined ? tokenDeSesion : token;
  if (tokenAUsar) resultado.Authorization = `Bearer ${tokenAUsar}`;
  return resultado;
}

/** Hace un pedido JSON a la API y devuelve solo `datos`, ya sin el sobre. */
export async function pedirApi<T>(ruta: string, opciones: OpcionesPedido = {}): Promise<T> {
  const { metodo = "GET", cuerpo, token } = opciones;
  const respuesta = await ejecutar(ruta, {
    method: metodo,
    headers: cabeceras(token, cuerpo !== undefined),
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  return desenvolver<T>(respuesta);
}

export interface ArchivoSubido {
  url: string;
  tipo: "imagen" | "audio" | "video";
  bytes: number;
}

/**
 * Sube una foto del teléfono con POST /archivos. La API no acepta un
 * file:// (esa ruta solo existe dentro del teléfono): primero se sube el
 * archivo y después se usa la url que devuelve.
 */
export async function subirArchivo(uriLocal: string): Promise<ArchivoSubido> {
  const nombre = uriLocal.split("/").pop() ?? "foto.jpg";
  const extension = nombre.split(".").pop()?.toLowerCase();
  const tipo = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";

  const formulario = new FormData();
  // React Native arma la parte multipart a partir de este objeto { uri, name,
  // type }; no hace falta leer el archivo a memoria.
  formulario.append("archivo", { uri: uriLocal, name: nombre, type: tipo } as unknown as Blob);

  // Sin Content-Type a mano: fetch lo completa con el boundary del multipart.
  const respuesta = await ejecutar("/archivos", {
    method: "POST",
    headers: cabeceras(undefined, false),
    body: formulario,
  });
  return desenvolver<ArchivoSubido>(respuesta);
}
