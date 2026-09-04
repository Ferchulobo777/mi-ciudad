import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { Lugar, Visita } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { useSesion } from "@/hooks/use-sesion";
import { ImagenLugar } from "@/components/imagen-lugar";
import { listarVisitas } from "@/servicios/visitas";
import { obtenerLugaresPorIds } from "@/servicios/lugares";
import { categoriasSimuladas } from "@/mocks/categorias";

const ETIQUETA_ORIGEN: Record<Visita["origen"], string> = {
  qr: "código QR",
  gps: "cercanía",
  manual: "carga manual",
};

function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  const hoy = new Date();
  const esHoy = fecha.toDateString() === hoy.toDateString();
  const hora = fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  if (esHoy) return `Hoy, ${hora}`;
  return `${fecha.toLocaleDateString("es-AR", { weekday: "long", day: "numeric" })}, ${hora}`;
}

export default function MiRecorrido() {
  const tema = useTema();
  const { usuario, token } = useSesion();
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [lugares, setLugares] = useState<Record<string, Lugar>>({});
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!usuario) {
        setCargando(false);
        return;
      }
      setCargando(true);
      listarVisitas(usuario.id).then(async (resultado) => {
        setVisitas(resultado);
        const encontrados = await obtenerLugaresPorIds(resultado.map((v) => v.lugarId));
        setLugares(Object.fromEntries(encontrados.map((l) => [l.id, l])));
        setCargando(false);
      });
    }, [usuario]),
  );

  if (!token || !usuario) {
    return (
      <SafeAreaView style={[styles.vacio, { backgroundColor: tema.fondo }]}>
        <Ionicons name="navigate-outline" size={40} color={tema.textoSecundario} />
        <Text style={{ color: tema.textoSecundario, textAlign: "center", marginTop: 10 }}>
          Ingresá con tu cuenta para llevar el registro de tu recorrido.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.contenedor, { backgroundColor: tema.fondo }]} edges={["top"]}>
      <View style={styles.encabezado}>
        <Text style={[styles.titulo, { color: tema.textoPrincipal }]}>Mi recorrido</Text>
        <Text style={{ color: tema.textoSecundario, fontSize: 12, marginTop: 2 }}>
          {visitas.length} {visitas.length === 1 ? "lugar visitado" : "lugares visitados"}
        </Text>
      </View>

      {cargando ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={tema.primario} />
      ) : visitas.length === 0 ? (
        <View style={styles.vacioContenido}>
          <Ionicons name="navigate-outline" size={40} color={tema.textoSecundario} />
          <Text style={{ color: tema.textoSecundario, textAlign: "center", marginTop: 10 }}>
            Todavía no registraste ninguna visita. Entrá al detalle de un lugar y tocá &ldquo;Registrar
            visita&rdquo;.
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.lista}
          data={visitas}
          keyExtractor={(v) => v.id}
          renderItem={({ item }) => {
            const lugar = lugares[item.lugarId];
            const categoria = lugar ? categoriasSimuladas.find((c) => c.id === lugar.categoriaId) : undefined;
            return (
              <View style={[styles.fila, { backgroundColor: tema.superficie }]}>
                {item.fotoUri ? (
                  <Image source={{ uri: item.fotoUri }} style={styles.miniatura} />
                ) : (
                  <ImagenLugar categoria={categoria} tamañoIcono={18} style={styles.miniatura} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nombre, { color: tema.textoPrincipal }]} numberOfLines={1}>
                    {lugar?.nombre ?? "Lugar"}
                  </Text>
                  <Text style={{ color: tema.textoSecundario, fontSize: 12 }}>
                    {formatearFecha(item.fechaHora)} · {ETIQUETA_ORIGEN[item.origen]}
                  </Text>
                  {item.nota ? (
                    <Text style={{ color: tema.textoSecundario, fontSize: 12, fontStyle: "italic" }} numberOfLines={1}>
                      &ldquo;{item.nota}&rdquo;
                    </Text>
                  ) : null}
                </View>
                <Ionicons
                  name={item.sincronizada ? "checkmark-circle" : "cloud-upload-outline"}
                  size={18}
                  color={item.sincronizada ? tema.exito : tema.advertencia}
                />
              </View>
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
  titulo: { fontSize: 20, fontWeight: "800" },
  vacio: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  vacioContenido: { alignItems: "center", justifyContent: "center", padding: 40, marginTop: 40 },
  lista: { padding: 20, paddingTop: 8 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 12, marginBottom: 10 },
  miniatura: { width: 48, height: 48, borderRadius: 10, flexShrink: 0 },
  nombre: { fontSize: 14, fontWeight: "700" },
});
