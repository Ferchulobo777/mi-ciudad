import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { Evento } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { useSesion } from "@/hooks/use-sesion";
import { Boton } from "@/components/boton";
import { obtenerEvento, estaGuardado, alternarGuardadoConRecordatorio } from "@/servicios/eventos";
import { formatearHora } from "@/utils/fechas";

function abrirComoLlegar(lat: number, lon: number, nombre: string) {
  const etiqueta = encodeURIComponent(nombre);
  const url = Platform.select({
    ios: `maps:0,0?q=${etiqueta}@${lat},${lon}`,
    android: `geo:0,0?q=${lat},${lon}(${etiqueta})`,
    default: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
  });
  Linking.openURL(url as string).catch(() => {});
}

export default function DetalleEvento() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tema = useTema();
  const sesion = useSesion();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!id) return;
    obtenerEvento(id).then((encontrado) => {
      setEvento(encontrado);
      setCargando(false);
    });
  }, [id]);

  useEffect(() => {
    if (!id || !sesion.usuario) return;
    estaGuardado(sesion.usuario.id, id).then(setGuardado);
  }, [id, sesion.usuario]);

  async function tocarGuardar() {
    if (!sesion.usuario) {
      router.push("/login");
      return;
    }
    if (!evento) return;
    setGuardando(true);
    const resultado = await alternarGuardadoConRecordatorio(sesion.usuario.id, evento);
    setGuardado(resultado.guardado);
    setGuardando(false);
  }

  if (cargando) {
    return (
      <SafeAreaView style={[styles.centrado, { backgroundColor: tema.fondo }]}>
        <ActivityIndicator color={tema.primario} />
      </SafeAreaView>
    );
  }

  if (!evento) {
    return (
      <SafeAreaView style={[styles.centrado, { backgroundColor: tema.fondo }]}>
        <Text style={{ color: tema.textoSecundario }}>No encontramos ese evento.</Text>
        <Boton etiqueta="Volver" variante="texto" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const suspendido = evento.estado === "suspendido" || evento.estado === "cancelado";
  const inicio = new Date(evento.inicio);
  const fin = evento.fin ? new Date(evento.fin) : null;

  return (
    <View style={{ flex: 1, backgroundColor: tema.fondo }}>
      <View style={[styles.foto, { backgroundColor: suspendido ? tema.textoSecundario : tema.secundario }]}>
        <SafeAreaView edges={["top"]} style={styles.filaSuperior}>
          <IconBoton nombre="chevron-back" onPress={() => router.back()} />
        </SafeAreaView>
        <Text style={styles.badge}>{evento.precio === null ? "Gratis" : `$${evento.precio}`}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={[styles.titulo, { color: tema.textoPrincipal }]}>{evento.titulo}</Text>

        {suspendido && (
          <View style={[styles.avisoSuspendido, { backgroundColor: `${tema.error}1A` }]}>
            <Text style={{ color: tema.error, fontWeight: "700" }}>Evento suspendido</Text>
          </View>
        )}

        <View style={styles.filaDato}>
          <Ionicons name="calendar-outline" size={16} color={tema.primario} />
          <Text style={{ color: tema.textoPrincipal, fontSize: 13 }}>
            {formatearHora(inicio)}
            {fin ? ` a ${formatearHora(fin)}` : ""}
          </Text>
        </View>
        {evento.direccionLibre ? (
          <View style={styles.filaDato}>
            <Ionicons name="location-outline" size={16} color={tema.primario} />
            <Text style={{ color: tema.textoPrincipal, fontSize: 13 }}>{evento.direccionLibre}</Text>
          </View>
        ) : null}

        <Text style={[styles.descripcion, { color: tema.textoPrincipal }]}>{evento.descripcion}</Text>

        <View style={{ gap: 10 }}>
          <Boton
            etiqueta={guardado ? "Quitar recordatorio" : "Guardar con recordatorio"}
            variante={guardado ? "secundario" : "primario"}
            onPress={tocarGuardar}
            cargando={guardando}
            deshabilitado={suspendido}
          />
          {evento.coordenadas ? (
            <Boton
              etiqueta="Cómo llegar"
              variante="secundario"
              onPress={() => abrirComoLlegar(evento.coordenadas!.latitud, evento.coordenadas!.longitud, evento.titulo)}
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function IconBoton({ nombre, onPress }: { readonly nombre: string; readonly onPress: () => void }) {
  return (
    <Text onPress={onPress} style={styles.iconBoton}>
      <Ionicons name={nombre as never} size={20} color="#1F2A2E" />
    </Text>
  );
}

const styles = StyleSheet.create({
  centrado: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  foto: { height: 200, justifyContent: "space-between" },
  filaSuperior: { paddingHorizontal: 16, paddingTop: 8 },
  iconBoton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    textAlign: "center",
    textAlignVertical: "center",
  },
  badge: {
    alignSelf: "flex-start",
    margin: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    color: "#1F7D45",
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    overflow: "hidden",
  },
  contenido: { padding: 22 },
  titulo: { fontSize: 23, fontWeight: "800", marginBottom: 12 },
  avisoSuspendido: { borderRadius: 12, padding: 12, marginBottom: 14 },
  filaDato: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  descripcion: { fontSize: 14, lineHeight: 21, marginVertical: 16 },
});
