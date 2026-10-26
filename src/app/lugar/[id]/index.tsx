import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { Lugar } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { useSesion } from "@/hooks/use-sesion";
import { useCategorias } from "@/hooks/use-categorias";
import { useUbicacion } from "@/hooks/use-ubicacion";
import { Boton } from "@/components/boton";
import { ImagenLugar } from "@/components/imagen-lugar";
import { ReproductorAudioguia } from "@/components/reproductor-audioguia";
import { FlechaHaciaLugar } from "@/components/flecha-hacia-lugar";
import { obtenerLugar } from "@/servicios/lugares";
import { esFavorito, alternarFavorito } from "@/servicios/favoritos";
import { vibrarSeleccion } from "@/servicios/hapticos";
import { describirHorario, semanaDeHorarios } from "@/utils/horarios";
import { distanciaEnMetros, formatearDistancia } from "@/utils/geo";
import { formatearPrecio } from "@/utils/formato";

// A partir de esta distancia el cartel del lugar ya no se ve desde donde
// está el turista: ahí tiene sentido la flecha que pide el PRD. Es el mismo
// umbral que se usa para registrar una visita por cercanía.
const DISTANCIA_PARA_FLECHA = 200;

// geo: y maps: son esquemas del sistema operativo: abren la app de mapas que
// el turista ya tenga instalada, y desde ahí elige ir caminando o en auto.
function abrirComoLlegar(lat: number, lon: number, nombre: string) {
  const etiqueta = encodeURIComponent(nombre);
  const url = Platform.select({
    ios: `maps:0,0?q=${etiqueta}@${lat},${lon}`,
    android: `geo:0,0?q=${lat},${lon}(${etiqueta})`,
    default: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
  });
  Linking.openURL(url as string).catch(() => {});
}

