import { codigoQrDeLugar, interpretarCodigoQr } from "@/utils/codigo-qr";

describe("interpretarCodigoQr", () => {
  it("reconoce un código de Mi Ciudad y extrae el id del lugar", () => {
    expect(interpretarCodigoQr("COLON:lugar-molino-forclaz")).toEqual({ tipo: "lugar", lugarId: "lugar-molino-forclaz" });
  });

  it("tolera espacios alrededor y el prefijo en minúsculas", () => {
    expect(interpretarCodigoQr("  colon:lug-004 ")).toEqual({ tipo: "lugar", lugarId: "lug-004" });
  });

  it("trata como ajeno un QR que no es de Mi Ciudad, como una URL", () => {
    expect(interpretarCodigoQr("https://consultora.example/peatonal")).toEqual({ tipo: "ajeno" });
  });

  it("trata como ajeno un código roto, sin id después del prefijo", () => {
    expect(interpretarCodigoQr("COLON:")).toEqual({ tipo: "ajeno" });
  });

  it("trata como ajeno un id con caracteres que no puede tener", () => {
    expect(interpretarCodigoQr("COLON:lugar/../../otra-cosa")).toEqual({ tipo: "ajeno" });
    expect(interpretarCodigoQr("COLON:dos palabras")).toEqual({ tipo: "ajeno" });
  });

  it("trata como ajeno un texto vacío", () => {
    expect(interpretarCodigoQr("")).toEqual({ tipo: "ajeno" });
  });
});

describe("codigoQrDeLugar", () => {
  it("genera un código que después se interpreta como ese mismo lugar", () => {
    const codigo = codigoQrDeLugar("lugar-termas-colon");
    expect(interpretarCodigoQr(codigo)).toEqual({ tipo: "lugar", lugarId: "lugar-termas-colon" });
  });
});
