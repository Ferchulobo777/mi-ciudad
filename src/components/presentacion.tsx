import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Colores } from "@/constants/tema";

// Misma composición que Mockups-Propuestas/MiCiudad-Splash.dc.html: degradé
// Azul Río → Verde Palmar y un ícono de pin de ubicación. La curva de olas del
// mockup se resuelve acá con óvalos superpuestos en vez de un path de SVG:
// react-native-svg 15.15.4 tiene un archivo interno (fabric/FeCompositeNativeComponent)
// que Metro no logra resolver contra Expo SDK 57, así que se evita esa
// dependencia rota en vez de bloquear toda la app por un adorno visual.
export function Presentacion() {
  return (
    <LinearGradient
      colors={[Colores.claro.primario, Colores.claro.secundario]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.contenedor}
    >
      <View style={styles.olas} pointerEvents="none">
        <View style={[styles.ola, styles.olaUno]} />
        <View style={[styles.ola, styles.olaDos]} />
      </View>

      <View style={styles.icono}>
        <Ionicons name="location" size={46} color="#FFFFFF" />
      </View>

      <Text style={styles.titulo}>Mi Ciudad</Text>
      <Text style={styles.bajada}>Guía turística de Colón</Text>

      <View style={styles.puntos}>
        <View style={[styles.punto, styles.puntoActivo]} />
        <View style={styles.punto} />
        <View style={styles.punto} />
      </View>
      <Text style={styles.pie}>Dirección de Turismo · Municipalidad de Colón</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  olas: { position: "absolute", bottom: -140, left: "-20%", width: "140%" },
  ola: { position: "absolute", borderRadius: 999, backgroundColor: "#FBF7F0" },
  olaUno: { width: 500, height: 280, opacity: 0.14, left: -80, bottom: 40 },
  olaDos: { width: 420, height: 220, opacity: 0.1, right: -60, bottom: -20 },
  icono: {
    width: 96,
    height: 96,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  titulo: { fontSize: 30, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.3 },
  bajada: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.85)", marginTop: 6 },
  puntos: { position: "absolute", bottom: 60, flexDirection: "row", gap: 8 },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.4)" },
  puntoActivo: { backgroundColor: "#FFFFFF" },
  pie: { position: "absolute", bottom: 30, fontSize: 11, color: "rgba(255,255,255,0.6)" },
});
