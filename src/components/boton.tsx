import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { useTema } from "@/hooks/use-tema";

type Variante = "primario" | "secundario" | "texto";

interface Props {
  etiqueta: string;
  onPress: () => void;
  variante?: Variante;
  cargando?: boolean;
  deshabilitado?: boolean;
}

export function Boton({ etiqueta, onPress, variante = "primario", cargando, deshabilitado }: Props) {
  const tema = useTema();
  const inactivo = cargando || deshabilitado;

  const fondos: Record<Variante, string> = {
    primario: tema.primario,
    secundario: tema.superficie,
    texto: "transparent",
  };
  const textos: Record<Variante, string> = {
    primario: "#FFFFFF",
    secundario: tema.textoPrincipal,
    texto: tema.primario,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      style={({ pressed }) => [
        styles.base,
        variante !== "texto" && { backgroundColor: fondos[variante] },
        variante === "secundario" && { borderWidth: 1.5, borderColor: tema.borde },
        pressed && !inactivo && styles.presionado,
        inactivo && styles.deshabilitado,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={textos[variante]} />
      ) : (
        <Text style={[styles.texto, { color: textos[variante] }]}>{etiqueta}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  texto: { fontSize: 15, fontWeight: "700" },
  presionado: { opacity: 0.85 },
  deshabilitado: { opacity: 0.5 },
});
