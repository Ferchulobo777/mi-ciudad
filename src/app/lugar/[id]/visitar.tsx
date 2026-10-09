import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Linking, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { Lugar, OrigenVisita } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { useSesion } from "@/hooks/use-sesion";
import { Boton } from "@/components/boton";
import { obtenerLugar } from "@/servicios/lugares";
import { registrarVisita, sincronizarVisitasPendientes } from "@/servicios/visitas";
import { obtenerPosicionActual } from "@/servicios/ubicacion";
import { carpetaPrivada, copiarComoArchivoPrivado } from "@/servicios/almacenamiento-archivos";
import { vibrarConfirmacion } from "@/servicios/hapticos";
import { distanciaEnMetros } from "@/utils/geo";
import { interpretarCodigoQr } from "@/utils/codigo-qr";

const UMBRAL_CERCANIA_METROS = 200;
const SEGUNDOS_MENSAJE_ESCANER = 2.5;

const OPCIONES_ORIGEN: { valor: OrigenVisita; etiqueta: string; icono: string; detalle: string }[] = [
  { valor: "qr", etiqueta: "Escanear código QR", icono: "qr-code-outline", detalle: "El cartel en la entrada del lugar" },
  { valor: "gps", etiqueta: "Por cercanía", icono: "location-outline", detalle: "Usando tu ubicación actual" },
  { valor: "manual", etiqueta: "Cargar manual", icono: "create-outline", detalle: "Si no tenés señal ni QR a mano" },
];

function ofrecerAjustes(titulo: string, mensaje: string) {
  Alert.alert(titulo, mensaje, [
    { text: "Ahora no", style: "cancel" },
    { text: "Abrir ajustes", onPress: () => Linking.openSettings() },
  ]);
}

