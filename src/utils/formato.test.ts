import { formatearPrecio } from "@/utils/formato";

describe("formatearPrecio", () => {
  it('muestra "Gratis" cuando el precio es 0', () => {
    expect(formatearPrecio(0)).toBe("Gratis");
  });

  it("no muestra nada cuando el precio no aplica (null), que no es lo mismo que gratis", () => {
    expect(formatearPrecio(null)).toBeNull();
  });

  it("usa el punto de miles de Argentina", () => {
    expect(formatearPrecio(1500)).toBe("$1.500");
    expect(formatearPrecio(350)).toBe("$350");
  });
});
