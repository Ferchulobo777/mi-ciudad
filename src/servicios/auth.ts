import type { Preferencias, RespuestaSesion, Usuario } from "@/tipos";
import { ErrorDeApi, pedirApi } from "./api";
import { leerTokenParaBiometria } from "./sesion-almacenamiento";

// El código es el que manda la API (CREDENCIALES_INVALIDAS,
// EMAIL_YA_REGISTRADO, SIN_CONEXION...) y el mensaje está pensado para
// mostrarse tal cual, así que las pantallas no necesitan traducir nada.
export class ErrorDeAutenticacion extends Error {
  codigo: string;
  constructor(codigo: string, mensaje: string) {
    super(mensaje);
    this.codigo = codigo;
  }
}

function comoErrorDeAutenticacion(error: unknown): never {
  if (error instanceof ErrorDeApi) throw new ErrorDeAutenticacion(error.codigo, error.message);
  throw error;
}

export async function iniciarSesion(email: string, contrasena: string): Promise<RespuestaSesion> {
  try {
    return await pedirApi<RespuestaSesion>("/auth/ingreso", {
      metodo: "POST",
      cuerpo: { email: email.trim().toLowerCase(), contrasena },
      token: null,
    });
  } catch (error) {
    return comoErrorDeAutenticacion(error);
  }
}

export async function registrarCuenta(nombre: string, email: string, contrasena: string): Promise<RespuestaSesion> {
  try {
    return await pedirApi<RespuestaSesion>("/auth/registro", {
      metodo: "POST",
      cuerpo: { nombre: nombre.trim(), email: email.trim().toLowerCase(), contrasena },
      token: null,
    });
  } catch (error) {
    return comoErrorDeAutenticacion(error);
  }
}

/**
 * Reconstruye el usuario dueño de un token guardado (RF03: la sesión
 * sobrevive a cerrar la app). Devuelve null solo cuando la API dice que el
 * token ya no sirve (401: venció o es inválido); sin conexión el error sube,
 * para que quien llama no confunda "no hay señal" con "la sesión terminó".
 */
export async function obtenerUsuarioActual(token: string): Promise<Usuario | null> {
  try {
    return await pedirApi<Usuario>("/yo", { token });
  } catch (error) {
    if (error instanceof ErrorDeApi && error.estadoHttp === 401) return null;
    throw error;
  }
}

/**
 * La huella o el rostro ya confirmaron la identidad del lado del sistema
 * operativo; falta una credencial para la API. La API no tiene refresh token,
 * así que se reutiliza el último token emitido (dura 30 días), guardado en
 * expo-secure-store y que solo se libera después de la biometría. Si venció,
 * hay que volver a ingresar con contraseña.
 */
export async function reingresarConBiometria(email: string): Promise<RespuestaSesion> {
  const token = await leerTokenParaBiometria();
  if (!token) {
    throw new ErrorDeAutenticacion("CREDENCIALES_INVALIDAS", "No se encontró una cuenta para reingresar.");
  }

  const usuario = await obtenerUsuarioActual(token);
  if (!usuario || usuario.email.toLowerCase() !== email.trim().toLowerCase()) {
    throw new ErrorDeAutenticacion("CREDENCIALES_INVALIDAS", "Tu sesión venció. Ingresá con tu contraseña.");
  }
  return { token, usuario };
}

/**
 * PATCH /yo mezcla las preferencias campo a campo, así que alcanza con mandar
 * la que cambió. Las preferencias se guardan primero en el teléfono; esto solo
 * las copia a la cuenta y no bloquea a la pantalla si no hay señal.
 */
export async function actualizarPreferenciasEnCuenta(cambios: Partial<Preferencias>): Promise<void> {
  try {
    await pedirApi<Usuario>("/yo", { metodo: "PATCH", cuerpo: { preferencias: cambios } });
  } catch {
    // Quedan guardadas localmente; la próxima modificación con señal las vuelve a mandar.
  }
}
