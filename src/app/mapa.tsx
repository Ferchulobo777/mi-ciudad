import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { Lugar } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { useSesion } from "@/hooks/use-sesion";
import { useCategorias } from "@/hooks/use-categorias";
import { useUbicacion } from "@/hooks/use-ubicacion";
import { useHayConexion } from "@/hooks/use-conexion";
import { ChipsCategorias } from "@/components/chips-categorias";
import { EstadoError } from "@/components/estado-error";
import { MapaLugares } from "@/components/mapa-lugares";
import { listarLugares } from "@/servicios/lugares";
import { calcularRuta, type RutaCalculada } from "@/servicios/ruteo";
import { formatearDistancia } from "@/utils/geo";
import { hayMapaNativo } from "@/utils/mapa";

function formatearDuracion(segundos: number): string {
  const minutos = Math.round(segundos / 60);
  if (minutos < 60) return `${minutos} min`;
  return `${Math.floor(minutos / 60)} h ${minutos % 60} min`;
}

export default function Mapa() {
  // Todo parámetro de ruta llega como texto (o no llega): se usa tal cual
  // como id, sin convertir, porque los ids del contrato son strings.
  const { lugarId } = useLocalSearchParams<{ lugarId?: string }>();
  const tema = useTema();
  const esquemaDelSistema = useColorScheme();
  const { temaPreferencia } = useSesion();
  const esOscuro = temaPreferencia === "oscuro" || (temaPreferencia === "sistema" && esquemaDelSistema === "dark");
  const { categorias, porId: categoriaPorId } = useCategorias();
  const ubicacion = useUbicacion();
  const sinConexion = useHayConexion() === false;
  const conMapa = hayMapaNativo();

  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [categoria, setCategoria] = useState<string | null>(null);
  // undefined = todavía no se calculó, null = no hay ruta disponible.
  const [ruta, setRuta] = useState<RutaCalculada | null | undefined>(undefined);
  const [pedidosDeCentrado, setPedidosDeCentrado] = useState(0);

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

  const lugarDestacado = useMemo(() => lugares.find((l) => l.id === lugarId), [lugares, lugarId]);

  // La ruta se pide recién con las dos puntas: la posición real del turista y
  // el lugar de destino. Sin permiso de ubicación el mapa igual muestra el
  // lugar destacado, solo que sin la línea.
  useEffect(() => {
    if (!lugarDestacado || !ubicacion.posicion) return;
    let vigente = true;
    calcularRuta(ubicacion.posicion, lugarDestacado.coordenadas).then((resultado) => {
      if (!vigente) return;
      setRuta(resultado);
    });
    return () => {
      vigente = false;
    };
  }, [lugarDestacado, ubicacion.posicion]);

  function centrarEnMiUbicacion() {
    if (ubicacion.estado !== "concedida") {
      ubicacion.pedir();
      return;
    }
    if (ubicacion.posicion) setPedidosDeCentrado((n) => n + 1);
    ubicacion.actualizar();
  }

  const calculandoRuta = lugarDestacado !== undefined && ubicacion.posicion !== null && ruta === undefined;

  return (
    <View style={[styles.contenedor, { backgroundColor: tema.fondo }]}>
      {!cargando && !error && !sinConexion && conMapa && (
        <MapaLugares
          centrarEnTurista={pedidosDeCentrado}
          lugares={lugares}
          categoriaPorId={categoriaPorId}
          posicion={ubicacion.posicion}
          colorPrimario={tema.primario}
          esOscuro={esOscuro}
          categoriaId={categoria}
          lugarDestacadoId={lugarId}
          ruta={ruta?.puntos}
          alVerLugar={(id) => router.push({ pathname: "/lugar/[id]", params: { id } })}
        />
      )}
      {cargando && <ActivityIndicator style={styles.centro} color={tema.primario} />}
      {/* Sin señal el mapa no puede bajar las partes que no tiene guardadas, y un
          build de Android sin clave de Google no puede dibujarlo: en los dos casos
          se ofrece la lista de lugares, que sale de la copia guardada. */}
      {!cargando && !error && (sinConexion || !conMapa) && (
        <View style={[styles.centro, styles.sinConexion]}>
          <Ionicons name="cloud-offline-outline" size={40} color={tema.textoSecundario} />
          <Text style={[styles.textoSinConexion, { color: tema.textoSecundario }]}>
            {sinConexion
              ? "El mapa necesita conexión a internet. Mientras tanto podés ver la lista de lugares, que está guardada en tu teléfono."
              : "El mapa no está disponible en esta versión de la app. Podés ver la lista de lugares ordenada por distancia."}
          </Text>
          <Pressable
            onPress={() => router.replace("/catalogo")}
            accessibilityRole="button"
            style={[styles.botonLista, { backgroundColor: tema.primario }]}
          >
            <Text style={styles.textoBotonLista}>Ver la lista de lugares</Text>
          </Pressable>
        </View>
      )}
      {error && (
        <View style={styles.centro}>
          <EstadoError
            mensaje="No pudimos cargar los lugares del mapa."
            alReintentar={() => {
              setCargando(true);
              cargar();
            }}
          />
        </View>
      )}

      <SafeAreaView style={styles.capaSuperior} pointerEvents="box-none" edges={["top"]}>
        <View style={styles.filaSuperior} pointerEvents="box-none">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            style={[styles.botonRedondo, { backgroundColor: tema.superficie }]}
          >
            <Ionicons name="chevron-back" size={24} color={tema.textoPrincipal} />
          </Pressable>
          <Text style={[styles.titulo, { color: tema.textoPrincipal, backgroundColor: tema.superficie }]} numberOfLines={1}>
            {lugarDestacado ? lugarDestacado.nombre : "Mapa de Colón"}
          </Text>
        </View>

        {!lugarDestacado && (
          <View style={styles.filaChips} pointerEvents="box-none">
            <ChipsCategorias categorias={categorias} seleccionada={categoria} alElegir={setCategoria} />
          </View>
        )}

        {lugarDestacado && (calculandoRuta || ruta) && (
          <View style={[styles.infoRuta, { backgroundColor: tema.superficie }]}>
            {calculandoRuta ? (
              <ActivityIndicator size="small" color={tema.primario} />
            ) : (
              ruta && (
                <>
                  <Ionicons name="walk-outline" size={18} color={tema.primario} />
                  <Text style={[styles.textoRuta, { color: tema.textoPrincipal }]}>
                    {formatearDistancia(ruta.distanciaMetros)} · {formatearDuracion(ruta.duracionSegundos)} caminando
                  </Text>
                </>
              )
            )}
          </View>
        )}
      </SafeAreaView>

      <Pressable
        onPress={centrarEnMiUbicacion}
        accessibilityRole="button"
        accessibilityLabel={ubicacion.estado === "concedida" ? "Centrar en mi ubicación" : "Usar mi ubicación"}
        style={[styles.botonUbicacion, { backgroundColor: tema.superficie }]}
      >
        <Ionicons name="locate" size={24} color={tema.primario} />
      </Pressable>
    </View>
  );
}

const sombra = {
  elevation: 4,
  shadowColor: "#000",
  shadowOpacity: 0.2,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
};

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  centro: { flex: 1, justifyContent: "center" },
  sinConexion: { alignItems: "center", gap: 14, paddingHorizontal: 32 },
  textoSinConexion: { fontSize: 16, textAlign: "center", lineHeight: 23 },
  botonLista: { minHeight: 52, borderRadius: 14, paddingHorizontal: 20, justifyContent: "center" },
  textoBotonLista: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  capaSuperior: { position: "absolute", top: 0, left: 0, right: 0 },
  filaSuperior: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 8 },
  botonRedondo: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", ...sombra },
  titulo: { flexShrink: 1, fontSize: 17, fontWeight: "800", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, overflow: "hidden" },
  filaChips: { marginTop: 10 },
  infoRuta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, marginHorizontal: 16, alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, ...sombra },
  textoRuta: { fontSize: 15, fontWeight: "700" },
  botonUbicacion: { position: "absolute", right: 20, bottom: 36, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", ...sombra },
});
