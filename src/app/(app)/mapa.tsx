import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Callout, Marker, PROVIDER_DEFAULT, type Region } from "react-native-maps";
import { router } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { Categoria, Lugar } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { useSesion } from "@/hooks/use-sesion";
import { listarCategorias, listarLugares, distanciaEnMetros, formatearDistancia } from "@/servicios/lugares";
import { obtenerPosicionActual, type Posicion } from "@/servicios/ubicacion";

const CENTRO_COLON: Posicion = { latitud: -32.2246, longitud: -58.1489 };

// Estilo oscuro propio para el mapa: react-native-maps no seguí el tema de la
// app solo, la tile del proveedor (Google/Apple) se pinta aparte y hay que
// pasarle un arreglo de reglas de estilo si no se quiere un mapa claro
// "pegado" sobre una pantalla en modo oscuro.
const ESTILO_OSCURO = [
  { elementType: "geometry", stylers: [{ color: "#17262A" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#A9B4B6" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#10181A" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#25363A" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0B4E63" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1D2E31" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#264A2C" }] },
];

// Calcula una región que encuadre todos los lugares con un margen, en vez de
// una región fija: si mañana se agregan lugares lejos del centro (el caso de
// prueba de El Palmar, más al sur), el mapa los sigue mostrando a todos.
function calcularRegionInicial(lugares: Lugar[]): Region {
  if (lugares.length === 0) {
    return {
      latitude: CENTRO_COLON.latitud,
      longitude: CENTRO_COLON.longitud,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }
  const latitudes = lugares.map((l) => l.coordenadas.latitud);
  const longitudes = lugares.map((l) => l.coordenadas.longitud);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const margen = 1.6;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * margen, 0.02),
    longitudeDelta: Math.max((maxLon - minLon) * margen, 0.02),
  };
}

export default function Mapa() {
  const tema = useTema();
  const esquemaDelSistema = useColorScheme();
  const { temaPreferencia } = useSesion();
  const esOscuro =
    temaPreferencia === "oscuro" || (temaPreferencia === "sistema" && esquemaDelSistema === "dark");
  const mapaRef = useRef<MapView>(null);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [posicion, setPosicion] = useState<Posicion | null>(null);

  useEffect(() => {
    listarLugares().then(setLugares);
    listarCategorias().then(setCategorias);
    obtenerPosicionActual().then(setPosicion);
  }, []);

  const categoriaPorId = useMemo(() => new Map(categorias.map((c) => [c.id, c])), [categorias]);
  const regionInicial = useMemo(() => calcularRegionInicial(lugares), [lugares]);

  function centrarEnMiUbicacion() {
    obtenerPosicionActual().then((real) => {
      if (!real) return;
      setPosicion(real);
      mapaRef.current?.animateToRegion(
        { latitude: real.latitud, longitude: real.longitud, latitudeDelta: 0.02, longitudeDelta: 0.02 },
        400,
      );
    });
  }

  return (
    <View style={styles.contenedor}>
      <MapView
        ref={mapaRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={regionInicial}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={esOscuro ? ESTILO_OSCURO : []}
      >
        {lugares.map((lugar) => {
          const categoria = categoriaPorId.get(lugar.categoriaId);
          const distancia = posicion ? distanciaEnMetros(posicion, lugar.coordenadas) : null;
          return (
            <Marker
              key={lugar.id}
              coordinate={{ latitude: lugar.coordenadas.latitud, longitude: lugar.coordenadas.longitud }}
              pinColor={categoria?.color ?? tema.primario}
            >
              <Callout onPress={() => router.push({ pathname: "/lugar/[id]", params: { id: lugar.id } })}>
                <View style={styles.globo}>
                  <Text style={styles.globoTitulo} numberOfLines={1}>
                    {lugar.nombre}
                  </Text>
                  <Text style={styles.globoSubtitulo} numberOfLines={1}>
                    {categoria?.nombre ?? "Sin categoría"}
                    {distancia !== null ? ` · ${formatearDistancia(distancia)}` : ""}
                  </Text>
                  <Text style={styles.globoAccion}>Ver detalle</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

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
  globo: { minWidth: 160, maxWidth: 220, padding: 4 },
  globoTitulo: { fontSize: 14, fontWeight: "800", color: "#1F2A2E" },
  globoSubtitulo: { fontSize: 12, color: "#5C6B6E", marginTop: 2 },
  globoAccion: { fontSize: 12, fontWeight: "700", color: "#0B6E8C", marginTop: 6 },
});
