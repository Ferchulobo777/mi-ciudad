import type { Evento } from "@/tipos";

// Las fechas se calculan relativas a "ahora" (no quedan fijas en un mes que va
// a quedar viejo) para que guardar un evento con recordatorio siempre tenga
// una fecha futura de verdad, sin importar cuándo se prueba la aplicación.
function enHoras(horas: number): string {
  return new Date(Date.now() + horas * 60 * 60 * 1000).toISOString();
}

export const eventosSimulados: Evento[] = [
  {
    id: "evento-feria-artesanos",
    titulo: "Feria de artesanos costaneros",
    descripcion:
      "Puestos de artesanos locales sobre la costanera, con música en vivo y feria de comidas. " +
      "Actividad al aire libre, apta para toda la familia.",
    lugarId: null,
    direccionLibre: "Costanera Sur, frente al muelle",
    coordenadas: { latitud: -32.2095, longitud: -58.1409 },
    inicio: enHoras(3),
    fin: enHoras(6),
    imagenUrl: null,
    precio: 0,
    estado: "programado",
  },
  {
    id: "evento-cine-estrellas",
    titulo: "Cine bajo las estrellas",
    descripcion: "Proyección al aire libre en la costanera. Se suspende si llueve.",
    lugarId: null,
    direccionLibre: "Anfiteatro de la Costanera",
    coordenadas: { latitud: -32.2101, longitud: -58.1421 },
    inicio: enHoras(5),
    fin: enHoras(7),
    imagenUrl: null,
    precio: 0,
    estado: "suspendido",
  },
  {
    id: "evento-bici-costanera",
    titulo: "Bici por la costanera",
    descripcion: "Salida grupal en bicicleta con guía, apta para toda la familia. Se recorren unos ocho kilómetros.",
    lugarId: "lugar-termas-colon",
    direccionLibre: null,
    coordenadas: null,
    inicio: enHoras(30),
    fin: enHoras(32),
    imagenUrl: null,
    precio: 2000,
    estado: "programado",
  },
  {
    id: "evento-pena-pescadores",
    titulo: "Peña en el club de pescadores",
    descripcion: "Música folclórica en vivo y cena, en el club de pescadores sobre la costanera.",
    lugarId: null,
    direccionLibre: "Club de Pesca, Colón",
    coordenadas: { latitud: -32.2179, longitud: -58.1443 },
    inicio: enHoras(52),
    fin: enHoras(56),
    imagenUrl: null,
    precio: 3500,
    estado: "programado",
  },
];
