import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import type { Evento } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { listarEventos } from "@/servicios/eventos";
import { formatearEncabezadoDeDia, formatearHora } from "@/utils/fechas";

interface Grupo {
  encabezado: string;
  eventos: Evento[];
}

function agruparPorDia(eventos: Evento[]): Grupo[] {
  const grupos: Grupo[] = [];
  for (const evento of eventos) {
    const encabezado = formatearEncabezadoDeDia(new Date(evento.inicio));
    const grupoExistente = grupos.find((g) => g.encabezado === encabezado);
    if (grupoExistente) grupoExistente.eventos.push(evento);
    else grupos.push({ encabezado, eventos: [evento] });
  }
  return grupos;
}

export default function Agenda() {
  const tema = useTema();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    listarEventos().then((resultado) => {
      setEventos(resultado);
      setCargando(false);
    });
  }, []);

  const grupos = useMemo(() => agruparPorDia(eventos), [eventos]);

  return (
    <SafeAreaView style={[styles.contenedor, { backgroundColor: tema.fondo }]} edges={["top"]}>
      <Text style={[styles.titulo, { color: tema.textoPrincipal }]}>Agenda de eventos</Text>

      {cargando ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={tema.primario} />
      ) : (
        <FlatList
          contentContainerStyle={styles.lista}
          data={grupos}
          keyExtractor={(g) => g.encabezado}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 20 }}>
              <Text style={[styles.encabezadoGrupo, { color: tema.textoSecundario }]}>
                {item.encabezado.toUpperCase()}
              </Text>
              {item.eventos.map((evento) => (
                <FilaEvento key={evento.id} evento={evento} />
              ))}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function FilaEvento({ evento }: { readonly evento: Evento }) {
  const tema = useTema();
  const suspendido = evento.estado === "suspendido" || evento.estado === "cancelado";
  const inicio = new Date(evento.inicio);

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/evento/[id]", params: { id: evento.id } })}
      style={({ pressed }) => [
        styles.fila,
        { backgroundColor: tema.superficie, borderLeftColor: suspendido ? tema.error : "transparent" },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={styles.horaBloque}>
        <Text
          style={[
            styles.hora,
            { color: suspendido ? tema.textoSecundario : tema.primario },
            suspendido && styles.horaTachada,
          ]}
        >
          {formatearHora(inicio)}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.tituloEvento, { color: tema.textoPrincipal }]} numberOfLines={1}>
          {evento.titulo}
        </Text>
        <Text style={[styles.subtitulo, { color: suspendido ? tema.error : tema.textoSecundario }]} numberOfLines={1}>
          {suspendido
            ? "Suspendido"
            : [evento.direccionLibre, evento.precio === null ? "Gratis" : `$${evento.precio}`]
                .filter(Boolean)
                .join(" · ")}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  titulo: { fontSize: 20, fontWeight: "800", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 },
  lista: { padding: 20, paddingTop: 8 },
  encabezadoGrupo: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8 },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 14,
    borderLeftWidth: 3,
    padding: 14,
    marginBottom: 10,
  },
  horaBloque: { width: 52, alignItems: "center" },
  hora: { fontSize: 15, fontWeight: "800" },
  horaTachada: { textDecorationLine: "line-through" },
  tituloEvento: { fontSize: 14, fontWeight: "700" },
  subtitulo: { fontSize: 12, marginTop: 2 },
});
