import { useState } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { Categoria } from "@/tipos";

interface Props {
  categoria: Categoria | undefined;
  /** Primera imagen del lugar según la API; puede no haber ninguna. */
  uri?: string | null;
  tamañoIcono: number;
  style?: StyleProp<ViewStyle>;
}

// La foto viene de la API (lugar.imagenes). Debajo siempre se dibuja un
// degradé con el ícono de la categoría: es lo que se ve si el lugar no tiene
// imágenes, mientras la foto carga, o si falla la descarga sin señal.
// expo-image guarda las fotos en disco, así que una vez vistas siguen
// apareciendo sin conexión.
export function ImagenLugar({ categoria, uri, tamañoIcono, style }: Props) {
  const color = categoria?.color ?? "#5C6B6E";
  const [fallo, setFallo] = useState(false);

  return (
    <View style={[styles.contenedor, style]}>
      <LinearGradient
        colors={[color, oscurecer(color, 0.35)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.centro]}
      >
        <Ionicons name={(categoria?.icono ?? "image-outline") as never} size={tamañoIcono} color="rgba(255,255,255,0.9)" />
      </LinearGradient>
      {uri && !fallo && (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          onError={() => setFallo(true)}
          accessibilityIgnoresInvertColors
        />
      )}
    </View>
  );
}

function oscurecer(hex: string, factor: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.round(((num >> 16) & 0xff) * (1 - factor));
  const g = Math.round(((num >> 8) & 0xff) * (1 - factor));
  const b = Math.round((num & 0xff) * (1 - factor));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

const styles = StyleSheet.create({
  contenedor: { overflow: "hidden" },
  centro: { alignItems: "center", justifyContent: "center" },
});
