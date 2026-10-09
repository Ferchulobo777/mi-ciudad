import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Usuario } from "@/tipos";
import { guardarToken, leerToken, borrarToken } from "@/servicios/sesion-almacenamiento";
import { obtenerUsuarioActual } from "@/servicios/auth";
import {
  leerTema,
  guardarTema,
  leerAvatar,
  guardarAvatar,
  leerPreferenciaProximidad,
  guardarPreferenciaProximidad,
  leerCategoriasFavoritas,
  guardarCategoriasFavoritas,
  type PreferenciaTema,
  type PreferenciaProximidad,
} from "@/servicios/preferencias";

const PROXIMIDAD_APAGADA: PreferenciaProximidad = { activo: false, radioMetros: 250 };

interface EstadoSesion {
  /** En false mientras todavía se está leyendo el token guardado del arranque anterior. */
  estaListo: boolean;
  token: string | null;
  usuario: Usuario | null;
  temaPreferencia: PreferenciaTema;
  proximidad: PreferenciaProximidad;
  /** Ids de las categorías que le interesan al turista (RF04): definen de qué lugares avisa la proximidad. */
  categoriasFavoritas: string[];
  iniciar: (token: string, usuario: Usuario) => Promise<void>;
  cerrar: () => Promise<void>;
  cambiarTema: (tema: PreferenciaTema) => void;
  cambiarProximidad: (preferencia: PreferenciaProximidad) => void;
  cambiarCategoriasFavoritas: (categorias: string[]) => void;
  actualizarAvatar: (uri: string) => void;
}

const ContextoSesion = createContext<EstadoSesion | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [estaListo, setEstaListo] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [temaPreferencia, setTemaPreferencia] = useState<PreferenciaTema>("sistema");
  const [proximidad, setProximidad] = useState<PreferenciaProximidad>(PROXIMIDAD_APAGADA);
  const [categoriasFavoritas, setCategoriasFavoritas] = useState<string[]>([]);

  useEffect(() => {
    // Se busca un token de una sesión anterior antes de decidir a qué grupo de
    // rutas entrar (RF03: la sesión sobrevive al cierre de la aplicación). La
    // lectura es casi instantánea, así que se le suma un mínimo de tiempo
    // para que la presentación con la marca alcance a verse en vez de
    // parpadear.
    const esperaMinima = new Promise((resolver) => setTimeout(resolver, 600));
    Promise.all([leerToken(), esperaMinima]).then(async ([tokenGuardado]) => {
      if (!tokenGuardado) {
        setEstaListo(true);
        return;
      }
      // El token por sí solo no alcanza para saber quién sos: hay que
      // reconstruir el usuario (las pantallas deciden si hay sesión mirando
      // `usuario`, no el token crudo). Si el token ya no corresponde a
      // ningún usuario, se descarta en vez de dejar una sesión a medias.
      const usuarioRecuperado = await obtenerUsuarioActual(tokenGuardado);
      if (usuarioRecuperado) {
        const avatarGuardado = leerAvatar(usuarioRecuperado.id);
        setToken(tokenGuardado);
        setUsuario(avatarGuardado ? { ...usuarioRecuperado, avatarUrl: avatarGuardado } : usuarioRecuperado);
        setTemaPreferencia(leerTema(usuarioRecuperado.id));
        setProximidad(leerPreferenciaProximidad(usuarioRecuperado.id));
        setCategoriasFavoritas(leerCategoriasFavoritas(usuarioRecuperado.id));
      } else {
        await borrarToken();
      }
      setEstaListo(true);
    });
  }, []);

  const iniciar = async (nuevoToken: string, nuevoUsuario: Usuario) => {
    await guardarToken(nuevoToken);
    const avatarGuardado = leerAvatar(nuevoUsuario.id);
    setToken(nuevoToken);
    setUsuario(avatarGuardado ? { ...nuevoUsuario, avatarUrl: avatarGuardado } : nuevoUsuario);
    setTemaPreferencia(leerTema(nuevoUsuario.id));
    setProximidad(leerPreferenciaProximidad(nuevoUsuario.id));
    setCategoriasFavoritas(leerCategoriasFavoritas(nuevoUsuario.id));
  };

  const cerrar = async () => {
    await borrarToken();
    setToken(null);
    setUsuario(null);
    setTemaPreferencia("sistema");
    setProximidad(PROXIMIDAD_APAGADA);
    setCategoriasFavoritas([]);
  };

  const cambiarTema = useCallback(
    (tema: PreferenciaTema) => {
      setTemaPreferencia(tema);
      if (usuario) guardarTema(usuario.id, tema);
    },
    [usuario],
  );

  const cambiarProximidad = useCallback(
    (preferencia: PreferenciaProximidad) => {
      setProximidad(preferencia);
      if (usuario) guardarPreferenciaProximidad(usuario.id, preferencia);
    },
    [usuario],
  );

  const cambiarCategoriasFavoritas = useCallback(
    (categorias: string[]) => {
      setCategoriasFavoritas(categorias);
      if (usuario) guardarCategoriasFavoritas(usuario.id, categorias);
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
    () => ({
      estaListo,
      token,
      usuario,
      temaPreferencia,
      proximidad,
      categoriasFavoritas,
      iniciar,
      cerrar,
      cambiarTema,
      cambiarProximidad,
      cambiarCategoriasFavoritas,
      actualizarAvatar,
    }),
    [
      estaListo,
      token,
      usuario,
      temaPreferencia,
      proximidad,
      categoriasFavoritas,
      cambiarTema,
      cambiarProximidad,
      cambiarCategoriasFavoritas,
      actualizarAvatar,
    ],
  );

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

export function useSesion(): EstadoSesion {
  const contexto = useContext(ContextoSesion);
  if (!contexto) throw new Error("useSesion se tiene que usar dentro de SesionProvider.");
  return contexto;
}
