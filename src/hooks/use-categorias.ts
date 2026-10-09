import { useEffect, useMemo, useState } from "react";
import type { Categoria } from "@/tipos";
import { listarCategorias } from "@/servicios/lugares";

// Las categorías casi no cambian y las usan todas las pantallas que muestran
// un lugar: se piden una vez y se comparten, en vez de que cada pantalla
// importe el mock (el PRD lo prohíbe) o repita el pedido.
let enMemoria: Categoria[] | null = null;

export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>(enMemoria ?? []);

  useEffect(() => {
    if (enMemoria) return;
    let vigente = true;
    listarCategorias()
      .then((resultado) => {
        enMemoria = resultado;
        if (vigente) setCategorias(resultado);
      })
      .catch(() => {
        // Sin categorías las tarjetas muestran "Sin categoría" y un color
        // neutro; no vale la pena bloquear la pantalla por eso.
      });
    return () => {
      vigente = false;
    };
  }, []);

  const porId = useMemo(() => new Map(categorias.map((c) => [c.id, c])), [categorias]);
  return { categorias, porId };
}
