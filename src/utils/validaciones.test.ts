import {
  esEmailValido,
  esContrasenaValida,
  esNombreValido,
  validarLogin,
  validarRegistro,
} from "@/utils/validaciones";

describe("esEmailValido", () => {
  it("acepta un correo con formato válido", () => {
    expect(esEmailValido("maria.villalba@correo.com")).toBe(true);
  });

  it("acepta un correo con espacios alrededor", () => {
    expect(esEmailValido("  maria.villalba@correo.com  ")).toBe(true);
  });

  it("rechaza un correo sin arroba", () => {
    expect(esEmailValido("maria.villalba-correo.com")).toBe(false);
  });

  it("rechaza un correo sin dominio", () => {
    expect(esEmailValido("maria@")).toBe(false);
  });

  it("rechaza una cadena vacía", () => {
    expect(esEmailValido("")).toBe(false);
  });
});

describe("esContrasenaValida", () => {
  it("rechaza una contraseña de menos de 8 caracteres", () => {
    expect(esContrasenaValida("col2026")).toBe(false);
  });

  it("acepta una contraseña de exactamente 8 caracteres", () => {
    expect(esContrasenaValida("colon202")).toBe(true);
  });

  it("acepta una contraseña más larga", () => {
    expect(esContrasenaValida("colon2026")).toBe(true);
  });
});

describe("esNombreValido", () => {
  it("rechaza un nombre de una sola letra", () => {
    expect(esNombreValido("M")).toBe(false);
  });

  it("rechaza una cadena de solo espacios", () => {
    expect(esNombreValido("   ")).toBe(false);
  });

  it("acepta un nombre y apellido", () => {
    expect(esNombreValido("María Villalba")).toBe(true);
  });
});

describe("validarLogin", () => {
  it("no devuelve errores con datos válidos", () => {
    expect(validarLogin("maria.villalba@correo.com", "colon2026")).toEqual({});
  });

  it("reporta el correo vacío antes que el formato inválido", () => {
    const errores = validarLogin("", "colon2026");
    expect(errores.email).toBe("Ingresá tu correo electrónico.");
  });

  it("reporta un correo con formato inválido", () => {
    const errores = validarLogin("no-es-un-correo", "colon2026");
    expect(errores.email).toBe("Ese correo no parece válido.");
  });

  it("reporta la contraseña vacía", () => {
    const errores = validarLogin("maria.villalba@correo.com", "");
    expect(errores.contrasena).toBe("Ingresá tu contraseña.");
  });

  it("reporta una contraseña demasiado corta", () => {
    const errores = validarLogin("maria.villalba@correo.com", "corta");
    expect(errores.contrasena).toContain("al menos 8 caracteres");
  });
});

describe("validarRegistro", () => {
  it("no devuelve errores con datos válidos", () => {
    expect(validarRegistro("María Villalba", "maria.villalba@correo.com", "colon2026")).toEqual({});
  });

  it("además de validar login, reporta el nombre inválido", () => {
    const errores = validarRegistro("M", "maria.villalba@correo.com", "colon2026");
    expect(errores.nombre).toBe("Ingresá tu nombre y apellido.");
  });

  it("acumula errores de nombre y de login a la vez", () => {
    const errores = validarRegistro("", "", "");
    expect(errores.nombre).toBeDefined();
    expect(errores.email).toBeDefined();
    expect(errores.contrasena).toBeDefined();
  });
});
