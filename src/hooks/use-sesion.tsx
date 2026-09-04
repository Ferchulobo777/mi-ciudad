import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Usuario } from "@/tipos";
import { guardarToken, leerToken, borrarToken } from "@/servicios/sesion-almacenamiento";

interface EstadoSesion {
  /** En false mientras todavía se está leyendo el token guardado del arranque anterior. */
  estaListo: boolean;
  token: string | null;
  usuario: Usuario | null;
  iniciar: (token: string, usuario: Usuario) => Promise<void>;
  cerrar: () => Promise<void>;
}

const ContextoSesion = createContext<EstadoSesion | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [estaListo, setEstaListo] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

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
    setToken(nuevoToken);
    setUsuario(nuevoUsuario);
  };

  const cerrar = async () => {
    await borrarToken();
    setToken(null);
    setUsuario(null);
  };

  const valor = useMemo(
    () => ({ estaListo, token, usuario, iniciar, cerrar }),
    [estaListo, token, usuario],
  );

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

export function useSesion(): EstadoSesion {
  const contexto = useContext(ContextoSesion);
  if (!contexto) throw new Error("useSesion se tiene que usar dentro de SesionProvider.");
  return contexto;
}
