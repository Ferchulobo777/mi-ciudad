import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { Lugar } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { useSesion } from "@/hooks/use-sesion";
import { TarjetaLugar } from "@/components/tarjeta-lugar";
import { listarFavoritos } from "@/servicios/favoritos";
import { obtenerLugaresPorIds } from "@/servicios/lugares";
import { categoriasSimuladas } from "@/mocks/categorias";

export default function Favoritos() {
  const tema = useTema();
  const { usuario } = useSesion();
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(() => {
    if (!usuario) {
      setCargando(false);
      return;
    }
    setCargando(true);
    listarFavoritos(usuario.id)
      .then((favs) => obtenerLugaresPorIds(favs.map((f) => f.lugarId)))
      .then((resultado) => {
        setLugares(resultado);
        setCargando(false);
      });
  }, [usuario]);

  // Se recarga cada vez que la pantalla vuelve a estar en foco (no solo al
  // montarse): si sacás un favorito desde el Detalle y volvés acá, la lista
  // tiene que reflejarlo sin necesitar un pull-to-refresh manual.
  useFocusEffect(cargar);

  const categoriaPorId = new Map(categoriasSimuladas.map((c) => [c.id, c]));

  return (
    <SafeAreaView style={[styles.contenedor, { backgroundColor: tema.fondo }]} edges={["top"]}>
      <View style={styles.encabezado}>
        <Ionicons name="chevron-back" size={22} color={tema.textoPrincipal} onPress={() => router.back()} />
        <Text style={[styles.titulo, { color: tema.textoPrincipal }]}>Favoritos</Text>
      </View>

      {cargando ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={tema.primario} />
      ) : lugares.length === 0 ? (
        <View style={styles.vacio}>
          <Ionicons name="heart-outline" size={40} color={tema.textoSecundario} />
          <Text style={{ color: tema.textoSecundario, textAlign: "center", marginTop: 10 }}>
            Todavía no tenés lugares favoritos. Marcalos con el corazón desde el detalle de un
            lugar.
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.lista}
          data={lugares}
          keyExtractor={(l) => l.id}
          renderItem={({ item }) => (
            <TarjetaLugar
              lugar={item}
              categoria={categoriaPorId.get(item.categoriaId)}
              distanciaEnMetros={null}
              onPress={() => router.push({ pathname: "/lugar/[id]", params: { id: item.id } })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  encabezado: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  titulo: { fontSize: 20, fontWeight: "800" },
  lista: { padding: 20, paddingTop: 8 },
  vacio: { padding: 40, alignItems: "center", marginTop: 40 },
});
