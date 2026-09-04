import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Usuario } from "@/tipos";
import { guardarToken, leerToken, borrarToken } from "@/servicios/sesion-almacenamiento";
import { leerTema, guardarTema, leerAvatar, guardarAvatar, type PreferenciaTema } from "@/servicios/preferencias";

interface EstadoSesion {
  /** En false mientras todavía se está leyendo el token guardado del arranque anterior. */
  estaListo: boolean;
  token: string | null;
  usuario: Usuario | null;
  temaPreferencia: PreferenciaTema;
  iniciar: (token: string, usuario: Usuario) => Promise<void>;
  cerrar: () => Promise<void>;
  cambiarTema: (tema: PreferenciaTema) => void;
  actualizarAvatar: (uri: string) => void;
}

const ContextoSesion = createContext<EstadoSesion | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [estaListo, setEstaListo] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [temaPreferencia, setTemaPreferencia] = useState<PreferenciaTema>("sistema");

  useEffect(() => {
    // Se busca un token de una sesión anterior antes de decidir a qué grupo de
    // rutas entrar (RF03: la sesión sobrevive al cierre de la aplicación).
    leerToken().then((tokenGuardado) => {
      setToken(tokenGuardado);
      setEstaListo(true);
    });
  }, []);

  const iniciar = async (nuevoToken: string, nuevoUsuario: Usuario) => {
    await guardarToken(nuevoToken);
    const avatarGuardado = leerAvatar(nuevoUsuario.id);
    setToken(nuevoToken);
    setUsuario(avatarGuardado ? { ...nuevoUsuario, avatarUrl: avatarGuardado } : nuevoUsuario);
    setTemaPreferencia(leerTema(nuevoUsuario.id));
  };

  const cerrar = async () => {
    await borrarToken();
    setToken(null);
    setUsuario(null);
    setTemaPreferencia("sistema");
  };

  const cambiarTema = useCallback(
    (tema: PreferenciaTema) => {
      setTemaPreferencia(tema);
      if (usuario) guardarTema(usuario.id, tema);
    },
    [usuario],
  );

  const actualizarAvatar = useCallback(
    (uri: string) => {
      if (!usuario) return;
      guardarAvatar(usuario.id, uri);
      setUsuario({ ...usuario, avatarUrl: uri });
    },
    [usuario],
  );

  const valor = useMemo(
    () => ({ estaListo, token, usuario, temaPreferencia, iniciar, cerrar, cambiarTema, actualizarAvatar }),
    [estaListo, token, usuario, temaPreferencia, cambiarTema, actualizarAvatar],
  );

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

export function useSesion(): EstadoSesion {
  const contexto = useContext(ContextoSesion);
  if (!contexto) throw new Error("useSesion se tiene que usar dentro de SesionProvider.");
  return contexto;
}
