// Convención del contrato de datos: 0 es gratis y null es "no aplica" (por
// ejemplo, una playa pública no tiene entrada que cobrar). Son dos casos
// distintos y no se pueden mostrar igual: null no dice nada.
export function formatearPrecio(precio: number | null): string | null {
  if (precio === null) return null;
  if (precio === 0) return "Gratis";
  return `$${precio.toLocaleString("es-AR")}`;
}
