import { StyleSheet, Text, View } from "react-native";
import { useNetworkState } from "expo-network";
import { Ionicons } from "@react-native-vector-icons/ionicons";

// useNetworkState ya es reactivo: no hace falta un useEffect propio para
// escuchar cambios de conectividad, el hook se vuelve a renderizar solo.
export function BannerSinConexion() {
  const red = useNetworkState();

  // Mientras el estado inicial todavía no se resolvió (undefined) no se
  // muestra nada, para no prender el aviso en falso apenas abre la app.
  if (red.isConnected === undefined) return null;
  if (red.isConnected && red.isInternetReachable !== false) return null;

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
