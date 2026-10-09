import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useTema } from "@/hooks/use-tema";
import type { EstadoUbicacion } from "@/hooks/use-ubicacion";

interface Props {
  estado: EstadoUbicacion;
  puedePreguntarDeNuevo: boolean;
  alPedir: () => void;
}

// La explicación propia que la teoría pide mostrar antes del cartel del
// sistema. Si el turista ya negó el permiso, no se lo vuelve a molestar con
// el cartel: se le dice cómo sigue funcionando la app y, si quiere, cómo
// habilitarlo desde Ajustes.
export function AvisoUbicacion({ estado, puedePreguntarDeNuevo, alPedir }: Props) {
  const tema = useTema();
  if (estado === "resolviendo" || estado === "concedida") return null;

  const sinPreguntar = estado === "sin-preguntar";
  const texto = sinPreguntar
    ? "Activá tu ubicación para ver qué tenés cerca y hacia dónde queda cada lugar."
    : "Sin tu ubicación, las distancias se calculan desde el centro de Colón.";
  let accion = "Volver a intentar";
  if (sinPreguntar) accion = "Usar mi ubicación";
  else if (!puedePreguntarDeNuevo) accion = "Abrir ajustes";

  return (
    <View style={[styles.tarjeta, { backgroundColor: `${tema.primario}14`, borderColor: `${tema.primario}40` }]}>
      <Ionicons name="location-outline" size={22} color={tema.primario} />
      <Text style={[styles.texto, { color: tema.textoPrincipal }]}>{texto}</Text>
      <Pressable onPress={alPedir} accessibilityRole="button" hitSlop={8} style={styles.boton}>
        <Text style={[styles.accion, { color: tema.primario }]}>{accion}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 14, padding: 14, marginHorizontal: 20, marginBottom: 14 },
  texto: { flex: 1, fontSize: 14, lineHeight: 20 },
  boton: { minHeight: 44, justifyContent: "center" },
  accion: { fontSize: 14, fontWeight: "800" },
});
