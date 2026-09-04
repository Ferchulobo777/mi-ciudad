import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import type { Categoria, Lugar } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { TarjetaLugar, ALTO_TARJETA_LUGAR } from "@/components/tarjeta-lugar";
import { BannerSinConexion } from "@/components/banner-sin-conexion";
import { listarCategorias, listarLugares, distanciaEnMetros } from "@/servicios/lugares";
import { obtenerPosicionActual, type Posicion } from "@/servicios/ubicacion";

// Centro de Colón: se usa como posición de respaldo mientras se resuelve el
// GPS, o directamente si el turista niega el permiso de ubicación (RNF08, la
// aplicación tiene que seguir siendo usable sin ubicación real).
const POSICION_DE_RESPALDO: Posicion = { latitud: -32.2246, longitud: -58.1489 };

const ALTO_ITEM = ALTO_TARJETA_LUGAR + 10;

export default function Catalogo() {
  const tema = useTema();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [posicion, setPosicion] = useState<Posicion>(POSICION_DE_RESPALDO);

  useEffect(() => {
    listarCategorias().then(setCategorias);
  }, []);

  useEffect(() => {
    obtenerPosicionActual().then((real) => {
      if (real) setPosicion(real);
    });
  }, []);

  useEffect(() => {
    listarLugares({ categoriaId: categoriaSeleccionada, busqueda }).then((resultado) => {
      setLugares(resultado);
      setCargando(false);
    });
  }, [categoriaSeleccionada, busqueda]);

  // El estado de carga se prende en el evento que dispara el filtro, no
  // dentro del efecto: React recomienda no llamar a setState de forma
  // síncrona en un efecto para evitar renders en cascada.
  function elegirCategoria(id: string | null) {
    setCargando(true);
    setCategoriaSeleccionada(id);
  }
  function cambiarBusqueda(texto: string) {
    setCargando(true);
    setBusqueda(texto);
  }

  const lugaresOrdenados = useMemo(() => {
    return [...lugares].sort(
      (a, b) =>
        distanciaEnMetros(posicion, a.coordenadas) - distanciaEnMetros(posicion, b.coordenadas),
    );
  }, [lugares, posicion]);

  const categoriaPorId = useMemo(() => new Map(categorias.map((c) => [c.id, c])), [categorias]);

  // getItemLayout evita que la FlatList tenga que medir cada fila para saber
  // dónde scrollear: con una altura de tarjeta fija, se puede calcular directo
  // (visto en la Unidad 3, listas largas y rendimiento).
  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: ALTO_ITEM, offset: ALTO_ITEM * index, index }),
    [],
  );

  let contenido: ReactNode;
  if (cargando) {
    contenido = <ActivityIndicator style={{ marginTop: 40 }} color={tema.primario} />;
  } else if (lugaresOrdenados.length === 0) {
    contenido = (
      <View style={styles.vacio}>
        <Text style={{ color: tema.textoSecundario, textAlign: "center" }}>
          No encontramos lugares con ese filtro. Probá con otra categoría o borrá la búsqueda.
        </Text>
      </View>
    );
  } else {
    contenido = (
      <FlatList
        data={lugaresOrdenados}
        keyExtractor={(l) => l.id}
        contentContainerStyle={styles.lista}
        getItemLayout={getItemLayout}
        renderItem={({ item }) => (
          <TarjetaLugar
            lugar={item}
            categoria={categoriaPorId.get(item.categoriaId)}
            distanciaEnMetros={distanciaEnMetros(posicion, item.coordenadas)}
            onPress={() => router.push({ pathname: "/lugar/[id]", params: { id: item.id } })}
          />
        )}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.contenedor, { backgroundColor: tema.fondo }]} edges={["top"]}>
      <BannerSinConexion />
      <View style={styles.encabezado}>
        <Text style={[styles.titulo, { color: tema.textoPrincipal }]}>Catálogo</Text>
        <TextInput
          value={busqueda}
          onChangeText={cambiarBusqueda}
          placeholder="Buscar un lugar..."
          placeholderTextColor={tema.textoSecundario}
          style={[styles.buscador, { backgroundColor: tema.superficie, borderColor: tema.borde, color: tema.textoPrincipal }]}
        />
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filaChips}
        contentContainerStyle={styles.filaChipsContenido}
        data={categorias}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={
          <Chip
            etiqueta="Todos"
            activo={categoriaSeleccionada === null}
            color={tema.primario}
            onPress={() => elegirCategoria(null)}
          />
        }
        renderItem={({ item }) => (
          <Chip
            etiqueta={item.nombre}
            activo={categoriaSeleccionada === item.id}
            color={item.color}
            onPress={() => elegirCategoria(item.id === categoriaSeleccionada ? null : item.id)}
          />
        )}
      />

      {contenido}
    </SafeAreaView>
  );
}

interface PropsChip {
  readonly etiqueta: string;
  readonly activo: boolean;
  readonly color: string;
  readonly onPress: () => void;
}

function Chip({ etiqueta, activo, color, onPress }: PropsChip) {
  return (
    <Text
      onPress={onPress}
      style={[
        styles.chip,
        activo ? { backgroundColor: color, color: "#FFFFFF" } : { backgroundColor: `${color}22`, color },
      ]}
    >
      {etiqueta}
    </Text>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  encabezado: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  titulo: { fontSize: 20, fontWeight: "800", marginBottom: 14 },
  buscador: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 },
  filaChips: { flexGrow: 0, marginBottom: 4 },
  filaChipsContenido: { paddingHorizontal: 20, gap: 8, alignItems: "center" },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, fontSize: 12, fontWeight: "700", overflow: "hidden" },
  lista: { padding: 20, paddingTop: 8 },
  vacio: { padding: 40, alignItems: "center" },
});
