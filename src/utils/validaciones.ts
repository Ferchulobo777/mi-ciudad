// Funciones de validación puras, sin dependencias de React ni de la UI, para poder
// reutilizarlas entre el formulario de ingreso y el de registro y probarlas sueltas.

const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LARGO_MINIMO_CONTRASENA = 8;

export function esEmailValido(email: string): boolean {
  return PATRON_EMAIL.test(email.trim());
}

export function esContrasenaValida(contrasena: string): boolean {
  return contrasena.length >= LARGO_MINIMO_CONTRASENA;
}

export function esNombreValido(nombre: string): boolean {
  return nombre.trim().length >= 2;
}

export interface ErroresLogin {
  email?: string;
  contrasena?: string;
}

export function validarLogin(email: string, contrasena: string): ErroresLogin {
  const errores: ErroresLogin = {};
  if (!email.trim()) errores.email = "Ingresá tu correo electrónico.";
  else if (!esEmailValido(email)) errores.email = "Ese correo no parece válido.";

  if (!contrasena) errores.contrasena = "Ingresá tu contraseña.";
  else if (!esContrasenaValida(contrasena)) {
    errores.contrasena = `La contraseña tiene que tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres.`;
  }
  return errores;
}

export interface ErroresRegistro extends ErroresLogin {
  nombre?: string;
}

export function validarRegistro(nombre: string, email: string, contrasena: string): ErroresRegistro {
  const errores: ErroresRegistro = validarLogin(email, contrasena);
  if (!esNombreValido(nombre)) errores.nombre = "Ingresá tu nombre y apellido.";
  return errores;
}
