import { useColorScheme } from "react-native";
import { Colores } from "@/constants/tema";
import { useSesion } from "@/hooks/use-sesion";

// El PRD pide respetar el modo oscuro del sistema operativo (RNF05) como
// comportamiento por defecto, pero también permite elegirlo a mano desde el
// perfil (RF04): "sistema" sigue al dispositivo, "claro"/"oscuro" lo pisan.
export function useTema() {
  const esquemaDelSistema = useColorScheme();
  const { temaPreferencia } = useSesion();

  let esquemaEfectivo = esquemaDelSistema;
  if (temaPreferencia === "oscuro") esquemaEfectivo = "dark";
  else if (temaPreferencia === "claro") esquemaEfectivo = "light";

  return Colores[esquemaEfectivo === "dark" ? "oscuro" : "claro"];
}
