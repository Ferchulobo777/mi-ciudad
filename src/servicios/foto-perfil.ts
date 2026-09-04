import * as ImagePicker from "expo-image-picker";
import { carpetaPrivada, copiarComoArchivoPrivado } from "./almacenamiento-archivos";

const carpetaAvatares = carpetaPrivada("avatares");

// allowsEditing + aspect [1,1] abre el recorte y zoom nativo del sistema
// operativo (el mismo editor que usa cualquier app para la foto de perfil),
// sin necesitar una librería de recorte propia.
const OPCIONES_EDICION: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
};

async function guardarComoAvatar(usuarioId: string, uriOrigen: string): Promise<string> {
  return copiarComoArchivoPrivado(carpetaAvatares, `${usuarioId}.jpg`, uriOrigen);
}

export async function elegirFotoDeGaleria(usuarioId: string): Promise<string | null> {
  const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted) return null;

  const resultado = await ImagePicker.launchImageLibraryAsync(OPCIONES_EDICION);
  if (resultado.canceled) return null;

  return guardarComoAvatar(usuarioId, resultado.assets[0].uri);
}

export async function sacarFotoDePerfil(usuarioId: string): Promise<string | null> {
  const permiso = await ImagePicker.requestCameraPermissionsAsync();
  if (!permiso.granted) return null;

  const resultado = await ImagePicker.launchCameraAsync(OPCIONES_EDICION);
  if (resultado.canceled) return null;

  return guardarComoAvatar(usuarioId, resultado.assets[0].uri);
}
