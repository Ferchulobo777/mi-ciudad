import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { Lugar } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { useSesion } from "@/hooks/use-sesion";
import { useCategorias } from "@/hooks/use-categorias";
import { useUbicacion } from "@/hooks/use-ubicacion";
import { TarjetaLugar } from "@/components/tarjeta-lugar";
import { Encabezado } from "@/components/encabezado";
import { ChipsCategorias } from "@/components/chips-categorias";
import { EstadoError } from "@/components/estado-error";
import { BannerSinConexion } from "@/components/banner-sin-conexion";
import { listarLugares } from "@/servicios/lugares";
import { alternarFavorito, listarFavoritos } from "@/servicios/favoritos";
import { vibrarSeleccion } from "@/servicios/hapticos";
import { distanciaEnMetros, ordenarPorDistancia } from "@/utils/geo";
import type { Posicion } from "@/servicios/ubicacion";

const POSICION_DE_RESPALDO: Posicion = { latitud: -32.2246, longitud: -58.1489 };

type Orden = "distancia" | "nombre";

export default function Catalogo() {
  const tema = useTema();
  const { usuario } = useSesion();
  const { categorias, porId: categoriaPorId } = useCategorias();
  const ubicacion = useUbicacion();
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<Orden>("distancia");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [idsFavoritos, setIdsFavoritos] = useState<Set<string>>(new Set());

  const cargar = useCallback(() => {
    listarLugares({ categoriaId: categoriaSeleccionada, busqueda })
      .then((resultado) => {
        setLugares(resultado);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setCargando(false));
  }, [categoriaSeleccionada, busqueda]);

  useEffect(cargar, [cargar]);

  // Al volver del detalle, el corazón tiene que reflejar si el turista marcó
  // o desmarcó el lugar ahí: por eso useFocusEffect y no un useEffect.
  useFocusEffect(
    useCallback(() => {
      if (!usuario) {
        setIdsFavoritos(new Set());
        return;
      }
      listarFavoritos(usuario.id)
        .then((favoritos) => setIdsFavoritos(new Set(favoritos.map((f) => f.lugarId))))
        .catch(() => {});
    }, [usuario]),
  );

  async function tocarFavorito(lugarId: string) {
    // Mirar el catálogo no pide cuenta; guardar un favorito sí (PRD).
    if (!usuario) {
      router.push("/login");
      return;
    }
    vibrarSeleccion();
    const ahoraEsFavorito = await alternarFavorito(usuario.id, lugarId);
    setIdsFavoritos((anteriores) => {
      const nuevos = new Set(anteriores);
      if (ahoraEsFavorito) nuevos.add(lugarId);
      else nuevos.delete(lugarId);
      return nuevos;
    });
  }

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
  function reintentar() {
    setCargando(true);
    cargar();
  }

  const desde = ubicacion.posicion ?? POSICION_DE_RESPALDO;
  const lugaresOrdenados = useMemo(
    () =>
      orden === "distancia"
        ? ordenarPorDistancia(lugares, desde)
        : [...lugares].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    [lugares, desde, orden],
  );

  // No se usa getItemLayout: con la letra agrandada del sistema (que el PRD
  // pide respetar) cada tarjeta crece en alto, y una altura fija calculada de
  // antemano haría que la lista salte al scrollear. Con dos o tres docenas de
  // lugares medir cada fila no tiene costo apreciable.
  let contenido: ReactNode;
  if (cargando) {
    contenido = <ActivityIndicator style={{ marginTop: 40 }} color={tema.primario} />;
  } else if (error) {
    contenido = (
      <EstadoError mensaje="No pudimos cargar los lugares y todavía no hay una copia guardada en el teléfono." alReintentar={reintentar} />
    );
  } else if (lugaresOrdenados.length === 0) {
    contenido = (
      <View style={styles.vacio}>
        <Ionicons name="search-outline" size={40} color={tema.textoSecundario} />
        <Text style={[styles.textoVacio, { color: tema.textoSecundario }]}>
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
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <TarjetaLugar
            lugar={item}
            categoria={categoriaPorId.get(item.categoriaId)}
            distanciaEnMetros={distanciaEnMetros(desde, item.coordenadas)}
            onPress={() => router.push({ pathname: "/lugar/[id]", params: { id: item.id } })}
            esFavorito={idsFavoritos.has(item.id)}
            alTocarFavorito={() => tocarFavorito(item.id)}
          />
        )}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.contenedor, { backgroundColor: tema.fondo }]} edges={["top"]}>
      <BannerSinConexion />
      <Encabezado titulo="Catálogo" />
      <View style={styles.buscadorFila}>
        <View style={[styles.buscador, { backgroundColor: tema.superficie, borderColor: tema.borde }]}>
          <Ionicons name="search" size={18} color={tema.textoSecundario} />
          <TextInput
            value={busqueda}
            onChangeText={cambiarBusqueda}
            placeholder="Buscar un lugar..."
            placeholderTextColor={tema.textoSecundario}
            autoFocus
            returnKeyType="search"
            accessibilityLabel="Buscar un lugar por nombre"
            style={[styles.campo, { color: tema.textoPrincipal }]}
          />
        </View>
      </View>

      <ChipsCategorias categorias={categorias} seleccionada={categoriaSeleccionada} alElegir={elegirCategoria} />

      <View style={styles.filaResumen}>
        <Text style={[styles.resumen, { color: tema.textoSecundario }]}>
          {lugaresOrdenados.length} {lugaresOrdenados.length === 1 ? "lugar" : "lugares"}
        </Text>
        <Pressable
          onPress={() => setOrden(orden === "distancia" ? "nombre" : "distancia")}
          accessibilityRole="button"
          accessibilityLabel={`Ordenado por ${orden}. Tocá para cambiar.`}
          hitSlop={10}
        >
          <Text style={[styles.orden, { color: tema.primario }]}>Ordenar: {orden} ⇅</Text>
        </Pressable>
      </View>

      {contenido}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  buscadorFila: { paddingHorizontal: 20, paddingBottom: 12 },
  buscador: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14 },
  campo: { flex: 1, fontSize: 16, paddingVertical: 12 },
  filaResumen: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 12 },
  resumen: { fontSize: 14 },
  orden: { fontSize: 14, fontWeight: "800" },
  lista: { padding: 20, paddingTop: 10 },
  vacio: { padding: 40, alignItems: "center", gap: 10 },
  textoVacio: { fontSize: 15, textAlign: "center", lineHeight: 22 },
});
