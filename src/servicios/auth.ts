import type { RespuestaSesion, Usuario } from "@/tipos";
import { usuariosSimulados } from "@/mocks/usuarios";

// Códigos alineados con la convención de error de la cátedra: { error: { codigo, mensaje } }.
export type CodigoErrorAuth = "CREDENCIALES_INVALIDAS" | "EMAIL_YA_REGISTRADO";

export class ErrorDeAutenticacion extends Error {
  codigo: CodigoErrorAuth;
  constructor(codigo: CodigoErrorAuth, mensaje: string) {
    super(mensaje);
    this.codigo = codigo;
  }
}

// Los servicios son asincrónicos desde el día uno, aunque el dato simulado
// responda al instante: así el reemplazo por la llamada real a la API, cuando
// exista, no obliga a tocar ninguna pantalla que ya consuma este servicio.
function simularLatenciaDeRed<T>(valor: T, ms = 500): Promise<T> {
  return new Promise((resolver) => setTimeout(() => resolver(valor), ms));
}

function generarTokenSimulado(usuarioId: string): string {
  return `token-simulado.${usuarioId}.${Date.now()}`;
}

export async function iniciarSesion(email: string, contrasena: string): Promise<RespuestaSesion> {
  await simularLatenciaDeRed(null);
  const emailNormalizado = email.trim().toLowerCase();
  const encontrado = usuariosSimulados.find((u) => u.usuario.email.toLowerCase() === emailNormalizado);

  if (!encontrado || encontrado.contrasena !== contrasena) {
    throw new ErrorDeAutenticacion("CREDENCIALES_INVALIDAS", "El correo o la contraseña no coinciden.");
  }

  return { token: generarTokenSimulado(encontrado.usuario.id), usuario: encontrado.usuario };
}

export async function reingresarConBiometria(email: string): Promise<RespuestaSesion> {
  // La huella o el rostro ya confirmaron la identidad del lado del sistema
  // operativo; acá solo falta reconstruir la sesión. Contra la API real esto
  // canjearía un refresh token guardado en vez de volver a buscar por email,
  // pero el contrato todavía no define ese endpoint (ver openapi.yaml), así que
  // por ahora se simula devolviendo la sesión del mismo usuario de prueba.
  await simularLatenciaDeRed(null);
  const emailNormalizado = email.trim().toLowerCase();
  const encontrado = usuariosSimulados.find((u) => u.usuario.email.toLowerCase() === emailNormalizado);

  if (!encontrado) {
    throw new ErrorDeAutenticacion("CREDENCIALES_INVALIDAS", "No se encontró una cuenta para reingresar.");
  }

  return { token: generarTokenSimulado(encontrado.usuario.id), usuario: encontrado.usuario };
}

// Reconstruye el usuario a partir de un token guardado del arranque anterior
// (RF03: la sesión sobrevive a cerrar la app). El token simulado lleva el id
// del usuario adentro; contra la API real esto sería un GET /me que devuelve
// el usuario dueño del token, sin necesitar volver a pedir el email.
export async function obtenerUsuarioActual(token: string): Promise<Usuario | null> {
  await simularLatenciaDeRed(null);
  const [, usuarioId] = token.split(".");
  return usuariosSimulados.find((u) => u.usuario.id === usuarioId)?.usuario ?? null;
}

export async function registrarCuenta(nombre: string, email: string, contrasena: string): Promise<RespuestaSesion> {
  await simularLatenciaDeRed(null);
  const emailNormalizado = email.trim().toLowerCase();

  if (usuariosSimulados.some((u) => u.usuario.email.toLowerCase() === emailNormalizado)) {
    throw new ErrorDeAutenticacion("EMAIL_YA_REGISTRADO", "Ya existe una cuenta con ese correo.");
  }

  const nuevoUsuario = {
    contrasena,
    usuario: {
      id: `u${usuariosSimulados.length + 1}`,
      nombre: nombre.trim(),
      email: emailNormalizado,
      avatarUrl: null,
      creadoEn: new Date().toISOString(),
      preferencias: {
        categoriasFavoritas: [],
        avisarProximidad: true,
        radioAvisoMetros: 250 as const,
        tema: "sistema" as const,
      },
    },
  };
  usuariosSimulados.push(nuevoUsuario);

  return { token: generarTokenSimulado(nuevoUsuario.usuario.id), usuario: nuevoUsuario.usuario };
}
