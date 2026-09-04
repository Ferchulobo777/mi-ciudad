// Paleta Costa Entrerriana, ya elegida y documentada en el punto 6 de
// "Documentación Oficial del Proyecto". En modo oscuro se mantiene el mismo azul
// primario que en modo claro: la variante "Azul Río Profundo" del documento es
// bastante oscura y pierde contraste contra un fondo casi negro, así que acá se
// usa solo como texto de referencia, no como color interactivo.

export const Colores = {
  claro: {
    primario: "#0B6E8C",
    secundario: "#3F7D45",
    acento: "#D96C3F",
    exito: "#3F8F5B",
    advertencia: "#C9962C",
    error: "#C24C4C",
    fondo: "#FBF7F0",
    superficie: "#FFFFFF",
    textoPrincipal: "#1F2A2E",
    textoSecundario: "#5C6B6E",
    borde: "#E4DDD0",
  },
  oscuro: {
    primario: "#0B6E8C",
    secundario: "#3F7D45",
    acento: "#D96C3F",
    exito: "#3F8F5B",
    advertencia: "#C9962C",
    error: "#C24C4C",
    fondo: "#10181A",
    superficie: "#17262A",
    textoPrincipal: "#EDEDE7",
    textoSecundario: "#A9B4B6",
    borde: "#25363A",
  },
} as const;

export type EsquemaColor = keyof typeof Colores;
export type ColorDeTema = keyof typeof Colores.claro;
