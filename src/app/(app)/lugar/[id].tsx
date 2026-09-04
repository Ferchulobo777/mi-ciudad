import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { Lugar } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { useSesion } from "@/hooks/use-sesion";
import { Boton } from "@/components/boton";
import { obtenerLugar, estaAbiertoAhora } from "@/servicios/lugares";
import { categoriasSimuladas } from "@/mocks/categorias";
import { esFavorito, alternarFavorito } from "@/servicios/favoritos";

function abrirComoLlegar(lat: number, lon: number, nombre: string) {
  const etiqueta = encodeURIComponent(nombre);
  // geo:/maps: son esquemas nativos del sistema operativo: no dependen de
  // react-native-maps ni de ninguna API key, solo abren la app de mapas que
  // el usuario ya tenga instalada.
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

  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [favorito, setFavorito] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!id) return;
    obtenerLugar(id).then((encontrado) => {
      setLugar(encontrado);
      setCargando(false);
    });
  }, [id]);

  useEffect(() => {
    if (!id || !sesion.usuario) return;
    esFavorito(sesion.usuario.id, id).then(setFavorito);
  }, [id, sesion.usuario]);

  async function tocarFavorito() {
    if (!sesion.usuario) {
      router.push("/login");
      return;
    }
    if (!id) return;
    const nuevoValor = await alternarFavorito(sesion.usuario.id, id);
    setFavorito(nuevoValor);
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
        <Text style={{ color: tema.textoSecundario }}>No encontramos ese lugar.</Text>
        <Boton etiqueta="Volver" variante="texto" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const categoria = categoriasSimuladas.find((c) => c.id === lugar.categoriaId);
  const abierto = estaAbiertoAhora(lugar);

  return (
    <View style={{ flex: 1, backgroundColor: tema.fondo }}>
      <View style={[styles.foto, { backgroundColor: categoria?.color ?? tema.primario }]}>
        <SafeAreaView edges={["top"]} style={styles.filaSuperior}>
          <IconBoton nombre="chevron-back" onPress={() => router.back()} />
          <IconBoton
            nombre={favorito ? "heart" : "heart-outline"}
            color={favorito ? tema.acento : undefined}
            onPress={tocarFavorito}
          />
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={[styles.badge, { backgroundColor: `${categoria?.color ?? tema.primario}22`, color: categoria?.color ?? tema.primario }]}>
          {categoria?.nombre ?? "Sin categoría"}
        </Text>
        <Text style={[styles.nombre, { color: tema.textoPrincipal }]}>{lugar.nombre}</Text>

        <View style={styles.filaEstado}>
          <View style={[styles.punto, { backgroundColor: abierto ? tema.exito : tema.textoSecundario }]} />
          <Text style={{ color: abierto ? tema.exito : tema.textoSecundario, fontWeight: "700", fontSize: 13 }}>
            {abierto ? "Abierto ahora" : "Cerrado ahora"}
          </Text>
        </View>

        <Text style={[styles.descripcion, { color: tema.textoPrincipal }]}>{lugar.descripcion}</Text>

        {lugar.precioEntrada !== null && (
          <Text style={{ color: tema.textoSecundario, marginBottom: 20 }}>Entrada: ${lugar.precioEntrada}</Text>
        )}

        <View style={{ gap: 10 }}>
          {lugar.audioguia ? (
            <Boton etiqueta="Escuchar audioguía (próximamente)" variante="secundario" onPress={() => {}} deshabilitado />
          ) : null}
          <Boton
            etiqueta="Cómo llegar"
            variante="secundario"
            onPress={() => abrirComoLlegar(lugar.coordenadas.latitud, lugar.coordenadas.longitud, lugar.nombre)}
          />
          <Boton etiqueta="Registrar visita (próximamente)" variante="texto" onPress={() => {}} deshabilitado />
        </View>
      </ScrollView>
    </View>
  );
}

function IconBoton({ nombre, color, onPress }: { nombre: string; color?: string; onPress: () => void }) {
  return (
    <Text onPress={onPress} style={styles.iconBoton}>
      <Ionicons name={nombre as never} size={20} color={color ?? "#1F2A2E"} />
    </Text>
  );
}

const styles = StyleSheet.create({
  centrado: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  foto: { height: 240 },
  filaSuperior: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8 },
  iconBoton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    textAlign: "center",
    textAlignVertical: "center",
  },
  contenido: { padding: 22 },
  badge: { alignSelf: "flex-start", fontSize: 12, fontWeight: "700", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, marginBottom: 10, overflow: "hidden" },
  nombre: { fontSize: 24, fontWeight: "800", marginBottom: 10 },
  filaEstado: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  punto: { width: 8, height: 8, borderRadius: 4 },
  descripcion: { fontSize: 14, lineHeight: 21, marginBottom: 16 },
});
