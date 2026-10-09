import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { Lugar } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { useSesion } from "@/hooks/use-sesion";
import { useCategorias } from "@/hooks/use-categorias";
import { useUbicacion } from "@/hooks/use-ubicacion";
import { TarjetaLugar } from "@/components/tarjeta-lugar";
import { Encabezado } from "@/components/encabezado";
import { alternarFavorito, listarFavoritos } from "@/servicios/favoritos";
import { obtenerLugaresPorIds } from "@/servicios/lugares";
import { distanciaEnMetros } from "@/utils/geo";

export default function Favoritos() {
  const tema = useTema();
  const { usuario } = useSesion();
  const { porId: categoriaPorId } = useCategorias();
  const { posicion } = useUbicacion();
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [cargando, setCargando] = useState(true);

  // Se recarga cada vez que la pantalla vuelve a estar en foco (no solo al
  // montarse): si se saca un favorito desde el detalle y se vuelve acá, la
  // lista tiene que reflejarlo sin un pull-to-refresh manual.
  useFocusEffect(
    useCallback(() => {
      if (!usuario) {
        setCargando(false);
        return;
      }
      listarFavoritos(usuario.id)
        .then((favoritos) => obtenerLugaresPorIds(favoritos.map((f) => f.lugarId)))
        .then(setLugares)
        .catch(() => setLugares([]))
        .finally(() => setCargando(false));
    }, [usuario]),
  );

  async function quitarFavorito(lugarId: string) {
    if (!usuario) return;
    await alternarFavorito(usuario.id, lugarId);
    setLugares((anteriores) => anteriores.filter((l) => l.id !== lugarId));
  }

  return (
    <SafeAreaView style={[styles.contenedor, { backgroundColor: tema.fondo }]} edges={["top"]}>
      <Encabezado titulo="Favoritos" />

      {cargando ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={tema.primario} />
      ) : (
        <FlatList
          contentContainerStyle={styles.lista}
          data={lugares}
          keyExtractor={(l) => l.id}
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Ionicons name="heart-outline" size={44} color={tema.textoSecundario} />
              <Text style={[styles.textoVacio, { color: tema.textoSecundario }]}>
                Todavía no tenés lugares favoritos. Marcalos con el corazón desde el catálogo o desde el detalle de un lugar.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TarjetaLugar
              lugar={item}
              categoria={categoriaPorId.get(item.categoriaId)}
              distanciaEnMetros={posicion ? distanciaEnMetros(posicion, item.coordenadas) : null}
              onPress={() => router.push({ pathname: "/lugar/[id]", params: { id: item.id } })}
              esFavorito
              alTocarFavorito={() => quitarFavorito(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  lista: { padding: 20, paddingTop: 4 },
  vacio: { padding: 32, alignItems: "center", marginTop: 30, gap: 10 },
  textoVacio: { fontSize: 15, textAlign: "center", lineHeight: 22 },
});
