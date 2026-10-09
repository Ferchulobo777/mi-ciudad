import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useTema } from "@/hooks/use-tema";
import { Boton } from "@/components/boton";

interface Props {
  mensaje: string;
  alReintentar: () => void;
}

// Estado de error visible con una salida concreta: la consigna pide que la
// carga, el vacío y el error se vean, y una pantalla en blanco no le dice al
// turista qué hacer.
export function EstadoError({ mensaje, alReintentar }: Props) {
  const tema = useTema();
  return (
    <View style={styles.contenedor} accessibilityLiveRegion="polite">
      <Ionicons name="cloud-offline-outline" size={40} color={tema.textoSecundario} />
      <Text style={[styles.texto, { color: tema.textoSecundario }]}>{mensaje}</Text>
      <Boton etiqueta="Reintentar" variante="secundario" onPress={alReintentar} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { padding: 32, alignItems: "stretch", gap: 14 },
  texto: { fontSize: 15, textAlign: "center", lineHeight: 22 },
});
