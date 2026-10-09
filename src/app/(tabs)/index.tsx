import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { router } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { Lugar } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { useSesion } from "@/hooks/use-sesion";
import { useCategorias } from "@/hooks/use-categorias";
import { useUbicacion } from "@/hooks/use-ubicacion";
import { useVisitasPendientes } from "@/hooks/use-sincronizacion";
import { useHayConexion } from "@/hooks/use-conexion";
import { BannerSinConexion } from "@/components/banner-sin-conexion";
import { AvisoUbicacion } from "@/components/aviso-ubicacion";
import { TarjetaLugar } from "@/components/tarjeta-lugar";
import { EstadoError } from "@/components/estado-error";
import { listarLugares } from "@/servicios/lugares";
import { distanciaEnMetros, ordenarPorDistancia } from "@/utils/geo";
import { construirHtmlMapa } from "@/utils/mapa-html";
import type { Posicion } from "@/servicios/ubicacion";

// Centro de Colón: desde acá se calculan las distancias mientras el GPS no
// responde o si el turista niega el permiso (la app tiene que seguir siendo
// usable sin ubicación, lo pide el PRD).
const POSICION_DE_RESPALDO: Posicion = { latitud: -32.2246, longitud: -58.1489 };
const CANTIDAD_CERCA = 5;

