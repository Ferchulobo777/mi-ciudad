import { useState } from "react";
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useSesion } from "@/hooks/use-sesion";
import { useTema } from "@/hooks/use-tema";
import { Boton } from "@/components/boton";
import { elegirFotoDeGaleria, sacarFotoDePerfil } from "@/servicios/foto-perfil";
import type { PreferenciaTema } from "@/servicios/preferencias";

const OPCIONES_TEMA: { valor: PreferenciaTema; etiqueta: string }[] = [
  { valor: "claro", etiqueta: "Claro" },
  { valor: "oscuro", etiqueta: "Oscuro" },
  { valor: "sistema", etiqueta: "Sistema" },
];

export default function Yo() {
  const tema = useTema();
  const { usuario, token, cerrar, temaPreferencia, cambiarTema, actualizarAvatar } = useSesion();
  const [cambiandoFoto, setCambiandoFoto] = useState(false);

  async function elegirOrigenDeFoto() {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Cancelar", "Sacar foto", "Elegir de la galería"], cancelButtonIndex: 0 },
        async (indice) => {
          if (indice === 1) await procesarFoto(sacarFotoDePerfil);
          if (indice === 2) await procesarFoto(elegirFotoDeGaleria);
        },
      );
    } else {
      Alert.alert("Foto de perfil", "¿De dónde la sacamos?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Cámara", onPress: () => procesarFoto(sacarFotoDePerfil) },
        { text: "Galería", onPress: () => procesarFoto(elegirFotoDeGaleria) },
      ]);
    }
  }

  async function procesarFoto(obtener: (usuarioId: string) => Promise<string | null>) {
    if (!usuario) return;
    setCambiandoFoto(true);
    const uri = await obtener(usuario.id);
    if (uri) actualizarAvatar(uri);
    setCambiandoFoto(false);
  }

  if (!token || !usuario) {
    return (
      <SafeAreaView style={[styles.contenedor, { backgroundColor: tema.fondo }]}>
        <Text style={[styles.titulo, { color: tema.textoPrincipal }]}>Todavía no ingresaste</Text>
        <Text style={[styles.texto, { color: tema.textoSecundario }]}>
          Ingresá o creá una cuenta para guardar tus favoritos y tu recorrido.
        </Text>
        <View style={styles.acciones}>
          <Boton etiqueta="Ingresar" onPress={() => router.push("/login")} />
          <Boton etiqueta="Crear cuenta" variante="secundario" onPress={() => router.push("/registro")} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.contenedor, { backgroundColor: tema.fondo }]}>
      <Pressable onPress={elegirOrigenDeFoto} style={styles.avatarToque}>
        {usuario.avatarUrl ? (
          <Image source={{ uri: usuario.avatarUrl }} style={styles.avatarFoto} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: tema.primario }]}>
            <Text style={styles.inicial}>{usuario.nombre.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={[styles.iconoEditar, { backgroundColor: tema.superficie, borderColor: tema.fondo }]}>
          <Ionicons name="camera" size={14} color={tema.primario} />
        </View>
      </Pressable>

      <Text style={[styles.nombre, { color: tema.textoPrincipal }]}>{usuario.nombre}</Text>
      <Text style={{ color: tema.textoSecundario, marginBottom: 28 }}>{usuario.email}</Text>

      <View style={[styles.tarjeta, { backgroundColor: tema.superficie }]}>
        <Pressable style={styles.fila} onPress={() => router.push("/favoritos")}>
          <Ionicons name="heart-outline" size={18} color={tema.acento} />
          <Text style={[styles.filaTexto, { color: tema.textoPrincipal }]}>Mis favoritos</Text>
          <Ionicons name="chevron-forward" size={16} color={tema.textoSecundario} />
        </Pressable>

        <View style={[styles.separador, { backgroundColor: tema.borde }]} />

        <View style={styles.fila}>
          <Ionicons name="contrast-outline" size={18} color={tema.primario} />
          <Text style={[styles.filaTexto, { color: tema.textoPrincipal }]}>Tema</Text>
        </View>
        <View style={styles.filaChipsTema}>
          {OPCIONES_TEMA.map((opcion) => {
            const activo = temaPreferencia === opcion.valor;
            return (
              <Pressable
                key={opcion.valor}
                onPress={() => cambiarTema(opcion.valor)}
                style={[
                  styles.chipTema,
                  activo ? { backgroundColor: tema.primario } : { backgroundColor: `${tema.primario}18` },
                ]}
              >
                <Text style={{ color: activo ? "#FFFFFF" : tema.primario, fontSize: 12, fontWeight: "700" }}>
                  {opcion.etiqueta}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ marginTop: 20, width: "100%" }}>
        <Boton etiqueta="Cerrar sesión" variante="secundario" onPress={cerrar} deshabilitado={cambiandoFoto} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, alignItems: "center", padding: 24, paddingTop: 40 },
  avatarToque: { marginBottom: 14 },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center" },
  avatarFoto: { width: 88, height: 88, borderRadius: 44 },
  iconoEditar: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  inicial: { color: "#FFFFFF", fontSize: 30, fontWeight: "800" },
  nombre: { fontSize: 20, fontWeight: "800" },
  titulo: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
  texto: { fontSize: 14, textAlign: "center", marginBottom: 24, lineHeight: 20 },
  acciones: { width: "100%", gap: 12 },
  tarjeta: { width: "100%", borderRadius: 16, padding: 16, gap: 4 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  filaTexto: { flex: 1, fontSize: 14, fontWeight: "600" },
  separador: { height: 1, marginVertical: 4 },
  filaChipsTema: { flexDirection: "row", gap: 8, paddingBottom: 6 },
  chipTema: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100 },
});
