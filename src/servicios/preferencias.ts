import { Storage } from "expo-sqlite/kv-store";
import type { Preferencias, Usuario } from "@/tipos";
import { registroVacio, type RegistroDeAvisos } from "@/utils/proximidad";

// kv-store es la variante liviana de expo-sqlite pensada justo para esto: una
// preferencia chica por clave, sin necesitar una tabla ni una migración
// propia. Nunca se guarda acá el token de sesión: ese va en expo-secure-store.
export type PreferenciaTema = "claro" | "oscuro" | "sistema";

function claveTema(usuarioId: string): string {
  return `tema:${usuarioId}`;
}

export function leerTema(usuarioId: string): PreferenciaTema {
  const valor = Storage.getItemSync(claveTema(usuarioId));
  return valor === "claro" || valor === "oscuro" ? valor : "sistema";
}

export function guardarTema(usuarioId: string, tema: PreferenciaTema): void {
  Storage.setItemSync(claveTema(usuarioId), tema);
}

function claveAvatar(usuarioId: string): string {
  return `avatar:${usuarioId}`;
}

export function leerAvatar(usuarioId: string): string | null {
  return Storage.getItemSync(claveAvatar(usuarioId));
}

export function guardarAvatar(usuarioId: string, uri: string): void {
  Storage.setItemSync(claveAvatar(usuarioId), uri);
}

export type RadioAviso = Preferencias["radioAvisoMetros"];

export interface PreferenciaProximidad {
  activo: boolean;
  radioMetros: RadioAviso;
}

function claveProximidad(usuarioId: string): string {
  return `proximidad:${usuarioId}`;
}

// Arranca apagado aunque la cuenta lo tenga activado: prenderlo
// implica pedir dos permisos (ubicación y notificaciones), y eso tiene que
// pasar por un gesto del turista en Mi perfil, no de manera implícita.
export function leerPreferenciaProximidad(usuarioId: string): PreferenciaProximidad {
  const valor = Storage.getItemSync(claveProximidad(usuarioId));
  if (!valor) return { activo: false, radioMetros: 250 };
  try {
    const guardado = JSON.parse(valor) as PreferenciaProximidad;
    return { activo: Boolean(guardado.activo), radioMetros: guardado.radioMetros ?? 250 };
  } catch {
    return { activo: false, radioMetros: 250 };
  }
}

export function guardarPreferenciaProximidad(usuarioId: string, preferencia: PreferenciaProximidad): void {
  Storage.setItemSync(claveProximidad(usuarioId), JSON.stringify(preferencia));
}

function claveCategoriasFavoritas(usuarioId: string): string {
  return `categorias-favoritas:${usuarioId}`;
}

export function leerCategoriasFavoritas(usuarioId: string): string[] {
  const valor = Storage.getItemSync(claveCategoriasFavoritas(usuarioId));
  if (!valor) return [];
  try {
    const guardado: unknown = JSON.parse(valor);
    return Array.isArray(guardado) ? guardado.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function guardarCategoriasFavoritas(usuarioId: string, categorias: string[]): void {
  Storage.setItemSync(claveCategoriasFavoritas(usuarioId), JSON.stringify(categorias));
}

// Última copia del usuario que devolvió la API. Sirve para arrancar la app sin
// señal con la sesión guardada: sin esto, GET /yo fallaría y la app parecería
// haber cerrado la sesión justo donde más se la necesita (El Palmar).
const CLAVE_USUARIO = "sesion:usuario";

export function guardarUsuarioEnCache(usuario: Usuario): void {
  Storage.setItemSync(CLAVE_USUARIO, JSON.stringify(usuario));
}

export function leerUsuarioEnCache(): Usuario | null {
  const valor = Storage.getItemSync(CLAVE_USUARIO);
  if (!valor) return null;
  try {
    return JSON.parse(valor) as Usuario;
  } catch {
    return null;
  }
}

export function borrarUsuarioEnCache(): void {
  Storage.removeItemSync(CLAVE_USUARIO);
}

const CLAVE_REGISTRO_AVISOS = "proximidad:registro";

export function leerRegistroDeAvisos(): RegistroDeAvisos {
  const valor = Storage.getItemSync(CLAVE_REGISTRO_AVISOS);
  if (!valor) return registroVacio(new Date());
  try {
    return JSON.parse(valor) as RegistroDeAvisos;
  } catch {
    return registroVacio(new Date());
  }
}

export function guardarRegistroDeAvisos(registro: RegistroDeAvisos): void {
  Storage.setItemSync(CLAVE_REGISTRO_AVISOS, JSON.stringify(registro));
}
