import type { Categoria } from "@/tipos";

// Mismos siete colores documentados en el punto 6 de Documentación Oficial del
// Proyecto (paleta de categorías del catálogo).
export const categoriasSimuladas: Categoria[] = [
  { id: "cat-playas", nombre: "Playas", icono: "sunny-outline", color: "#3AA0C4", orden: 1 },
  { id: "cat-termas", nombre: "Termas", icono: "water-outline", color: "#2E9E8F", orden: 2 },
  { id: "cat-museos", nombre: "Museos y patrimonio", icono: "business-outline", color: "#8E5A4A", orden: 3 },
  { id: "cat-gastronomia", nombre: "Gastronomía", icono: "restaurant-outline", color: "#D9822B", orden: 4 },
  { id: "cat-artesanias", nombre: "Artesanías", icono: "color-palette-outline", color: "#8B5FA3", orden: 5 },
  { id: "cat-naturaleza", nombre: "Naturaleza", icono: "leaf-outline", color: "#3F7D45", orden: 6 },
  { id: "cat-alojamiento", nombre: "Alojamiento", icono: "bed-outline", color: "#3B5BA5", orden: 7 },
];
