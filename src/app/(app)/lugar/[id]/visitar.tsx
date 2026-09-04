import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { Lugar, OrigenVisita } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { useSesion } from "@/hooks/use-sesion";
import { Boton } from "@/components/boton";
import { obtenerLugar, distanciaEnMetros } from "@/servicios/lugares";
import { registrarVisita } from "@/servicios/visitas";
import { obtenerPosicionActual } from "@/servicios/ubicacion";
import { carpetaPrivada, copiarComoArchivoPrivado } from "@/servicios/almacenamiento-archivos";

const UMBRAL_CERCANIA_METROS = 200;
const carpetaVisitas = carpetaPrivada("visitas");

const OPCIONES_ORIGEN: { valor: OrigenVisita; etiqueta: string; icono: string; detalle: string }[] = [
  { valor: "qr", etiqueta: "Escanear código QR", icono: "qr-code-outline", detalle: "El cartel en la entrada del lugar" },
  { valor: "gps", etiqueta: "Por cercanía", icono: "location-outline", detalle: "Usando tu ubicación actual" },
  { valor: "manual", etiqueta: "Cargar manual", icono: "create-outline", detalle: "Si no tenés señal ni QR a mano" },
];

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
  const [permisoCamara, pedirPermisoCamara] = useCameraPermissions();

  useEffect(() => {
    if (id) obtenerLugar(id).then(setLugar);
  }, [id]);

  async function elegirOrigen(valor: OrigenVisita) {
    if (!lugar) return;

    if (valor === "qr") {
      if (!lugar.codigoQr) {
        Alert.alert("Sin código QR", "Este lugar no tiene código QR cargado. Probá por cercanía o manual.");
        return;
      }
      if (!permisoCamara?.granted) {
        const resultado = await pedirPermisoCamara();
        if (!resultado.granted) return;
      }
      setMostrarEscaner(true);
      return;
    }

    if (valor === "gps") {
      setValidando("gps");
      const posicion = await obtenerPosicionActual();
      setValidando(null);
      if (!posicion) {
        Alert.alert("Sin ubicación", "No pudimos acceder a tu ubicación. Probá con código QR o carga manual.");
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

  function alEscanear(resultado: { data: string }) {
    if (!lugar) return;
    if (resultado.data !== lugar.codigoQr) return; // sigue escaneando hasta que coincida
    setMostrarEscaner(false);
    setOrigen("qr");
  }

  async function elegirFoto(origenFoto: "camara" | "galeria") {
    const permiso =
      origenFoto === "camara"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) return;

    const opciones: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.7 };
    const resultado =
      origenFoto === "camara"
        ? await ImagePicker.launchCameraAsync(opciones)
        : await ImagePicker.launchImageLibraryAsync(opciones);
    if (resultado.canceled) return;

    const uri = await copiarComoArchivoPrivado(carpetaVisitas, `${Date.now()}.jpg`, resultado.assets[0].uri);
    setFotoUri(uri);
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
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEnviando(false);
    router.replace("/recorrido");
  }

  if (!lugar) {
    return (
      <SafeAreaView style={[styles.centrado, { backgroundColor: tema.fondo }]}>
        <ActivityIndicator color={tema.primario} />
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.fondoModal]}>
      <View style={[styles.hoja, { backgroundColor: tema.fondo }]}>
        <View style={[styles.manija, { backgroundColor: tema.borde }]} />
        <Text style={[styles.titulo, { color: tema.textoPrincipal }]}>Registrar visita</Text>
        <Text style={{ color: tema.textoSecundario, marginBottom: 18 }}>{lugar.nombre}</Text>

        <View style={{ gap: 10, marginBottom: 18 }}>
          {OPCIONES_ORIGEN.map((opcion) => (
            <Pressable
              key={opcion.valor}
              onPress={() => elegirOrigen(opcion.valor)}
              style={[
                styles.opcion,
                { backgroundColor: tema.superficie },
                origen === opcion.valor && { borderColor: tema.primario, borderWidth: 2 },
              ]}
            >
              <Ionicons name={opcion.icono as never} size={22} color={tema.primario} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.opcionTitulo, { color: tema.textoPrincipal }]}>{opcion.etiqueta}</Text>
                <Text style={{ color: tema.textoSecundario, fontSize: 12 }}>{opcion.detalle}</Text>
              </View>
              {validando === opcion.valor && <ActivityIndicator color={tema.primario} />}
              {origen === opcion.valor && <Ionicons name="checkmark-circle" size={20} color={tema.exito} />}
            </Pressable>
          ))}
        </View>

        {origen ? (
          <>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
              <Pressable
                onPress={() => elegirFoto("camara")}
                style={[styles.fotoBoton, { borderColor: tema.borde }]}
              >
                {fotoUri ? (
                  <Image source={{ uri: fotoUri }} style={styles.fotoPreview} />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={20} color={tema.textoSecundario} />
                    <Text style={{ color: tema.textoSecundario, fontSize: 11, fontWeight: "700" }}>Sacar foto</Text>
                  </>
                )}
              </Pressable>
              <TextInput
                value={nota}
                onChangeText={setNota}
                placeholder="Nota (opcional)"
                placeholderTextColor={tema.textoSecundario}
                multiline
                style={[styles.notaCampo, { backgroundColor: tema.superficie, color: tema.textoPrincipal, borderColor: tema.borde }]}
              />
            </View>

            <Boton etiqueta="Registrar visita" onPress={confirmarRegistro} cargando={enviando} deshabilitado={enviando} />
            <Text style={{ color: tema.textoSecundario, fontSize: 11, textAlign: "center", marginTop: 10 }}>
              Sin señal, se guarda en tu teléfono y se sube solo cuando vuelva la conexión.
            </Text>
          </>
        ) : (
          <Boton etiqueta="Cancelar" variante="texto" onPress={() => router.back()} />
        )}
      </View>

      <Modal visible={mostrarEscaner} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={alEscanear}
          />
          <SafeAreaView style={styles.cerrarEscaner}>
            <Pressable onPress={() => setMostrarEscaner(false)} style={styles.botonCerrarEscaner}>
              <Ionicons name="close" size={22} color="#1F2A2E" />
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centrado: { flex: 1, alignItems: "center", justifyContent: "center" },
  fondoModal: { flex: 1, backgroundColor: "rgba(31,42,46,0.55)", justifyContent: "flex-end" },
  hoja: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 36 },
  manija: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 18 },
  titulo: { fontSize: 19, fontWeight: "800", marginBottom: 4 },
  opcion: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 14, padding: 14, borderWidth: 2, borderColor: "transparent" },
  opcionTitulo: { fontSize: 14, fontWeight: "700" },
  fotoBoton: {
    width: 84,
    height: 84,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    overflow: "hidden",
  },
  fotoPreview: { width: "100%", height: "100%" },
  notaCampo: { flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 12, fontSize: 13, textAlignVertical: "top" },
  cerrarEscaner: { position: "absolute", top: 0, right: 0, padding: 16 },
  botonCerrarEscaner: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" },
});
