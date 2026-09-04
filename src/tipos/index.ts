// Interfaces escritas una sola vez a partir del contrato de datos en openapi.yaml.
// No se modifican cuando llegue la API real de la cátedra: es la capa de servicios
// la que va a cambiar, no los tipos.

export interface Coordenadas {
  latitud: number;
  longitud: number;
}

export interface Horario {
  /** 0 es domingo, igual que Date.getDay() en JavaScript. */
  dia: number;
  abre: string;
  cierra: string;
}

export interface Audioguia {
  url: string;
  duracionSegundos: number;
  idioma: "es" | "en" | "pt";
}

export interface Categoria {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  orden: number;
}

export interface Lugar {
  id: string;
  nombre: string;
  categoriaId: string;
  descripcionCorta: string;
  descripcion: string;
  coordenadas: Coordenadas;
  direccion: string;
  imagenes: string[];
  horarios: Horario[];
  telefono: string | null;
  sitioWeb: string | null;
  precioEntrada: number | null;
  audioguia: Audioguia | null;
  codigoQr: string | null;
  accesible: boolean;
  activo: boolean;
  actualizadoEn: string;
}

export type EstadoEvento = "programado" | "suspendido" | "cancelado" | "finalizado";

export interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  lugarId: string | null;
  direccionLibre: string | null;
  coordenadas: Coordenadas | null;
  inicio: string;
  fin: string | null;
  imagenUrl: string | null;
  precio: number | null;
  estado: EstadoEvento;
}

export interface Preferencias {
  categoriasFavoritas: string[];
  avisarProximidad: boolean;
  radioAvisoMetros: 100 | 250 | 500;
  tema: "claro" | "oscuro" | "sistema";
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  avatarUrl: string | null;
  creadoEn: string;
  preferencias: Preferencias;
}

export interface Favorito {
  id: string;
  usuarioId: string;
  lugarId: string;
  creadoEn: string;
}

export type OrigenVisita = "qr" | "gps" | "manual";

export interface NuevaVisita {
  lugarId: string;
  fechaHora: string;
  origen: OrigenVisita;
  fotoUri: string | null;
  nota: string | null;
}

export interface Visita extends NuevaVisita {
  id: string;
  usuarioId: string;
  /**
   * En false mientras la visita solo existe en el teléfono: se registra parada
   * frente al lugar, donde puede no haber señal, así que se guarda local primero
   * y se sube cuando vuelve la conexión.
   */
  sincronizada: boolean;
}

export interface RespuestaSesion {
  token: string;
  usuario: Usuario;
}
