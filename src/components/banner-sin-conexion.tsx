import { StyleSheet, Text, View } from "react-native";
import { useHayConexion } from "@/hooks/use-conexion";
import { Ionicons } from "@react-native-vector-icons/ionicons";

// useNetworkState (adentro de useHayConexion) ya es reactivo: no hace falta
// un useEffect propio para escuchar cambios de conectividad.
export function BannerSinConexion() {
  const hayConexion = useHayConexion();
  if (hayConexion !== false) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={14} color="#FFFFFF" />
      <Text style={styles.texto}>Sin conexión · mostrando datos guardados</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#3A4450",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  texto: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
});
