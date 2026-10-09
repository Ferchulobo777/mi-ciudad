import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { Categoria, Lugar } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { ImagenLugar } from "@/components/imagen-lugar";
import { describirHorario } from "@/utils/horarios";
import { formatearDistancia } from "@/utils/geo";
import { formatearPrecio } from "@/utils/formato";

export const ALTO_TARJETA_LUGAR = 80;

interface Props {
  lugar: Lugar;
  categoria: Categoria | undefined;
  distanciaEnMetros: number | null;
  onPress: () => void;
  /** Si se pasa, la tarjeta muestra el corazón para marcar o desmarcar el favorito sin entrar al detalle. */
  esFavorito?: boolean;
  alTocarFavorito?: () => void;
}

export function TarjetaLugar({ lugar, categoria, distanciaEnMetros, onPress, esFavorito, alTocarFavorito }: Props) {
  const tema = useTema();
  const horario = describirHorario(lugar);
  const cerrado = horario.estado === "cerrado";

  const detalle = [
    categoria?.nombre ?? "Sin categoría",
    horario.estado === "abierto" ? "Abierto ahora" : cerrado ? "Cerrado" : null,
    formatearPrecio(lugar.precioEntrada) === "Gratis" ? "Gratis" : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const distancia = distanciaEnMetros === null ? null : formatearDistancia(distanciaEnMetros);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[lugar.nombre, detalle, distancia ? `a ${distancia}` : null].filter(Boolean).join(", ")}
      style={({ pressed }) => [
        styles.tarjeta,
        { backgroundColor: tema.superficie, minHeight: ALTO_TARJETA_LUGAR },
        // Atenuado, como en el mockup: sigue disponible para ver el detalle y
        // cuándo abre, pero no compite con lo que está abierto.
        cerrado && { opacity: 0.6 },
        pressed && { opacity: 0.8 },
      ]}
    >
      <ImagenLugar categoria={categoria} tamañoIcono={20} style={styles.miniatura} />
      <View style={styles.info}>
        <Text style={[styles.nombre, { color: tema.textoPrincipal }]} numberOfLines={1}>
          {lugar.nombre}
        </Text>
        <Text
          style={[styles.subtitulo, { color: horario.estado === "abierto" ? tema.exito : tema.textoSecundario }]}
          numberOfLines={1}
        >
          {detalle}
        </Text>
      </View>
      {distancia && <Text style={[styles.distancia, { color: tema.primario }]}>{distancia}</Text>}
      {alTocarFavorito && (
        <Pressable
          onPress={alTocarFavorito}
          accessibilityRole="button"
          accessibilityLabel={esFavorito ? `Quitar ${lugar.nombre} de favoritos` : `Agregar ${lugar.nombre} a favoritos`}
          hitSlop={8}
          style={styles.corazon}
        >
          <Ionicons name={esFavorito ? "heart" : "heart-outline"} size={22} color={esFavorito ? tema.acento : tema.textoSecundario} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 12, marginBottom: 10 },
  miniatura: { width: 48, height: 48, borderRadius: 12, flexShrink: 0 },
  info: { flex: 1 },
  nombre: { fontSize: 16, fontWeight: "700" },
  subtitulo: { fontSize: 14, marginTop: 2 },
  distancia: { fontSize: 14, fontWeight: "800" },
  corazon: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginRight: -6 },
});
