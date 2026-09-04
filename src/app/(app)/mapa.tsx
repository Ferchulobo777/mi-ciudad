import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { router } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { Categoria, Lugar } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { useSesion } from "@/hooks/use-sesion";
import { listarCategorias, listarLugares } from "@/servicios/lugares";
import { obtenerPosicionActual, type Posicion } from "@/servicios/ubicacion";
import { construirHtmlMapa } from "@/utils/mapa-html";

interface MensajeDelMapa {
  tipo: "ver-lugar";
  id: string;
}

export default function Mapa() {
  const tema = useTema();
  const esquemaDelSistema = useColorScheme();
  const { temaPreferencia } = useSesion();
  const esOscuro =
    temaPreferencia === "oscuro" || (temaPreferencia === "sistema" && esquemaDelSistema === "dark");
  const webviewRef = useRef<WebView>(null);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [posicion, setPosicion] = useState<Posicion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([listarLugares(), listarCategorias(), obtenerPosicionActual()]).then(
      ([lugaresCargados, categoriasCargadas, posicionInicial]) => {
        setLugares(lugaresCargados);
        setCategorias(categoriasCargadas);
        setPosicion(posicionInicial);
        setCargando(false);
      },
    );
  }, []);

  const categoriaPorId = useMemo(() => new Map(categorias.map((c) => [c.id, c])), [categorias]);

  // El HTML se genera una sola vez con los datos iniciales: actualizar la
  // posición del turista después no debería recargar todo el mapa (se pierde
  // el zoom/paneo en curso), así que eso se resuelve mandando un mensaje al
  // WebView en vez de regenerar el `source`.
  const htmlInicial = useMemo(
    () =>
      construirHtmlMapa({
        lugares,
        categoriaPorId,
        posicion,
        colorPrimario: tema.primario,
        esOscuro,
      }),
    [lugares, categoriaPorId, esOscuro], // eslint-disable-line react-hooks/exhaustive-deps
  );

  function manejarMensaje(evento: { nativeEvent: { data: string } }) {
    try {
      const mensaje = JSON.parse(evento.nativeEvent.data) as MensajeDelMapa;
      if (mensaje.tipo === "ver-lugar") {
        router.push({ pathname: "/lugar/[id]", params: { id: mensaje.id } });
      }
    } catch {
      // Se ignoran mensajes que no tengan el formato esperado.
    }
  }

  function centrarEnMiUbicacion() {
    obtenerPosicionActual().then((real) => {
      if (!real) return;
      setPosicion(real);
      webviewRef.current?.postMessage(JSON.stringify({ tipo: "centrar", lat: real.latitud, lon: real.longitud }));
    });
  }

  return (
    <View style={styles.contenedor}>
      {!cargando && (
        <WebView
          ref={webviewRef}
          originWhitelist={["*"]}
          source={{ html: htmlInicial }}
          onMessage={manejarMensaje}
          style={styles.webview}
        />
      )}

      <SafeAreaView style={styles.capaSuperior} pointerEvents="box-none" edges={["top"]}>
        <Text style={[styles.titulo, { color: tema.textoPrincipal, backgroundColor: tema.superficie }]}>Mapa</Text>
      </SafeAreaView>

      <Pressable
        onPress={centrarEnMiUbicacion}
        accessibilityRole="button"
        accessibilityLabel="Centrar en mi ubicación"
        style={[styles.botonUbicacion, { backgroundColor: tema.superficie }]}
      >
        <Ionicons name="locate" size={22} color={tema.primario} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  webview: { flex: 1 },
  capaSuperior: { position: "absolute", top: 0, left: 0, right: 0 },
  titulo: {
    marginTop: 8,
    marginHorizontal: 20,
    alignSelf: "flex-start",
    fontSize: 16,
    fontWeight: "800",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  botonUbicacion: {
    position: "absolute",
    right: 20,
    bottom: 28,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});
