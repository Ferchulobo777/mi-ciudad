import type { AudioSource } from "expo-audio";
import type { Audioguia } from "@/tipos";

// Todavía no hay audioguías reales entregadas por el municipio: la única que
// existe en los datos simulados apunta a una URL de prueba que no resuelve.
// En vez de dejar el link roto, se sirve un audio propio empaquetado en la
// app. El día que la API real de la cátedra devuelva una URL de audio
// distinta, esta función la deja pasar sin cambios: la pantalla no necesita
// saber si el audio es local o remoto.
const URL_MOCK_MOLINO_FORCLAZ = "https://cdn.miciudad.app/audioguias/molino-forclaz.mp3";

export function resolverFuenteAudio(audioguia: Audioguia): AudioSource {
  if (audioguia.url === URL_MOCK_MOLINO_FORCLAZ) {
    return require("../../assets/audio/molino-forclaz.wav");
  }
  return { uri: audioguia.url };
}
