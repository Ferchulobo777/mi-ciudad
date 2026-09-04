import { Storage } from "expo-sqlite/kv-store";

// kv-store es la variante liviana de expo-sqlite pensada justo para esto: una
// preferencia chica por clave, sin necesitar una tabla ni una migración
// propia. Queda separada de la tabla de favoritos, que sí tiene forma de fila.
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
