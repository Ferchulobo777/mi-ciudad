import { useColorScheme } from "react-native";
import { Colores } from "@/constants/tema";

// El PRD pide respetar el modo oscuro del sistema operativo (RNF05), así que el
// esquema no se guarda como preferencia propia: se lee directo del dispositivo.
export function useTema() {
  const esquema = useColorScheme();
  return Colores[esquema === "dark" ? "oscuro" : "claro"];
}
