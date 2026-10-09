import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { Lugar, Visita } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { useSesion } from "@/hooks/use-sesion";
import { useCategorias } from "@/hooks/use-categorias";
import { ImagenLugar } from "@/components/imagen-lugar";
import { Boton } from "@/components/boton";
import { alCambiarLasVisitas, listarVisitas, sincronizarVisitasPendientes } from "@/servicios/visitas";
import { obtenerLugaresPorIds } from "@/servicios/lugares";
import { formatearHora } from "@/utils/fechas";

const ETIQUETA_ORIGEN: Record<Visita["origen"], string> = {
  qr: "por QR",
  gps: "por cercanía",
  manual: "manual",
};

function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  const hora = formatearHora(fecha);
  if (fecha.toDateString() === hoy.toDateString()) return `Hoy, ${hora}`;
  if (fecha.toDateString() === ayer.toDateString()) return `Ayer, ${hora}`;
  const dia = fecha.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short" });
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)}, ${hora}`;
}

export default function MiRecorrido() {
  const tema = useTema();
  const { usuario } = useSesion();
  const { porId: categoriaPorId } = useCategorias();
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [lugares, setLugares] = useState<Record<string, Lugar>>({});
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    if (!usuario) {
      setCargando(false);
      return;
    }
    const resultado = await listarVisitas(usuario.id);
    setVisitas(resultado);
    const encontrados = await obtenerLugaresPorIds(resultado.map((v) => v.lugarId)).catch(() => []);
    setLugares(Object.fromEntries(encontrados.map((l) => [l.id, l])));
    setCargando(false);
    setRefrescando(false);
  }, [usuario]);

  // useFocusEffect: la pestaña queda montada, y al volver de registrar una
  // visita la lista tiene que mostrarla sin tirar para refrescar. De paso se
  // intenta subir lo pendiente.
  useFocusEffect(
    useCallback(() => {
      cargar();
      if (usuario) sincronizarVisitasPendientes(usuario.id).catch(() => {});
    }, [cargar, usuario]),
  );

  // Cuando la sincronización termina en segundo plano, el ícono de cada
  // visita pasa de "pendiente" a "subida" sin salir de la pantalla.
  useEffect(() => alCambiarLasVisitas(cargar), [cargar]);

  function refrescar() {
    setRefrescando(true);
    if (usuario) sincronizarVisitasPendientes(usuario.id).catch(() => {});
    cargar();
  }

  if (!usuario) {
    return (
      <SafeAreaView style={[styles.vacio, { backgroundColor: tema.fondo }]}>
        <Ionicons name="footsteps-outline" size={44} color={tema.textoSecundario} />
        <Text style={[styles.textoVacio, { color: tema.textoSecundario }]}>
          Ingresá con tu cuenta para llevar el registro de los lugares que visitás, con fotos y notas.
        </Text>
        <Boton etiqueta="Ingresar" onPress={() => router.navigate("/perfil")} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.contenedor, { backgroundColor: tema.fondo }]} edges={["top"]}>
      <View style={styles.encabezado}>
        <Text style={[styles.titulo, { color: tema.textoPrincipal }]} accessibilityRole="header">
          Mi recorrido
        </Text>
        <Text style={[styles.resumen, { color: tema.textoSecundario }]}>
          {visitas.length} {visitas.length === 1 ? "lugar visitado" : "lugares visitados"}
        </Text>
      </View>

      {cargando ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={tema.primario} />
      ) : (
        <FlatList
          contentContainerStyle={styles.lista}
          data={visitas}
          keyExtractor={(v) => v.id}
          refreshControl={
            <RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={tema.primario} colors={[tema.primario]} />
          }
          ListEmptyComponent={
            <View style={styles.vacioContenido}>
              <Ionicons name="footsteps-outline" size={44} color={tema.textoSecundario} />
              <Text style={[styles.textoVacio, { color: tema.textoSecundario }]}>
                Todavía no registraste ninguna visita. Entrá al detalle de un lugar y tocá &ldquo;Registrar visita&rdquo;.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const lugar = lugares[item.lugarId];
            const categoria = lugar ? categoriaPorId.get(lugar.categoriaId) : undefined;
            return (
              <Pressable
                onPress={() => lugar && router.push({ pathname: "/lugar/[id]", params: { id: lugar.id } })}
                accessibilityRole="button"
                style={[styles.fila, { backgroundColor: tema.superficie }]}
              >
                {item.fotoUri ? (
                  <Image source={{ uri: item.fotoUri }} style={styles.miniatura} contentFit="cover" transition={150} />
                ) : (
                  <ImagenLugar categoria={categoria} tamañoIcono={20} style={styles.miniatura} />
                )}
                <View style={{ flex: 1 }}>
                  <View style={styles.filaNombre}>
                    <Text style={[styles.nombre, { color: tema.textoPrincipal }]} numberOfLines={1}>
                      {lugar?.nombre ?? "Lugar"}
                    </Text>
                    <Ionicons
                      name={item.sincronizada ? "checkmark-circle" : "cloud-upload-outline"}
                      size={18}
                      color={item.sincronizada ? tema.exito : tema.advertencia}
                      accessibilityLabel={item.sincronizada ? "Sincronizada" : "Pendiente de subir"}
                    />
                  </View>
                  <Text style={[styles.detalle, { color: item.sincronizada ? tema.textoSecundario : tema.advertencia }]}>
                    {formatearFecha(item.fechaHora)} · {item.sincronizada ? ETIQUETA_ORIGEN[item.origen] : "pendiente de subir"}
                  </Text>
                  {item.nota ? (
                    <Text style={[styles.nota, { color: tema.textoSecundario }]} numberOfLines={2}>
                      &ldquo;{item.nota}&rdquo;
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  encabezado: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
  titulo: { fontSize: 24, fontWeight: "800" },
  resumen: { fontSize: 14, marginTop: 2 },
  vacio: { flex: 1, alignItems: "stretch", justifyContent: "center", padding: 32, gap: 14 },
  vacioContenido: { alignItems: "center", padding: 32, marginTop: 30, gap: 10 },
  textoVacio: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  lista: { padding: 20, paddingTop: 8 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 12, marginBottom: 10 },
  miniatura: { width: 56, height: 56, borderRadius: 12, flexShrink: 0 },
  filaNombre: { flexDirection: "row", alignItems: "center", gap: 6 },
  nombre: { fontSize: 16, fontWeight: "700", flexShrink: 1 },
  detalle: { fontSize: 14, marginTop: 2 },
  nota: { fontSize: 14, fontStyle: "italic", marginTop: 2 },
});
