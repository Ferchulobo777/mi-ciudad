import { Storage } from "expo-sqlite/kv-store";
import type { Preferencias } from "@/tipos";
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

// Arranca apagado aunque el usuario simulado lo tenga en true: prenderlo
// implica pedir dos permisos (ubicación y notificaciones), y eso tiene que
// pasar por un gesto del turista en el Perfil, no de manera implícita.
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
