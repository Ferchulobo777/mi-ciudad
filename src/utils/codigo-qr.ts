// Formato de los carteles que va a reimprimir la Dirección de Turismo, tal
// como aparece en el ejemplo del PRD: "COLON:<id del lugar>". El prefijo
// permite distinguir nuestros códigos de cualquier otro QR que el turista
// tenga enfrente (un menú, una publicidad, los QR viejos de la consultora).
const PREFIJO = "COLON:";

export type ResultadoQr = { tipo: "lugar"; lugarId: string } | { tipo: "ajeno" };

export function interpretarCodigoQr(contenido: string): ResultadoQr {
  const texto = contenido.trim();
  if (!texto.toUpperCase().startsWith(PREFIJO)) return { tipo: "ajeno" };

  const lugarId = texto.slice(PREFIJO.length).trim();
  // Un id válido no tiene espacios ni barras: si el contenido viene roto o
  // cortado, se lo trata como ajeno en vez de buscar un lugar que no existe.
  if (!/^[\w-]+$/.test(lugarId)) return { tipo: "ajeno" };
  return { tipo: "lugar", lugarId };
}

export function codigoQrDeLugar(lugarId: string): string {
  return `${PREFIJO}${lugarId}`;
}
