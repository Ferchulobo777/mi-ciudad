import { Directory, File, Paths } from "expo-file-system";

// Helper compartido para guardar una copia permanente de un archivo elegido
// con la cámara o la galería, en el almacenamiento privado de la app. Usa la
// API nueva de expo-file-system (File/Directory/Paths): la vieja tira error
// en tiempo de ejecución, según ya avisa la consigna de la cátedra.
export function carpetaPrivada(nombre: string): Directory {
  const carpeta = new Directory(Paths.document, nombre);
  if (!carpeta.exists) carpeta.create({ intermediates: true });
  return carpeta;
}

export async function copiarComoArchivoPrivado(
  carpeta: Directory,
  nombreArchivo: string,
  uriOrigen: string,
): Promise<string> {
  const destino = new File(carpeta, nombreArchivo);
  if (destino.exists) destino.delete();
  const origen = new File(uriOrigen);
  await origen.copy(destino);
  return destino.uri;
}
