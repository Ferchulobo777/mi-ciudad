import { useCallback, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useSesion } from "@/hooks/use-sesion";
import { useTema } from "@/hooks/use-tema";
import { useCategorias } from "@/hooks/use-categorias";
import { FormularioLogin } from "@/components/formulario-login";
import { elegirFotoDeGaleria, sacarFotoDePerfil } from "@/servicios/foto-perfil";
import { listarFavoritos } from "@/servicios/favoritos";
import { pedirPermisoDeNotificaciones } from "@/servicios/notificaciones";
import { probarPush, registrarDispositivoPush } from "@/servicios/push";
import { consultarPermisoDeUbicacion, pedirPermisoDeUbicacion } from "@/servicios/ubicacion";
import type { PreferenciaTema, RadioAviso } from "@/servicios/preferencias";

const OPCIONES_TEMA: { valor: PreferenciaTema; etiqueta: string }[] = [
  { valor: "claro", etiqueta: "Claro" },
  { valor: "oscuro", etiqueta: "Oscuro" },
  { valor: "sistema", etiqueta: "Sistema" },
];

// Los tres radios que define el contrato de datos para Preferencias.
const RADIOS: RadioAviso[] = [100, 250, 500];

export default function MiPerfil() {
  const tema = useTema();
  const {
    usuario,
    cerrar,
    temaPreferencia,
    cambiarTema,
    proximidad,
    cambiarProximidad,
    categoriasFavoritas,
    cambiarCategoriasFavoritas,
    actualizarAvatar,
  } = useSesion();
  const { categorias } = useCategorias();
  const [cambiandoFoto, setCambiandoFoto] = useState(false);
  const [cantidadFavoritos, setCantidadFavoritos] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!usuario) return;
      listarFavoritos(usuario.id)
        .then((favoritos) => setCantidadFavoritos(favoritos.length))
        .catch(() => setCantidadFavoritos(null));
    }, [usuario]),
  );

  function elegirOrigenDeFoto() {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Cancelar", "Sacar foto", "Elegir de la galería"], cancelButtonIndex: 0 },
        (indice) => {
          if (indice === 1) procesarFoto(sacarFotoDePerfil);
          if (indice === 2) procesarFoto(elegirFotoDeGaleria);
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

  function alternarCategoria(categoriaId: string) {
    cambiarCategoriasFavoritas(
      categoriasFavoritas.includes(categoriaId)
        ? categoriasFavoritas.filter((id) => id !== categoriaId)
        : [...categoriasFavoritas, categoriaId],
    );
  }

  // El aviso necesita dos permisos, y se piden recién acá, cuando el turista
  // prende el interruptor: es el "permiso en contexto" de la Unidad 4. Si
  // alguno se niega, el interruptor vuelve a apagado y se explica por qué.
  async function alternarProximidad(activar: boolean) {
    if (!activar) {
      cambiarProximidad({ ...proximidad, activo: false });
      return;
    }
    let ubicacion = await consultarPermisoDeUbicacion();
    if (!ubicacion.concedido) ubicacion = await pedirPermisoDeUbicacion();
    const notificaciones = ubicacion.concedido && (await pedirPermisoDeNotificaciones());

    if (!ubicacion.concedido || !notificaciones) {
      Alert.alert(
        "No se pudo activar",
        "El aviso de proximidad necesita tu ubicación y permiso para mostrar notificaciones. Podés habilitarlos desde los ajustes del teléfono.",
        [
          { text: "Ahora no", style: "cancel" },
          { text: "Abrir ajustes", onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }
    cambiarProximidad({ ...proximidad, activo: true });
  }

  // Pide el permiso (en contexto: el turista tocó "probar"), registra el
  // teléfono en la API y le pide al servidor una push de prueba.
  async function probarNotificacionesPush() {
    if (!(await pedirPermisoDeNotificaciones())) {
      Alert.alert("Notificaciones desactivadas", "Habilitá las notificaciones de Mi Ciudad desde los ajustes del teléfono.", [
        { text: "Ahora no", style: "cancel" },
        { text: "Abrir ajustes", onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    const tokenExpo = await registrarDispositivoPush();
    if (!tokenExpo) {
      Alert.alert(
        "Push no disponible",
        "Este teléfono no pudo registrarse para recibir avisos del servidor. Las push necesitan la app instalada (no Expo Go en Android) y conexión a internet.",
      );
      return;
    }
    try {
      const enviadas = await probarPush();
      Alert.alert("Listo", enviadas > 0 ? "En unos segundos te llega una notificación de prueba." : "No hay teléfonos registrados en tu cuenta.");
    } catch {
      Alert.alert("No se pudo enviar", "El servidor no respondió. Probá de nuevo en un rato.");
    }
  }

  if (!usuario) {
    // Sin sesión, la pestaña muestra el formulario directamente: al ingresar,
    // el turista queda en esta misma pantalla, ya con su perfil cargado.
    return (
      <SafeAreaView style={[styles.contenedor, { backgroundColor: tema.fondo }]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollLogin} keyboardShouldPersistTaps="handled">
            <FormularioLogin />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.contenedor, { backgroundColor: tema.fondo }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.cabecera}>
          <Pressable
            onPress={elegirOrigenDeFoto}
            disabled={cambiandoFoto}
            accessibilityRole="button"
            accessibilityLabel="Cambiar foto de perfil"
          >
            {usuario.avatarUrl ? (
              <Image source={{ uri: usuario.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarVacio, { backgroundColor: tema.primario }]}>
                <Text style={styles.inicial}>{usuario.nombre.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={[styles.iconoEditar, { backgroundColor: tema.superficie, borderColor: tema.fondo }]}>
              <Ionicons name="camera" size={14} color={tema.primario} />
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.nombre, { color: tema.textoPrincipal }]} numberOfLines={1}>
              {usuario.nombre}
            </Text>
            <Text style={[styles.email, { color: tema.textoSecundario }]} numberOfLines={1}>
              {usuario.email}
            </Text>
          </View>
        </View>

        <View style={[styles.tarjeta, { backgroundColor: tema.superficie }]}>
          <Pressable style={styles.fila} onPress={() => router.push("/favoritos")} accessibilityRole="button">
            <Ionicons name="heart" size={20} color={tema.acento} />
            <Text style={[styles.filaTexto, { color: tema.textoPrincipal }]}>Mis favoritos</Text>
            {cantidadFavoritos !== null && (
              <Text style={[styles.valor, { color: tema.textoSecundario }]}>{cantidadFavoritos}</Text>
            )}
            <Ionicons name="chevron-forward" size={18} color={tema.textoSecundario} />
          </Pressable>

          <View style={[styles.separador, { backgroundColor: tema.borde }]} />

          <View style={styles.fila}>
            <Ionicons name="pricetags-outline" size={20} color={tema.primario} />
            <Text style={[styles.filaTexto, { color: tema.textoPrincipal }]}>Categorías favoritas</Text>
          </View>
          <View style={[styles.filaChips, styles.chipsQueBajan]}>
            {categorias.map((categoria) => (
              <Chip
                key={categoria.id}
                etiqueta={categoria.nombre}
                activo={categoriasFavoritas.includes(categoria.id)}
                onPress={() => alternarCategoria(categoria.id)}
              />
            ))}
          </View>

          <View style={[styles.separador, { backgroundColor: tema.borde }]} />

          <View style={styles.fila}>
            <Ionicons name="navigate-circle-outline" size={20} color={tema.primario} />
            <Text style={[styles.filaTexto, { color: tema.textoPrincipal }]}>Aviso de proximidad</Text>
            <Switch
              value={proximidad.activo}
              onValueChange={alternarProximidad}
              trackColor={{ true: tema.primario }}
              accessibilityLabel="Aviso de proximidad"
            />
          </View>
          {proximidad.activo && (
            <>
              <Text style={[styles.ayuda, { color: tema.textoSecundario }]}>
                Te avisamos cuando pases cerca de uno de tus lugares favoritos o de un lugar de tus categorías
                favoritas, una sola vez por lugar y por día, mientras la app esté abierta.
              </Text>
              <View style={styles.filaChips}>
                {RADIOS.map((radio) => (
                  <Chip
                    key={radio}
                    etiqueta={`${radio} m`}
                    activo={proximidad.radioMetros === radio}
                    onPress={() => cambiarProximidad({ ...proximidad, radioMetros: radio })}
                  />
                ))}
              </View>
            </>
          )}

          <View style={[styles.separador, { backgroundColor: tema.borde }]} />

          <Pressable style={styles.fila} onPress={probarNotificacionesPush} accessibilityRole="button">
            <Ionicons name="notifications-outline" size={20} color={tema.primario} />
            <Text style={[styles.filaTexto, { color: tema.textoPrincipal }]}>Probar notificaciones push</Text>
            <Ionicons name="chevron-forward" size={18} color={tema.textoSecundario} />
          </Pressable>

          <View style={[styles.separador, { backgroundColor: tema.borde }]} />

          <View style={styles.fila}>
            <Ionicons name="contrast-outline" size={20} color={tema.primario} />
            <Text style={[styles.filaTexto, { color: tema.textoPrincipal }]}>Tema</Text>
          </View>
          <View style={styles.filaChips}>
            {OPCIONES_TEMA.map((opcion) => (
              <Chip
                key={opcion.valor}
                etiqueta={opcion.etiqueta}
                activo={temaPreferencia === opcion.valor}
                onPress={() => cambiarTema(opcion.valor)}
              />
            ))}
          </View>

          <View style={[styles.separador, { backgroundColor: tema.borde }]} />

          <Pressable style={styles.fila} onPress={cerrar} disabled={cambiandoFoto} accessibilityRole="button">
            <Ionicons name="log-out-outline" size={20} color={tema.error} />
            <Text style={[styles.filaTexto, { color: tema.error }]}>Cerrar sesión</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface PropsChip {
  readonly etiqueta: string;
  readonly activo: boolean;
  readonly onPress: () => void;
}

function Chip({ etiqueta, activo, onPress }: PropsChip) {
  const tema = useTema();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      style={[styles.chip, { backgroundColor: activo ? tema.primario : `${tema.primario}18` }]}
    >
      <Text style={[styles.textoChip, { color: activo ? "#FFFFFF" : tema.primario }]}>{etiqueta}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  scroll: { padding: 20, paddingTop: 24 },
  scrollLogin: { flexGrow: 1, justifyContent: "center", padding: 26 },
  cabecera: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarVacio: { alignItems: "center", justifyContent: "center" },
  inicial: { color: "#FFFFFF", fontSize: 28, fontWeight: "800" },
  iconoEditar: { position: "absolute", right: -2, bottom: -2, width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  nombre: { fontSize: 21, fontWeight: "800" },
  email: { fontSize: 14, marginTop: 2 },
  tarjeta: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 6 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 52 },
  filaTexto: { flex: 1, fontSize: 16, fontWeight: "600" },
  valor: { fontSize: 15 },
  ayuda: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  separador: { height: 1 },
  filaChips: { flexDirection: "row", gap: 8, paddingBottom: 12 },
  chipsQueBajan: { flexWrap: "wrap" },
  chip: { minHeight: 40, paddingHorizontal: 16, borderRadius: 100, justifyContent: "center" },
  textoChip: { fontSize: 14, fontWeight: "700" },
});