export default function Inicio() {
  const tema = useTema();
  const esquemaDelSistema = useColorScheme();
  const { usuario, temaPreferencia } = useSesion();
  const esOscuro = temaPreferencia === "oscuro" || (temaPreferencia === "sistema" && esquemaDelSistema === "dark");
  const { porId: categoriaPorId } = useCategorias();
  const ubicacion = useUbicacion();
  const pendientes = useVisitasPendientes();
  const sinConexion = useHayConexion() === false;

  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const cargar = useCallback(() => {
    listarLugares()
      .then((resultado) => {
        setLugares(resultado);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setCargando(false));
  }, []);

  useEffect(cargar, [cargar]);

  function reintentar() {
    setCargando(true);
    cargar();
  }

  const desde = ubicacion.posicion ?? POSICION_DE_RESPALDO;
  const cercanos = useMemo(() => ordenarPorDistancia(lugares, desde).slice(0, CANTIDAD_CERCA), [lugares, desde]);

  // La vista previa se regenera solo cuando cambian los datos de fondo: es
  // una tarjeta quieta, el mapa completo se abre al tocarla.
  const htmlMapa = useMemo(
    () =>
      construirHtmlMapa({
        lugares,
        categoriaPorId,
        posicion: ubicacion.posicion,
        colorPrimario: tema.primario,
        esOscuro,
        interactivo: false,
      }),
    [lugares, categoriaPorId, ubicacion.posicion, tema.primario, esOscuro],
  );

  return (
    <SafeAreaView style={[styles.contenedor, { backgroundColor: tema.fondo }]} edges={["top"]}>
      <BannerSinConexion />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.encabezado}>
          <View>
            <Text style={[styles.marca, { color: tema.primario }]}>MI CIUDAD</Text>
            <Text style={[styles.ciudad, { color: tema.textoPrincipal }]} accessibilityRole="header">
              Colón
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/catalogo")}
            accessibilityRole="button"
            accessibilityLabel="Buscar un lugar"
            style={[styles.botonBuscar, { backgroundColor: tema.superficie }]}
          >
            <Ionicons name="search" size={22} color={tema.primario} />
          </Pressable>
        </View>

        {usuario && pendientes > 0 && (
          <Pressable
            onPress={() => router.navigate("/recorrido")}
            accessibilityRole="button"
            style={[styles.pendientes, { backgroundColor: `${tema.advertencia}22` }]}
          >
            <Ionicons name="cloud-upload-outline" size={18} color={tema.advertencia} />
            <Text style={[styles.textoPendientes, { color: tema.textoPrincipal }]}>
              {pendientes === 1 ? "1 visita esperando" : `${pendientes} visitas esperando`} para sincronizar
            </Text>
          </Pressable>
        )}

        <AvisoUbicacion
          estado={ubicacion.estado}
          puedePreguntarDeNuevo={ubicacion.puedePreguntarDeNuevo}
          alPedir={ubicacion.pedir}
        />

        {/* Leaflet y las tiles de OpenStreetMap se descargan de internet: sin
            señal el mapa no se puede dibujar. En vez de una tarjeta en blanco
            se explica por qué, y la lista de abajo sigue funcionando con la
            copia guardada (como en el mockup del estado sin conexión). */}
        {sinConexion ? (
          <View style={[styles.mapaSinConexion, { backgroundColor: tema.superficie, borderColor: tema.borde }]}>
            <Ionicons name="map-outline" size={28} color={tema.textoSecundario} />
            <Text style={[styles.textoSinConexion, { color: tema.textoSecundario }]}>
              El mapa necesita conexión. Los lugares de abajo están guardados en tu teléfono.
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={() => router.push("/mapa")}
            accessibilityRole="button"
            accessibilityLabel="Abrir el mapa completo de lugares"
            style={[styles.tarjetaMapa, { backgroundColor: tema.superficie }]}
          >
            {!cargando && !error && (
              // pointerEvents none: la vista previa no recibe toques, así el
              // gesto de la pantalla no compite con el del mapa y cualquier
              // toque abre el mapa completo.
              <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <WebView originWhitelist={["*"]} source={{ html: htmlMapa }} style={styles.webview} />
              </View>
            )}
            <View style={[styles.etiquetaMapa, { backgroundColor: tema.superficie }]}>
              <Ionicons name="expand-outline" size={16} color={tema.primario} />
              <Text style={[styles.textoEtiquetaMapa, { color: tema.primario }]}>Ver mapa completo</Text>
            </View>
          </Pressable>
        )}

        <Text style={[styles.subtitulo, { color: tema.textoPrincipal }]} accessibilityRole="header">
          {ubicacion.posicion ? "Cerca tuyo" : "Cerca del centro"}
          {sinConexion ? " (guardado)" : ""}
        </Text>

        {cargando && <ActivityIndicator style={{ marginTop: 20 }} color={tema.primario} />}
        {!cargando && error && (
          <EstadoError
            mensaje="No pudimos cargar los lugares y todavía no hay una copia guardada en el teléfono."
            alReintentar={reintentar}
          />
        )}
        {!cargando && !error && (
          <View style={styles.lista}>
            {cercanos.map((lugar) => (
              <TarjetaLugar
                key={lugar.id}
                lugar={lugar}
                categoria={categoriaPorId.get(lugar.categoriaId)}
                distanciaEnMetros={distanciaEnMetros(desde, lugar.coordenadas)}
                onPress={() => router.push({ pathname: "/lugar/[id]", params: { id: lugar.id } })}
              />
            ))}
            <Pressable onPress={() => router.push("/catalogo")} accessibilityRole="button" style={styles.verTodos}>
              <Text style={[styles.textoVerTodos, { color: tema.primario }]}>Ver todos los lugares</Text>
              <Ionicons name="chevron-forward" size={18} color={tema.primario} />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  scroll: { paddingBottom: 24 },
  encabezado: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  marca: { fontSize: 13, fontWeight: "800", letterSpacing: 1.5 },
  ciudad: { fontSize: 30, fontWeight: "800" },
  botonBuscar: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  pendientes: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 20, marginBottom: 14, padding: 12, borderRadius: 12 },
  textoPendientes: { fontSize: 14, fontWeight: "700", flex: 1 },
  mapaSinConexion: { marginHorizontal: 20, borderRadius: 24, borderWidth: 1, padding: 24, alignItems: "center", gap: 10 },
  textoSinConexion: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  tarjetaMapa: { height: 260, marginHorizontal: 20, borderRadius: 24, overflow: "hidden" },
  webview: { flex: 1, backgroundColor: "transparent" },
  etiquetaMapa: { position: "absolute", right: 12, bottom: 12, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100 },
  textoEtiquetaMapa: { fontSize: 13, fontWeight: "800" },
  subtitulo: { fontSize: 20, fontWeight: "800", paddingHorizontal: 20, marginTop: 22, marginBottom: 12 },
  lista: { paddingHorizontal: 20 },
  verTodos: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, minHeight: 48 },
  textoVerTodos: { fontSize: 15, fontWeight: "800" },
});
