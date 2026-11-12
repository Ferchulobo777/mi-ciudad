import { Directory, File, Paths } from "expo-file-system";
import { setAudioModeAsync, type AudioSource } from "expo-audio";
import type { Audioguia } from "@/tipos";

// Los datos de prueba (src/mocks) traen una audioguía con una URL que no
// resuelve. En vez de dejar el link roto, esa URL puntual se reemplaza por un
// audio propio empaquetado en la app. Las audioguías que manda la API se tratan
// como cualquier audio remoto: se reproducen desde la red o desde la copia
// descargada.
const URL_MOCK_MOLINO_FORCLAZ = "https://cdn.miciudad.app/audioguias/molino-forclaz.mp3";

// Las audioguías descargadas van a la caché y no a documentos: es contenido
// que se puede volver a bajar, y la teoría de la Unidad 4 es explícita en que
// guardar eso en documentos es motivo de rechazo en la App Store. Si el
// sistema vacía la caché por falta de espacio, la pantalla vuelve a ofrecer
// la descarga.
function carpetaAudioguias(): Directory {
  const carpeta = new Directory(Paths.cache, "audioguias");
  if (!carpeta.exists) carpeta.create({ intermediates: true });
  return carpeta;
}

export function nombreDeArchivoLocal(url: string): string {
  const sinProtocolo = url.replace(/^https?:\/\//, "");
  return sinProtocolo.replace(/[^\w.-]/g, "_").slice(-120);
}

function archivoLocal(audioguia: Audioguia): File {
  return new File(carpetaAudioguias(), nombreDeArchivoLocal(audioguia.url));
}

export function vieneIncluidaEnLaApp(audioguia: Audioguia): boolean {
  return audioguia.url === URL_MOCK_MOLINO_FORCLAZ;
}

export function estaDisponibleSinConexion(audioguia: Audioguia): boolean {
  return vieneIncluidaEnLaApp(audioguia) || archivoLocal(audioguia).exists;
}

export function resolverFuenteAudio(audioguia: Audioguia): AudioSource {
  if (vieneIncluidaEnLaApp(audioguia)) {
    return require("../../assets/audio/molino-forclaz.wav");
  }
  const local = archivoLocal(audioguia);
  return { uri: local.exists ? local.uri : audioguia.url };
}

/** Baja la audioguía para escucharla sin señal (pensado para El Palmar). */
export async function descargarAudioguia(audioguia: Audioguia): Promise<void> {
  await File.downloadFileAsync(audioguia.url, archivoLocal(audioguia), { idempotent: true });
}

let modoConfigurado = false;

// El PRD pide que la audioguía siga sonando con el celular en el bolsillo y
// la pantalla apagada: eso es shouldPlayInBackground (más el permiso de
// segundo plano que agrega el config plugin de expo-audio en app.json).
// doNotMix pausa la música de otras apps mientras habla la guía, y es además
// lo que exige expo-audio para mostrar los controles en la pantalla bloqueada.
export async function prepararModoDeAudio(): Promise<void> {
  if (modoConfigurado) return;
  modoConfigurado = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    });
  } catch {
    modoConfigurado = false;
  }
}
