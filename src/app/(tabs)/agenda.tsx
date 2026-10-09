import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { Evento, Lugar } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { useSesion } from "@/hooks/use-sesion";
import { BannerSinConexion } from "@/components/banner-sin-conexion";
import { EstadoError } from "@/components/estado-error";
import { listarEventos, listarIdsDeEventosGuardados, revisarCambiosEnEventosGuardados } from "@/servicios/eventos";
import { listarLugares } from "@/servicios/lugares";
import { formatearEncabezadoDeDia, formatearHora } from "@/utils/fechas";
import { formatearPrecio } from "@/utils/formato";

interface Seccion {
  title: string;
  data: Evento[];
}

function agruparPorDia(eventos: Evento[]): Seccion[] {
  const secciones: Seccion[] = [];
  for (const evento of eventos) {
    const titulo = formatearEncabezadoDeDia(new Date(evento.inicio));
    const existente = secciones.find((s) => s.title === titulo);
    if (existente) existente.data.push(evento);
    else secciones.push({ title: titulo, data: [evento] });
  }
  return secciones;
}

export default function Agenda() {
  const tema = useTema();
  const { usuario } = useSesion();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [lugares, setLugares] = useState<Map<string, Lugar>>(new Map());
  const [guardados, setGuardados] = useState<Set<string>>(new Set());
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [resultado, todosLosLugares] = await Promise.all([listarEventos(), listarLugares().catch(() => [])]);
      setEventos(resultado);
      setLugares(new Map(todosLosLugares.map((l) => [l.id, l])));
      setError(false);
      if (usuario) {
        setGuardados(new Set(await listarIdsDeEventosGuardados(usuario.id)));
        revisarCambiosEnEventosGuardados(usuario.id).catch(() => {});
      } else {
        setGuardados(new Set());
      }
    } catch {
      setError(true);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [usuario]);

  // La pestaña no se desmonta al cambiar de pantalla: con useFocusEffect la
  // estrella de "guardado" se actualiza al volver del detalle de un evento.
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const secciones = useMemo(() => agruparPorDia(eventos), [eventos]);

  let contenido: ReactNode;
  if (cargando) {
    contenido = <ActivityIndicator style={{ marginTop: 40 }} color={tema.primario} />;
  } else if (error) {
    contenido = (
      <EstadoError
        mensaje="No pudimos cargar la agenda y todavía no hay una copia guardada en el teléfono."
        alReintentar={() => {
          setCargando(true);
          cargar();
        }}
      />
    );
  } else {
    contenido = (
      <SectionList
        sections={secciones}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.lista}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => {
              setRefrescando(true);
              cargar();
            }}
            tintColor={tema.primario}
            colors={[tema.primario]}
          />
        }
        renderSectionHeader={({ section }) => (
          <Text style={[styles.encabezadoGrupo, { color: tema.textoSecundario }]} accessibilityRole="header">
            {section.title.toUpperCase()}
          </Text>
        )}
        renderItem={({ item }) => (
          <FilaEvento
            evento={item}
            lugar={item.lugarId ? lugares.get(item.lugarId) : undefined}
            guardado={guardados.has(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Ionicons name="calendar-outline" size={40} color={tema.textoSecundario} />
            <Text style={[styles.textoVacio, { color: tema.textoSecundario }]}>
              No hay eventos programados por ahora. Deslizá hacia abajo para actualizar.
            </Text>
          </View>
        }
      />
    );
  }

  return (
    <SafeAreaView style={[styles.contenedor, { backgroundColor: tema.fondo }]} edges={["top"]}>
      <BannerSinConexion />
      <Text style={[styles.titulo, { color: tema.textoPrincipal }]} accessibilityRole="header">
        Agenda de eventos
      </Text>
      {contenido}
    </SafeAreaView>
  );
}

interface PropsFila {
  readonly evento: Evento;
  readonly lugar: Lugar | undefined;
  readonly guardado: boolean;
}

function FilaEvento({ evento, lugar, guardado }: PropsFila) {
  const tema = useTema();
  const suspendido = evento.estado === "suspendido" || evento.estado === "cancelado";
  const donde = lugar?.nombre ?? evento.direccionLibre;
  const detalle = suspendido
    ? evento.estado === "suspendido"
      ? "Suspendido"
      : "Cancelado"
    : [donde, formatearPrecio(evento.precio)].filter(Boolean).join(" · ");
  const [hora, minutos] = formatearHora(new Date(evento.inicio)).split(":");

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/evento/[id]", params: { id: evento.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${evento.titulo}, ${hora}:${minutos} horas, ${detalle}${guardado ? ", guardado" : ""}`}
      style={({ pressed }) => [
        styles.fila,
        { backgroundColor: tema.superficie, borderLeftColor: suspendido ? tema.error : "transparent" },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={styles.horaBloque}>
        <Text style={[styles.hora, { color: suspendido ? tema.textoSecundario : tema.primario }, suspendido && styles.tachado]}>
          {hora}
        </Text>
        <Text style={[styles.minutos, { color: tema.textoSecundario }]}>{minutos === "00" ? "hs" : `:${minutos}`}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.tituloEvento, { color: tema.textoPrincipal }]} numberOfLines={2}>
          {evento.titulo}
        </Text>
        <Text style={[styles.subtitulo, { color: suspendido ? tema.error : tema.textoSecundario }]} numberOfLines={1}>
          {detalle}
        </Text>
      </View>
      {guardado && <Ionicons name="star" size={20} color={tema.acento} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  titulo: { fontSize: 24, fontWeight: "800", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 },
  lista: { padding: 20, paddingTop: 8 },
  encabezadoGrupo: { fontSize: 13, fontWeight: "800", letterSpacing: 0.5, marginTop: 10, marginBottom: 8 },
  fila: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 14, borderLeftWidth: 4, padding: 14, marginBottom: 10 },
  horaBloque: { width: 52, alignItems: "center" },
  hora: { fontSize: 22, fontWeight: "800" },
  minutos: { fontSize: 12, fontWeight: "700" },
  tachado: { textDecorationLine: "line-through" },
  tituloEvento: { fontSize: 16, fontWeight: "700" },
  subtitulo: { fontSize: 14, marginTop: 2 },
  vacio: { padding: 40, alignItems: "center", gap: 10 },
  textoVacio: { fontSize: 15, textAlign: "center", lineHeight: 22 },
});
