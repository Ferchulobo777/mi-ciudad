import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { Audioguia } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { resolverFuenteAudio } from "@/servicios/audioguia";

const NOMBRE_IDIOMA: Record<Audioguia["idioma"], string> = {
  es: "Español",
  en: "English",
  pt: "Português",
};

function formatearTiempo(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const resto = Math.floor(segundos % 60);
  return `${minutos}:${resto.toString().padStart(2, "0")}`;
}

interface Props {
  audioguia: Audioguia;
}

export function ReproductorAudioguia({ audioguia }: Props) {
  const tema = useTema();
  const fuente = resolverFuenteAudio(audioguia);
  const reproductor = useAudioPlayer(fuente);
  const estado = useAudioPlayerStatus(reproductor);

  // Si el turista sale de la pantalla de detalle con el audio sonando, no
  // tiene sentido que siga de fondo: se pausa al desmontar.
  useEffect(() => {
    return () => reproductor.pause();
  }, [reproductor]);

  function alternarReproduccion() {
    if (estado.didJustFinish || estado.currentTime >= estado.duration) {
      reproductor.seekTo(0);
    }
    if (estado.playing) reproductor.pause();
    else reproductor.play();
  }

  const duracionTotal = estado.duration || audioguia.duracionSegundos;
  const progreso = duracionTotal > 0 ? Math.min(estado.currentTime / duracionTotal, 1) : 0;

  return (
    <View style={[styles.contenedor, { backgroundColor: tema.superficie, borderColor: tema.borde }]}>
      <Pressable
        onPress={alternarReproduccion}
        accessibilityRole="button"
        accessibilityLabel={estado.playing ? "Pausar audioguía" : "Reproducir audioguía"}
        style={[styles.botonPlay, { backgroundColor: tema.primario }]}
      >
        <Ionicons name={estado.playing ? "pause" : "play"} size={20} color="#FFFFFF" />
      </Pressable>

      <View style={styles.info}>
        <View style={styles.filaTitulo}>
          <Text style={[styles.titulo, { color: tema.textoPrincipal }]}>Audioguía</Text>
          <Text style={[styles.chipIdioma, { color: tema.textoSecundario, borderColor: tema.borde }]}>
            {NOMBRE_IDIOMA[audioguia.idioma]}
          </Text>
        </View>
        <View style={[styles.barraFondo, { backgroundColor: tema.borde }]}>
          <View style={[styles.barraProgreso, { backgroundColor: tema.primario, width: `${progreso * 100}%` }]} />
        </View>
        <Text style={[styles.tiempo, { color: tema.textoSecundario }]}>
          {formatearTiempo(estado.currentTime)} / {formatearTiempo(duracionTotal)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  botonPlay: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  info: { flex: 1 },
  filaTitulo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  titulo: { fontSize: 14, fontWeight: "700" },
  chipIdioma: { fontSize: 11, fontWeight: "600", borderWidth: 1, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2 },
  barraFondo: { height: 4, borderRadius: 2, overflow: "hidden" },
  barraProgreso: { height: 4, borderRadius: 2 },
  tiempo: { fontSize: 11, marginTop: 6 },
});