export default function RegistrarVisita() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tema = useTema();
  const { usuario } = useSesion();

  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [origen, setOrigen] = useState<OrigenVisita | null>(null);
  const [validando, setValidando] = useState<OrigenVisita | null>(null);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mostrarEscaner, setMostrarEscaner] = useState(false);
  const [mensajeEscaner, setMensajeEscaner] = useState<string | null>(null);
  const [permisoCamara, pedirPermisoCamara] = useCameraPermissions();
  // Bandera para el escáner: onBarcodeScanned se dispara en cada cuadro en
  // el que el código es visible, decenas de veces por segundo. Mientras se
  // procesa (o se muestra un aviso) se dejan de leer códigos.
  const procesandoCodigo = useRef(false);

  useEffect(() => {
    if (id) obtenerLugar(id).then(setLugar).catch(() => setLugar(null));
  }, [id]);

  async function elegirOrigen(valor: OrigenVisita) {
    if (!lugar) return;

    if (valor === "qr") {
      if (!lugar.codigoQr) {
        Alert.alert("Sin código QR", "Este lugar todavía no tiene cartel con código QR. Probá por cercanía o manual.");
        return;
      }
      // permisoCamara es null mientras el hook todavía lo está consultando.
      if (!permisoCamara?.granted) {
        const resultado = await pedirPermisoCamara();
        if (!resultado.granted) {
          if (!resultado.canAskAgain) {
            ofrecerAjustes("Cámara desactivada", "Para escanear el QR habilitá la cámara desde los ajustes. Mientras tanto podés registrar la visita por cercanía o manual.");
          }
          return;
        }
      }
      procesandoCodigo.current = false;
      setMensajeEscaner(null);
      setMostrarEscaner(true);
      return;
    }

    if (valor === "gps") {
      setValidando("gps");
      const posicion = await obtenerPosicionActual();
      setValidando(null);
      if (!posicion) {
        Alert.alert("Sin ubicación", "No pudimos acceder a tu ubicación. Probá con el código QR o la carga manual.");
        return;
      }
      const distancia = distanciaEnMetros(posicion, lugar.coordenadas);
      if (distancia > UMBRAL_CERCANIA_METROS) {
        Alert.alert("Todavía estás lejos", `Estás a ${Math.round(distancia)} m de ${lugar.nombre}. Acercate un poco más.`);
        return;
      }
      setOrigen("gps");
      return;
    }

    setOrigen("manual");
  }

  function mostrarAvisoEnEscaner(texto: string) {
    setMensajeEscaner(texto);
    setTimeout(() => {
      setMensajeEscaner(null);
      procesandoCodigo.current = false;
    }, SEGUNDOS_MENSAJE_ESCANER * 1000);
  }

  // El PRD pide que un QR ajeno o roto no rompa ni cuelgue la app: en vez de
  // ignorarlo en silencio (que se ve como si la cámara no anduviera), se le
  // dice al turista qué pasó y se sigue escaneando.
  function alEscanear({ data }: { data: string }) {
    if (!lugar || procesandoCodigo.current) return;
    procesandoCodigo.current = true;

    const resultado = interpretarCodigoQr(data);
    if (resultado.tipo === "ajeno") {
      mostrarAvisoEnEscaner("Ese código no es de Mi Ciudad. Buscá el cartel del lugar.");
      return;
    }
    if (resultado.lugarId !== lugar.id) {
      mostrarAvisoEnEscaner(`Ese código es de otro lugar. Buscá el cartel de ${lugar.nombre}.`);
      return;
    }
    setMostrarEscaner(false);
    setOrigen("qr");
  }

  async function elegirFoto(origenFoto: "camara" | "galeria") {
    const permiso =
      origenFoto === "camara"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      if (!permiso.canAskAgain) {
        ofrecerAjustes("Permiso desactivado", "La foto es opcional: podés registrar la visita sin ella, o habilitar el permiso desde los ajustes.");
      }
      return;
    }

    const opciones: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.7 };
    const resultado =
      origenFoto === "camara"
        ? await ImagePicker.launchCameraAsync(opciones)
        : await ImagePicker.launchImageLibraryAsync(opciones);
    if (resultado.canceled) return;

    // La foto llega a la caché, que el sistema puede vaciar: se copia a los
    // documentos de la app para que siga estando en el recorrido mañana.
    const carpeta = carpetaPrivada("visitas");
    setFotoUri(await copiarComoArchivoPrivado(carpeta, `${Date.now()}.jpg`, resultado.assets[0].uri));
  }

  function preguntarOrigenFoto() {
    Alert.alert("Foto de la visita", "¿De dónde la sacamos?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cámara", onPress: () => elegirFoto("camara") },
      { text: "Galería", onPress: () => elegirFoto("galeria") },
    ]);
  }

  async function confirmarRegistro() {
    if (!usuario || !lugar || !origen) return;
    setEnviando(true);
    await registrarVisita(usuario.id, {
      lugarId: lugar.id,
      fechaHora: new Date().toISOString(),
      origen,
      fotoUri,
      nota: nota.trim() || null,
    });
    await vibrarConfirmacion();
    // Se intenta subir enseguida; sin señal queda en la cola y se sube sola
    // cuando vuelva la conexión.
    sincronizarVisitasPendientes(usuario.id).catch(() => {});
    setEnviando(false);
    router.dismissAll();
    router.navigate("/recorrido");
  }

  if (!lugar) {
    return (
      <View style={[styles.fondoModal, styles.centrado]}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={styles.fondoModal}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()} accessibilityLabel="Cerrar" />
      <View style={[styles.hoja, { backgroundColor: tema.fondo }]}>
        <View style={[styles.manija, { backgroundColor: tema.borde }]} />
        <Text style={[styles.titulo, { color: tema.textoPrincipal }]} accessibilityRole="header">
          Registrar visita
        </Text>
        <Text style={[styles.subtitulo, { color: tema.textoSecundario }]}>{lugar.nombre}</Text>

        <View style={{ gap: 10, marginBottom: 18 }}>
          {OPCIONES_ORIGEN.map((opcion) => (
            <Pressable
              key={opcion.valor}
              onPress={() => elegirOrigen(opcion.valor)}
              accessibilityRole="button"
              accessibilityState={{ selected: origen === opcion.valor }}
              style={[
                styles.opcion,
                { backgroundColor: tema.superficie },
                origen === opcion.valor && { borderColor: tema.primario },
              ]}
            >
              <Ionicons name={opcion.icono as never} size={24} color={tema.primario} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.opcionTitulo, { color: tema.textoPrincipal }]}>{opcion.etiqueta}</Text>
                <Text style={[styles.opcionDetalle, { color: tema.textoSecundario }]}>{opcion.detalle}</Text>
              </View>
              {validando === opcion.valor && <ActivityIndicator color={tema.primario} />}
              {origen === opcion.valor && <Ionicons name="checkmark-circle" size={22} color={tema.exito} />}
            </Pressable>
          ))}
        </View>

        {origen ? (
          <>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
              <Pressable
                onPress={preguntarOrigenFoto}
                accessibilityRole="button"
                accessibilityLabel={fotoUri ? "Cambiar la foto de la visita" : "Agregar una foto a la visita"}
                style={[styles.fotoBoton, { borderColor: tema.borde }]}
              >
                {fotoUri ? (
                  <Image source={{ uri: fotoUri }} style={styles.fotoPreview} />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={22} color={tema.textoSecundario} />
                    <Text style={[styles.textoFoto, { color: tema.textoSecundario }]}>Foto</Text>
                  </>
                )}
              </Pressable>
              <TextInput
                value={nota}
                onChangeText={setNota}
                placeholder="Nota (opcional)"
                placeholderTextColor={tema.textoSecundario}
                multiline
                maxLength={280}
                accessibilityLabel="Nota de la visita"
                style={[styles.notaCampo, { backgroundColor: tema.superficie, color: tema.textoPrincipal, borderColor: tema.borde }]}
              />
            </View>

            <Boton etiqueta="Registrar visita" onPress={confirmarRegistro} cargando={enviando} deshabilitado={enviando} />
            <Text style={[styles.aclaracion, { color: tema.textoSecundario }]}>
              Sin señal, se guarda en tu teléfono y se sube sola cuando vuelva la conexión.
            </Text>
          </>
        ) : (
          <Boton etiqueta="Cancelar" variante="texto" onPress={() => router.back()} />
        )}
      </View>

      <Modal visible={mostrarEscaner} animationType="slide" onRequestClose={() => setMostrarEscaner(false)}>
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={mostrarEscaner ? alEscanear : undefined}
          />
          <SafeAreaView style={styles.capaEscaner} pointerEvents="box-none">
            <Pressable
              onPress={() => setMostrarEscaner(false)}
              accessibilityRole="button"
              accessibilityLabel="Cerrar el escáner"
              style={styles.botonCerrarEscaner}
            >
              <Ionicons name="close" size={24} color="#1F2A2E" />
            </Pressable>
          </SafeAreaView>
          <View style={styles.pieEscaner} pointerEvents="none">
            <Text style={styles.textoEscaner} accessibilityLiveRegion="polite">
              {mensajeEscaner ?? `Apuntá al código QR del cartel de ${lugar.nombre}`}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centrado: { alignItems: "center", justifyContent: "center" },
  fondoModal: { flex: 1, backgroundColor: "rgba(31,42,46,0.55)", justifyContent: "flex-end" },
  hoja: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 36 },
  manija: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 18 },
  titulo: { fontSize: 21, fontWeight: "800", marginBottom: 4 },
  subtitulo: { fontSize: 15, marginBottom: 18 },
  opcion: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 14, padding: 14, borderWidth: 2, borderColor: "transparent", minHeight: 64 },
  opcionTitulo: { fontSize: 16, fontWeight: "700" },
  opcionDetalle: { fontSize: 13 },
  fotoBoton: { width: 92, height: 92, borderRadius: 12, borderWidth: 2, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 6, overflow: "hidden" },
  fotoPreview: { width: "100%", height: "100%" },
  textoFoto: { fontSize: 13, fontWeight: "700" },
  notaCampo: { flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 12, fontSize: 15, textAlignVertical: "top" },
  aclaracion: { fontSize: 13, textAlign: "center", marginTop: 10 },
  capaEscaner: { position: "absolute", top: 0, left: 0, right: 0, alignItems: "flex-end", padding: 16 },
  botonCerrarEscaner: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center", margin: 16 },
  pieEscaner: { position: "absolute", left: 20, right: 20, bottom: 60, backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 14, padding: 16 },
  textoEscaner: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", textAlign: "center" },
});
