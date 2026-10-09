import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useTema } from "@/hooks/use-tema";

interface Props {
  titulo: string;
  /** Elemento opcional a la derecha (un contador, un botón de acción). */
  derecha?: ReactNode;
}

// Las pantallas apiladas sobre las pestañas usan headerShown: false para
// poder dibujar su propio encabezado como en los mockups; al hacerlo hay que
// reponer a mano lo que daba el header del Stack: el botón de volver con su
// etiqueta para lectores de pantalla.
export function Encabezado({ titulo, derecha }: Props) {
  const tema = useTema();
  return (
    <View style={styles.fila}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Volver"
        hitSlop={12}
        style={styles.volver}
      >
        <Ionicons name="chevron-back" size={24} color={tema.textoPrincipal} />
      </Pressable>
      <Text style={[styles.titulo, { color: tema.textoPrincipal }]} accessibilityRole="header" numberOfLines={1}>
        {titulo}
      </Text>
      {derecha}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12 },
  volver: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  titulo: { flex: 1, fontSize: 22, fontWeight: "800" },
});
