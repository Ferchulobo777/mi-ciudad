export function formatearHora(fecha: Date): string {
  return fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function esMismoDia(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function formatearEncabezadoDeDia(fecha: Date, ahora = new Date()): string {
  const mañana = new Date(ahora);
  mañana.setDate(ahora.getDate() + 1);

  if (esMismoDia(fecha, ahora)) return "Hoy";
  if (esMismoDia(fecha, mañana)) return "Mañana";
  return fecha.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
}
