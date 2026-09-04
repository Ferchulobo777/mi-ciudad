import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Categoria, Lugar } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { estaAbiertoAhora, formatearDistancia } from "@/servicios/lugares";
import { ImagenLugar } from "@/components/imagen-lugar";

export const ALTO_TARJETA_LUGAR = 76;

interface Props {
  lugar: Lugar;
  categoria: Categoria | undefined;
  distanciaEnMetros: number | null;
  onPress: () => void;
}

export function TarjetaLugar({ lugar, categoria, distanciaEnMetros, onPress }: Props) {
  const tema = useTema();
  const abierto = estaAbiertoAhora(lugar);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.tarjeta,
        { backgroundColor: tema.superficie, height: ALTO_TARJETA_LUGAR },
        pressed && { opacity: 0.85 },
      ]}
    >
      <ImagenLugar categoria={categoria} tamañoIcono={18} style={styles.miniatura} />
      <View style={styles.info}>
        <Text style={[styles.nombre, { color: tema.textoPrincipal }]} numberOfLines={1}>
          {lugar.nombre}
        </Text>
        <Text style={[styles.subtitulo, { color: abierto ? tema.exito : tema.textoSecundario }]} numberOfLines={1}>
          {categoria?.nombre ?? "Sin categoría"}
          {abierto ? " · Abierto ahora" : ""}
        </Text>
      </View>
      {distanciaEnMetros !== null && (
        <Text style={[styles.distancia, { color: tema.primario }]}>{formatearDistancia(distanciaEnMetros)}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 12, marginBottom: 10 },
  miniatura: { width: 44, height: 44, borderRadius: 10, flexShrink: 0 },
  info: { flex: 1 },
  nombre: { fontSize: 14, fontWeight: "700" },
  subtitulo: { fontSize: 12, marginTop: 2 },
  distancia: { fontSize: 12, fontWeight: "700" },
});
