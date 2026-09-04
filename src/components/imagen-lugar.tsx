import { StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { Categoria } from "@/tipos";

interface Props {
  categoria: Categoria | undefined;
  tamañoIcono: number;
  style?: StyleProp<ViewStyle>;
}

// Todavía no hay fotos reales de los lugares (el cliente no las mandó y no
// corresponde inventar fotos de sitios que existen de verdad). Mientras
// tanto, en vez de un bloque de color plano, se arma un degradé con el
// ícono de la categoría, usando los mismos datos que ya define el catálogo.
export function ImagenLugar({ categoria, tamañoIcono, style }: Props) {
  const color = categoria?.color ?? "#5C6B6E";

  return (
    <LinearGradient
      colors={[color, oscurecer(color, 0.35)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ alignItems: "center", justifyContent: "center" }, style]}
    >
      <Ionicons name={(categoria?.icono ?? "image-outline") as never} size={tamañoIcono} color="rgba(255,255,255,0.9)" />
    </LinearGradient>
  );
}

function oscurecer(hex: string, factor: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.round(((num >> 16) & 0xff) * (1 - factor));
  const g = Math.round(((num >> 8) & 0xff) * (1 - factor));
  const b = Math.round((num & 0xff) * (1 - factor));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
