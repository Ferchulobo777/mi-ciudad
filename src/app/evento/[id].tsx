import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { Coordenadas, Evento, Lugar } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { useSesion } from "@/hooks/use-sesion";
import { Boton } from "@/components/boton";
import { obtenerEvento, estaGuardado, alternarGuardadoConRecordatorio } from "@/servicios/eventos";
import { obtenerLugar } from "@/servicios/lugares";
import { vibrarConfirmacion } from "@/servicios/hapticos";
import { formatearFechaDeEvento } from "@/utils/fechas";
import { formatearPrecio } from "@/utils/formato";

function abrirComoLlegar({ latitud, longitud }: Coordenadas, nombre: string) {
  const etiqueta = encodeURIComponent(nombre);
  const url = Platform.select({
    ios: `maps:0,0?q=${etiqueta}@${latitud},${longitud}`,
    android: `geo:0,0?q=${latitud},${longitud}(${etiqueta})`,
    default: `https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}`,
  });
  Linking.openURL(url as string).catch(() => {});
}

export default function DetalleEvento() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tema = useTema();
  const sesion = useSesion();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!id) return;
    obtenerEvento(id)
      .then(async (encontrado) => {
        setEvento(encontrado);
        // Un evento puede estar asociado a un lugar del catálogo o tener una
        // dirección suelta (un campo, la costanera): en el primer caso la
        // ubicación sale del lugar.
        if (encontrado?.lugarId) setLugar(await obtenerLugar(encontrado.lugarId));
      })
      .catch(() => setEvento(null))
      .finally(() => setCargando(false));
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
    if (resultado.guardado) vibrarConfirmacion();
    if (resultado.guardado && !resultado.conRecordatorio) {
      Alert.alert(
        "Evento guardado",
        "Quedó en tu agenda, pero sin recordatorio: las notificaciones están desactivadas para Mi Ciudad. Podés habilitarlas desde los ajustes.",
        [
          { text: "Ahora no", style: "cancel" },
          { text: "Abrir ajustes", onPress: () => Linking.openSettings() },
        ],
      );
    }
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
        <Text style={[styles.texto, { color: tema.textoSecundario }]}>No encontramos ese evento.</Text>
        <Boton etiqueta="Volver" variante="texto" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const suspendido = evento.estado === "suspendido" || evento.estado === "cancelado";
  const precio = formatearPrecio(evento.precio);
  const coordenadas = lugar?.coordenadas ?? evento.coordenadas;
  const donde = lugar?.nombre ?? evento.direccionLibre;

  return (
    <View style={{ flex: 1, backgroundColor: tema.fondo }}>
      <View style={[styles.foto, { backgroundColor: suspendido ? tema.textoSecundario : tema.secundario }]}>
        <SafeAreaView edges={["top"]} style={styles.filaSuperior}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            hitSlop={8}
            style={styles.botonIcono}
          >
            <Ionicons name="chevron-back" size={22} color="#1F2A2E" />
          </Pressable>
        </SafeAreaView>
        {precio && <Text style={styles.badge}>{precio}</Text>}
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={[styles.titulo, { color: tema.textoPrincipal }]} accessibilityRole="header">
          {evento.titulo}
        </Text>

        {suspendido && (
          <View style={[styles.avisoSuspendido, { backgroundColor: `${tema.error}1A` }]}>
            <Ionicons name="alert-circle" size={20} color={tema.error} />
            <Text style={[styles.textoAviso, { color: tema.error }]}>
              {evento.estado === "suspendido" ? "Evento suspendido" : "Evento cancelado"}
            </Text>
          </View>
        )}

        <View style={styles.filaDato}>
          <Ionicons name="calendar-outline" size={20} color={tema.primario} />
          <Text style={[styles.texto, { color: tema.textoPrincipal }]}>{formatearFechaDeEvento(evento)}</Text>
        </View>
        {donde && (
          <Pressable
            style={styles.filaDato}
            disabled={!lugar}
            accessibilityRole={lugar ? "link" : "text"}
            onPress={() => lugar && router.push({ pathname: "/lugar/[id]", params: { id: lugar.id } })}
          >
            <Ionicons name="location-outline" size={20} color={tema.primario} />
            <Text style={[styles.texto, { color: lugar ? tema.primario : tema.textoPrincipal }]}>{donde}</Text>
          </Pressable>
        )}

        <Text style={[styles.descripcion, { color: tema.textoPrincipal }]}>{evento.descripcion}</Text>

        <View style={{ gap: 10 }}>
          <Boton
            etiqueta={guardado ? "Quitar de mi agenda" : "Guardar con recordatorio"}
            variante={guardado ? "secundario" : "primario"}
            onPress={tocarGuardar}
            cargando={guardando}
            deshabilitado={suspendido && !guardado}
          />
          {coordenadas && (
            <Boton etiqueta="Cómo llegar" variante="secundario" onPress={() => abrirComoLlegar(coordenadas, donde ?? evento.titulo)} />
          )}
        </View>
        {guardado && !suspendido && (
          <Text style={[styles.aclaracion, { color: tema.textoSecundario }]}>
            Te avisamos una hora antes de que empiece.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centrado: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  foto: { height: 200, justifyContent: "space-between" },
  filaSuperior: { paddingHorizontal: 16, paddingTop: 8 },
  botonIcono: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" },
  badge: {
    alignSelf: "flex-start",
    margin: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    color: "#1F7D45",
    fontSize: 14,
    fontWeight: "800",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    overflow: "hidden",
  },
  contenido: { padding: 22, paddingBottom: 40 },
  titulo: { fontSize: 25, fontWeight: "800", marginBottom: 14 },
  avisoSuspendido: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, padding: 12, marginBottom: 14 },
  textoAviso: { fontWeight: "800", fontSize: 15 },
  filaDato: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10, minHeight: 28 },
  texto: { fontSize: 15, flexShrink: 1 },
  descripcion: { fontSize: 16, lineHeight: 24, marginVertical: 16 },
  aclaracion: { fontSize: 13, textAlign: "center", marginTop: 10 },
});
