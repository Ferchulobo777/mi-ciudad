import {
  iniciarSesion,
  reingresarConBiometria,
  registrarCuenta,
  obtenerUsuarioActual,
  ErrorDeAutenticacion,
} from "@/servicios/auth";

const EMAIL_DE_PRUEBA = "turista.mi.ciudad@correo.com";
const CONTRASENA_DE_PRUEBA = "MiCiudad2026";

describe("iniciarSesion", () => {
  it("devuelve un token y el usuario con credenciales correctas", async () => {
    const respuesta = await iniciarSesion(EMAIL_DE_PRUEBA, CONTRASENA_DE_PRUEBA);
    expect(respuesta.usuario.email).toBe(EMAIL_DE_PRUEBA);
    expect(respuesta.token).toEqual(expect.any(String));
  });

  it("no distingue mayúsculas ni espacios en el correo", async () => {
    const respuesta = await iniciarSesion(`  ${EMAIL_DE_PRUEBA.toUpperCase()}  `, CONTRASENA_DE_PRUEBA);
    expect(respuesta.usuario.email).toBe(EMAIL_DE_PRUEBA);
  });

  it("rechaza una contraseña incorrecta con el código esperado", async () => {
    await expect(iniciarSesion(EMAIL_DE_PRUEBA, "contraseña-incorrecta")).rejects.toMatchObject({
      codigo: "CREDENCIALES_INVALIDAS",
    });
  });

  it("rechaza un correo que no existe", async () => {
    await expect(iniciarSesion("no-existe@correo.com", CONTRASENA_DE_PRUEBA)).rejects.toBeInstanceOf(
      ErrorDeAutenticacion,
    );
  });
});

describe("reingresarConBiometria", () => {
  it("reconstruye la sesión de un usuario existente", async () => {
    const respuesta = await reingresarConBiometria(EMAIL_DE_PRUEBA);
    expect(respuesta.usuario.email).toBe(EMAIL_DE_PRUEBA);
  });

  it("rechaza un correo sin cuenta asociada", async () => {
    await expect(reingresarConBiometria("fantasma@correo.com")).rejects.toMatchObject({
      codigo: "CREDENCIALES_INVALIDAS",
    });
  });
});

describe("obtenerUsuarioActual", () => {
  it("reconstruye el usuario a partir de un token de esa sesión", async () => {
    const { token } = await iniciarSesion(EMAIL_DE_PRUEBA, CONTRASENA_DE_PRUEBA);
    const usuario = await obtenerUsuarioActual(token);
    expect(usuario?.email).toBe(EMAIL_DE_PRUEBA);
  });

  it("devuelve null para un token que no corresponde a ningún usuario", async () => {
    const usuario = await obtenerUsuarioActual("token-simulado.no-existe.123");
    expect(usuario).toBeNull();
  });
});

describe("registrarCuenta", () => {
  it("crea una cuenta nueva y permite iniciar sesión con ella después", async () => {
    const email = "turista.nuevo@correo.com";
    const respuesta = await registrarCuenta("Turista Nuevo", email, "unaContrasenaSegura");
    expect(respuesta.usuario.email).toBe(email);
    expect(respuesta.usuario.nombre).toBe("Turista Nuevo");

    const sesion = await iniciarSesion(email, "unaContrasenaSegura");
    expect(sesion.usuario.email).toBe(email);
  });

  it("no permite registrar dos veces el mismo correo", async () => {
    const email = "turista.repetido@correo.com";
    await registrarCuenta("Turista Repetido", email, "unaContrasenaSegura");

    await expect(registrarCuenta("Otro Nombre", email, "otraContrasena")).rejects.toMatchObject({
      codigo: "EMAIL_YA_REGISTRADO",
    });
  });
});
