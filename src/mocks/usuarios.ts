import type { Usuario } from "@/tipos";

interface UsuarioSimulado {
  usuario: Usuario;
  contrasena: string;
}

// Un solo usuario de prueba para poder ingresar sin pasar antes por el registro.
// Se guarda en memoria: se pierde al reiniciar la app, hasta que exista la API real.
export const usuariosSimulados: UsuarioSimulado[] = [
  {
    contrasena: "colon2026",
    usuario: {
      id: "u1",
      nombre: "María Villalba",
      email: "maria.villalba@correo.com",
      avatarUrl: null,
      creadoEn: "2026-01-15T10:00:00-03:00",
      preferencias: {
        categoriasFavoritas: [],
        avisarProximidad: true,
        radioAvisoMetros: 250,
        tema: "sistema",
      },
    },
  },
];
