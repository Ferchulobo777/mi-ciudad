import {
  iniciarSesion,
  reingresarConBiometria,
  registrarCuenta,
  obtenerUsuarioActual,
  ErrorDeAutenticacion,
} from "@/servicios/auth";
import type { Usuario } from "@/tipos";

jest.mock("expo-network", () => ({
  getNetworkStateAsync: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
}));

let mockTokenBiometria: string | null = null;
jest.mock("@/servicios/sesion-almacenamiento", () => ({
  leerTokenParaBiometria: jest.fn(async () => mockTokenBiometria),
}));

// Un servidor falso con el mismo contrato que la API de la cátedra: la
// usuaria de demo del README, registro con email único y GET /yo con Bearer.
const lucia: Usuario = {
  id: "usr-201",
  nombre: "Lucía",
  email: "lucia@mail.com",
  avatarUrl: null,
  creadoEn: "2026-10-01T10:00:00-03:00",
  preferencias: { categoriasFavoritas: [], avisarProximidad: true, radioAvisoMetros: 250, tema: "sistema" },
};
const cuentas = new Map<string, { contrasena: string; usuario: Usuario }>([
  ["lucia@mail.com", { contrasena: "lucia1234", usuario: lucia }],
]);
const tokens = new Map<string, Usuario>();

function respuestaJson(estado: number, cuerpo: unknown) {
  return { ok: estado >= 200 && estado < 300, status: estado, json: async () => cuerpo } as Response;
}

function error(estado: number, codigo: string, mensaje: string) {
  return respuestaJson(estado, { error: { codigo, mensaje } });
}

function emitirSesion(usuario: Usuario) {
  const token = `jwt-${usuario.id}-${tokens.size}`;
  tokens.set(token, usuario);
  return respuestaJson(200, { datos: { token, usuario }, meta: null });
}

beforeAll(() => {
  globalThis.fetch = jest.fn(async (url: string, init?: RequestInit) => {
    const cuerpo = init?.body ? JSON.parse(String(init.body)) : {};
    if (url.endsWith("/auth/ingreso")) {
      const cuenta = cuentas.get(cuerpo.email);
      if (!cuenta || cuenta.contrasena !== cuerpo.contrasena) {
        return error(401, "CREDENCIALES_INVALIDAS", "El email o la contraseña no son correctos.");
      }
      return emitirSesion(cuenta.usuario);
    }
    if (url.endsWith("/auth/registro")) {
      if (cuentas.has(cuerpo.email)) return error(409, "EMAIL_YA_REGISTRADO", "Ya hay una cuenta con ese email.");
      const usuario = { ...lucia, id: `usr-${cuentas.size + 300}`, nombre: cuerpo.nombre, email: cuerpo.email };
      cuentas.set(cuerpo.email, { contrasena: cuerpo.contrasena, usuario });
      return emitirSesion(usuario);
    }
    if (url.endsWith("/yo")) {
      const autorizacion = (init?.headers as Record<string, string>)?.Authorization ?? "";
      const usuario = tokens.get(autorizacion.replace("Bearer ", ""));
      if (!usuario) return error(401, "NO_AUTENTICADO", "Tenés que ingresar con tu cuenta para hacer esto.");
      return respuestaJson(200, { datos: usuario, meta: null });
    }
    return error(404, "RUTA_NO_ENCONTRADA", "Esa dirección no existe en la API.");
  }) as unknown as typeof fetch;
});

describe("iniciarSesion", () => {
  it("devuelve un token y el usuario con credenciales correctas", async () => {
    const respuesta = await iniciarSesion("lucia@mail.com", "lucia1234");
    expect(respuesta.usuario.email).toBe("lucia@mail.com");
    expect(respuesta.token).toEqual(expect.any(String));
  });

  it("normaliza mayúsculas y espacios del correo antes de mandarlo", async () => {
    const respuesta = await iniciarSesion("  LUCIA@MAIL.COM  ", "lucia1234");
    expect(respuesta.usuario.email).toBe("lucia@mail.com");
  });

  it("rechaza una contraseña incorrecta con el código y el mensaje de la API", async () => {
    await expect(iniciarSesion("lucia@mail.com", "incorrecta")).rejects.toMatchObject({
      codigo: "CREDENCIALES_INVALIDAS",
      message: "El email o la contraseña no son correctos.",
    });
  });

  it("rechaza un correo que no existe", async () => {
    await expect(iniciarSesion("no-existe@correo.com", "lucia1234")).rejects.toBeInstanceOf(ErrorDeAutenticacion);
  });
});

describe("obtenerUsuarioActual", () => {
  it("reconstruye el usuario a partir de un token de esa sesión", async () => {
    const { token } = await iniciarSesion("lucia@mail.com", "lucia1234");
    expect((await obtenerUsuarioActual(token))?.email).toBe("lucia@mail.com");
  });

  it("devuelve null para un token que la API rechaza", async () => {
    expect(await obtenerUsuarioActual("token-vencido")).toBeNull();
  });
});

describe("reingresarConBiometria", () => {
  it("reutiliza el último token guardado si sigue vigente", async () => {
    mockTokenBiometria = (await iniciarSesion("lucia@mail.com", "lucia1234")).token;
    const respuesta = await reingresarConBiometria("lucia@mail.com");
    expect(respuesta.usuario.id).toBe("usr-201");
  });

  it("pide la contraseña si el token guardado venció", async () => {
    mockTokenBiometria = "token-vencido";
    await expect(reingresarConBiometria("lucia@mail.com")).rejects.toMatchObject({ codigo: "CREDENCIALES_INVALIDAS" });
  });

  it("falla si no hay ningún token guardado", async () => {
    mockTokenBiometria = null;
    await expect(reingresarConBiometria("lucia@mail.com")).rejects.toBeInstanceOf(ErrorDeAutenticacion);
  });
});

describe("registrarCuenta", () => {
  it("crea una cuenta nueva y permite iniciar sesión con ella después", async () => {
    const respuesta = await registrarCuenta("Turista Nuevo", "turista.nuevo@correo.com", "unaContrasenaSegura");
    expect(respuesta.usuario.nombre).toBe("Turista Nuevo");

    const sesion = await iniciarSesion("turista.nuevo@correo.com", "unaContrasenaSegura");
    expect(sesion.usuario.email).toBe("turista.nuevo@correo.com");
  });

  it("no permite registrar dos veces el mismo correo", async () => {
    await expect(registrarCuenta("Otra", "lucia@mail.com", "otraContrasena")).rejects.toMatchObject({
      codigo: "EMAIL_YA_REGISTRADO",
    });
  });
});
