import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { Audioguia } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import {
  descargarAudioguia,
  estaDisponibleSinConexion,
  prepararModoDeAudio,
  resolverFuenteAudio,
  vieneIncluidaEnLaApp,
} from "@/servicios/audioguia";

const SALTO_SEGUNDOS = 15;

function formatearTiempo(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, "0")}`;
}

interface Props {
  audioguia: Audioguia;
  /** Nombre del lugar: es lo que se ve en la pantalla bloqueada. */
  titulo: string;
}

export function ReproductorAudioguia({ audioguia, titulo }: Props) {
  const tema = useTema();
  const [sinConexion, setSinConexion] = useState(() => estaDisponibleSinConexion(audioguia));
  const [descargando, setDescargando] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState(false);
  // La fuente se recalcula cuando termina la descarga: useAudioPlayer compara
  // la fuente por contenido y arma un reproductor nuevo que lee el archivo
  // local en vez de la red.
  const fuente = useMemo(() => resolverFuenteAudio(audioguia), [audioguia, sinConexion]); // eslint-disable-line react-hooks/exhaustive-deps
  const reproductor = useAudioPlayer(fuente);
  const estado = useAudioPlayerStatus(reproductor);

  const duracionTotal = estado.duration || audioguia.duracionSegundos;
  const progreso = duracionTotal > 0 ? Math.min(estado.currentTime / duracionTotal, 1) : 0;
  const restante = duracionTotal - estado.currentTime;

  useEffect(() => {
    prepararModoDeAudio();
  }, []);

  // Al salir del detalle se pausa y se sacan los controles de la pantalla
  // bloqueada. expo-audio libera el reproductor nativo por su cuenta al
  // desmontar, y a veces eso pasa antes que este cleanup: llamar a un
  // reproductor ya liberado tira abajo la app entera, por eso el try/catch.
  useEffect(() => {
    return () => {
      try {
        reproductor.pause();
        reproductor.clearLockScreenControls();
      } catch {
        // El reproductor ya fue liberado, no hay nada que pausar.
      }
    };
  }, [reproductor]);

  function alternarReproduccion() {
    if (estado.didJustFinish || (estado.duration > 0 && estado.currentTime >= estado.duration)) {
      reproductor.seekTo(0);
    }
    if (estado.playing) {
      reproductor.pause();
      return;
    }
    // Con la pantalla bloqueada el turista ve qué está sonando y puede
    // pausarlo sin desbloquear; en Android, además, es lo que evita que el
    // sistema corte el audio en segundo plano a los pocos minutos.
    reproductor.setActiveForLockScreen(true, { title: titulo, artist: "Audioguía · Mi Ciudad" });
    reproductor.play();
  }

  function saltar(segundos: number) {
    const destino = Math.min(Math.max(estado.currentTime + segundos, 0), duracionTotal);
    reproductor.seekTo(destino);
  }

  async function descargar() {
    setDescargando(true);
    setErrorDescarga(false);
    try {
      await descargarAudioguia(audioguia);
      setSinConexion(true);
    } catch {
      setErrorDescarga(true);
    } finally {
      setDescargando(false);
    }
  }

  return (
    <View style={[styles.contenedor, { backgroundColor: tema.superficie, borderColor: tema.borde }]}>
      <View style={styles.filaTitulo}>
        <Text style={[styles.titulo, { color: tema.textoPrincipal }]}>Audioguía · {formatearTiempo(duracionTotal)}</Text>
        {sinConexion && (
          <View style={styles.etiquetaOffline}>
            <Ionicons name="checkmark-circle" size={16} color={tema.exito} />
            <Text style={[styles.textoChico, { color: tema.exito }]}>Disponible sin señal</Text>
          </View>
        )}
      </View>

      <View
        style={[styles.barraFondo, { backgroundColor: tema.borde }]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: Math.round(duracionTotal), now: Math.round(estado.currentTime) }}
      >
        <View style={[styles.barraProgreso, { backgroundColor: tema.primario, width: `${progreso * 100}%` }]} />
      </View>
      <View style={styles.filaTiempos}>
        <Text style={[styles.textoChico, { color: tema.textoSecundario }]}>{formatearTiempo(estado.currentTime)}</Text>
        <Text style={[styles.textoChico, { color: tema.textoSecundario }]}>faltan {formatearTiempo(restante)}</Text>
      </View>

      <View style={styles.controles}>
        <BotonControl
          icono="play-back"
          etiqueta={`Retroceder ${SALTO_SEGUNDOS} segundos`}
          color={tema.primario}
          onPress={() => saltar(-SALTO_SEGUNDOS)}
        />
        <Pressable
          onPress={alternarReproduccion}
          accessibilityRole="button"
          accessibilityLabel={estado.playing ? "Pausar audioguía" : "Reproducir audioguía"}
          style={[styles.botonPlay, { backgroundColor: tema.primario }]}
        >
          {estado.isBuffering && !estado.playing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Ionicons name={estado.playing ? "pause" : "play"} size={28} color="#FFFFFF" />
          )}
        </Pressable>
        <BotonControl
          icono="play-forward"
          etiqueta={`Adelantar ${SALTO_SEGUNDOS} segundos`}
          color={tema.primario}
          onPress={() => saltar(SALTO_SEGUNDOS)}
        />
      </View>

      {!sinConexion && !vieneIncluidaEnLaApp(audioguia) && (
        <Pressable onPress={descargar} disabled={descargando} accessibilityRole="button" style={styles.descarga}>
          {descargando ? (
            <ActivityIndicator color={tema.primario} />
          ) : (
            <Ionicons name="download-outline" size={18} color={tema.primario} />
          )}
          <Text style={[styles.textoDescarga, { color: errorDescarga ? tema.error : tema.primario }]}>
            {errorDescarga ? "No se pudo descargar. Probá de nuevo con señal." : "Descargar para escuchar sin señal"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

interface PropsControl {
  readonly icono: "play-back" | "play-forward";
  readonly etiqueta: string;
  readonly color: string;
  readonly onPress: () => void;
}

function BotonControl({ icono, etiqueta, color, onPress }: PropsControl) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={etiqueta} hitSlop={8} style={styles.botonSalto}>
      <Ionicons name={icono} size={22} color={color} />
      <Text style={[styles.textoChico, { color }]}>15 s</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenedor: { padding: 16, borderRadius: 16, borderWidth: 1 },
  filaTitulo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  titulo: { fontSize: 16, fontWeight: "800" },
  etiquetaOffline: { flexDirection: "row", alignItems: "center", gap: 4 },
  barraFondo: { height: 6, borderRadius: 3, overflow: "hidden" },
  barraProgreso: { height: 6, borderRadius: 3 },
  filaTiempos: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  textoChico: { fontSize: 13, fontWeight: "600" },
  controles: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 28, marginTop: 10 },
  botonPlay: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  botonSalto: { alignItems: "center", minWidth: 48, minHeight: 48, justifyContent: "center" },
  descarga: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, minHeight: 44 },
  textoDescarga: { fontSize: 14, fontWeight: "700" },
});