export default function DetalleLugar() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tema = useTema();
  const sesion = useSesion();
  const { porId: categoriaPorId } = useCategorias();
  const ubicacion = useUbicacion();

  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [favorito, setFavorito] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!id) return;
    obtenerLugar(id)
      .then(setLugar)
      .catch(() => setLugar(null))
      .finally(() => setCargando(false));
  }, [id]);

  useEffect(() => {
    if (!id || !sesion.usuario) return;
    esFavorito(sesion.usuario.id, id).then(setFavorito);
  }, [id, sesion.usuario]);

  async function tocarFavorito() {
    // La cuenta es para guardar cosas (PRD): mirar el lugar no la pide,
    // marcarlo como favorito sí.
    if (!sesion.usuario) {
      router.push("/login");
      return;
    }
    if (!id) return;
    vibrarSeleccion();
    setFavorito(await alternarFavorito(sesion.usuario.id, id));
  }

  if (cargando) {
    return (
      <SafeAreaView style={[styles.centrado, { backgroundColor: tema.fondo }]}>
        <ActivityIndicator color={tema.primario} />
      </SafeAreaView>
    );
  }

  if (!lugar) {
    return (
      <SafeAreaView style={[styles.centrado, { backgroundColor: tema.fondo }]}>
        <Ionicons name="help-circle-outline" size={40} color={tema.textoSecundario} />
        <Text style={[styles.texto, { color: tema.textoSecundario }]}>No encontramos ese lugar.</Text>
        <Boton etiqueta="Volver" variante="texto" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const categoria = categoriaPorId.get(lugar.categoriaId);
  const horario = describirHorario(lugar);
  const distancia = ubicacion.posicion ? distanciaEnMetros(ubicacion.posicion, lugar.coordenadas) : null;
  const precio = formatearPrecio(lugar.precioEntrada);
  let colorHorario: string = tema.textoSecundario;
  if (horario.estado === "abierto") colorHorario = tema.exito;
  else if (horario.estado === "cerrado") colorHorario = tema.error;

  return (
    <View style={{ flex: 1, backgroundColor: tema.fondo }}>
      <View style={styles.foto}>
        <ImagenLugar categoria={categoria} uri={lugar.imagenes[0]} tamañoIcono={64} style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={["top"]} style={styles.filaSuperior}>
          <BotonIcono nombre="chevron-back" etiqueta="Volver" onPress={() => router.back()} />
          <BotonIcono
            nombre={favorito ? "heart" : "heart-outline"}
            color={favorito ? tema.acento : undefined}
            etiqueta={favorito ? "Quitar de favoritos" : "Agregar a favoritos"}
            onPress={tocarFavorito}
          />
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={[styles.badge, { backgroundColor: `${categoria?.color ?? tema.primario}22`, color: categoria?.color ?? tema.primario }]}>
          {categoria?.nombre ?? "Sin categoría"}
        </Text>
        <Text style={[styles.nombre, { color: tema.textoPrincipal }]} accessibilityRole="header">
          {lugar.nombre}
        </Text>

        <View style={styles.filaEstado}>
          <View style={[styles.punto, { backgroundColor: colorHorario }]} />
          <Text style={[styles.estado, { color: colorHorario }]}>{horario.texto}</Text>
        </View>
        {distancia !== null && (
          <Text style={[styles.distancia, { color: tema.textoSecundario }]}>
            A {formatearDistancia(distancia)} de donde estás
          </Text>
        )}

        {ubicacion.posicion && distancia !== null && distancia > DISTANCIA_PARA_FLECHA && (
          <FlechaHaciaLugar desde={ubicacion.posicion} hacia={lugar.coordenadas} />
        )}

        <Text style={[styles.descripcion, { color: tema.textoPrincipal }]}>{lugar.descripcion}</Text>

        {lugar.audioguia && (
          <View style={{ marginBottom: 18 }}>
            <ReproductorAudioguia audioguia={lugar.audioguia} titulo={lugar.nombre} />
          </View>
        )}

        <View style={{ gap: 10 }}>
          <Boton
            etiqueta="Cómo llegar"
            onPress={() => abrirComoLlegar(lugar.coordenadas.latitud, lugar.coordenadas.longitud, lugar.nombre)}
          />
          <Boton
            etiqueta="Ver en el mapa"
            variante="secundario"
            onPress={() => router.push({ pathname: "/mapa", params: { lugarId: lugar.id } })}
          />
          <Boton
            etiqueta="Registrar visita"
            variante="secundario"
            onPress={() =>
              sesion.usuario
                ? router.push({ pathname: "/lugar/[id]/visitar", params: { id: lugar.id } })
                : router.push("/login")
            }
          />
        </View>

        <View style={[styles.datos, { backgroundColor: tema.superficie }]}>
          <Dato icono="location-outline" texto={lugar.direccion} />
          {precio && <Dato icono="ticket-outline" texto={precio === "Gratis" ? "Entrada gratis" : `Entrada ${precio}`} />}
          {lugar.accesible && <Dato icono="accessibility-outline" texto="Accesible en silla de ruedas" />}
          {lugar.telefono && (
            <Dato icono="call-outline" texto={lugar.telefono} onPress={() => Linking.openURL(`tel:${lugar.telefono}`)} />
          )}
          {lugar.sitioWeb && (
            <Dato icono="globe-outline" texto={lugar.sitioWeb} onPress={() => Linking.openURL(lugar.sitioWeb as string)} />
          )}
        </View>

        {lugar.horarios.length > 0 && (
          <View style={[styles.datos, { backgroundColor: tema.superficie }]}>
            <Text style={[styles.subtitulo, { color: tema.textoPrincipal }]}>Horarios</Text>
            {semanaDeHorarios(lugar.horarios).map((dia) => (
              <View key={dia.dia} style={styles.filaHorario}>
                <Text style={[styles.texto, { color: tema.textoPrincipal, textTransform: "capitalize" }]}>{dia.dia}</Text>
                <Text style={[styles.texto, { color: dia.texto === "Cerrado" ? tema.textoSecundario : tema.textoPrincipal }]}>
                  {dia.texto}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

interface PropsDato {
  readonly icono: string;
  readonly texto: string;
  readonly onPress?: () => void;
}

function Dato({ icono, texto, onPress }: PropsDato) {
  const tema = useTema();
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? "link" : "text"} style={styles.filaDato}>
      <Ionicons name={icono as never} size={20} color={tema.primario} />
      <Text style={[styles.texto, { color: onPress ? tema.primario : tema.textoPrincipal, flex: 1 }]}>{texto}</Text>
    </Pressable>
  );
}

interface PropsBotonIcono {
  readonly nombre: string;
  readonly color?: string;
  readonly etiqueta: string;
  readonly onPress: () => void;
}

function BotonIcono({ nombre, color, etiqueta, onPress }: PropsBotonIcono) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={etiqueta} hitSlop={8} style={styles.botonIcono}>
      <Ionicons name={nombre as never} size={22} color={color ?? "#1F2A2E"} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centrado: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  foto: { height: 240, overflow: "hidden" },
  filaSuperior: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8 },
  botonIcono: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" },
  contenido: { padding: 22, paddingBottom: 40 },
  badge: { alignSelf: "flex-start", fontSize: 13, fontWeight: "700", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, marginBottom: 10, overflow: "hidden" },
  nombre: { fontSize: 26, fontWeight: "800", marginBottom: 10 },
  filaEstado: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  punto: { width: 10, height: 10, borderRadius: 5 },
  estado: { fontWeight: "700", fontSize: 15 },
  distancia: { fontSize: 15, marginBottom: 16 },
  descripcion: { fontSize: 16, lineHeight: 24, marginVertical: 12 },
  datos: { borderRadius: 16, padding: 16, marginTop: 18, gap: 4 },
  subtitulo: { fontSize: 16, fontWeight: "800", marginBottom: 6 },
  filaDato: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 40 },
  filaHorario: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  texto: { fontSize: 15 },
});
