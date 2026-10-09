import { FlatList, Pressable, StyleSheet, Text } from "react-native";
import type { Categoria } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { vibrarSeleccion } from "@/servicios/hapticos";

interface Props {
  categorias: Categoria[];
  seleccionada: string | null;
  alElegir: (categoriaId: string | null) => void;
}

export function ChipsCategorias({ categorias, seleccionada, alElegir }: Props) {
  const tema = useTema();

  function elegir(id: string | null) {
    vibrarSeleccion();
    alElegir(id);
  }

  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.fila}
      contentContainerStyle={styles.contenido}
      data={categorias}
      keyExtractor={(c) => c.id}
      ListHeaderComponent={
        <Chip etiqueta="Todos" activo={seleccionada === null} color={tema.primario} onPress={() => elegir(null)} />
      }
      renderItem={({ item }) => (
        <Chip
          etiqueta={item.nombre}
          activo={seleccionada === item.id}
          color={item.color}
          onPress={() => elegir(item.id === seleccionada ? null : item.id)}
        />
      )}
    />
  );
}

interface PropsChip {
  readonly etiqueta: string;
  readonly activo: boolean;
  readonly color: string;
  readonly onPress: () => void;
}

function Chip({ etiqueta, activo, color, onPress }: PropsChip) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      style={[styles.chip, { backgroundColor: activo ? color : `${color}22` }]}
    >
      <Text style={[styles.texto, { color: activo ? "#FFFFFF" : color }]}>{etiqueta}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: { flexGrow: 0 },
  contenido: { paddingHorizontal: 20, gap: 8, alignItems: "center" },
  // 44 de alto como mínimo: se usa al sol y con una mano (PRD).
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 100, justifyContent: "center" },
  texto: { fontSize: 14, fontWeight: "700" },
});
