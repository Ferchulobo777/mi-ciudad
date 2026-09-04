import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useSesion } from "@/hooks/use-sesion";
import { useTema } from "@/hooks/use-tema";
import { CampoTexto } from "@/components/campo-texto";
import { Boton } from "@/components/boton";
import { validarRegistro, type ErroresRegistro } from "@/utils/validaciones";
import { registrarCuenta, ErrorDeAutenticacion } from "@/servicios/auth";
import { guardarUltimoEmail } from "@/servicios/sesion-almacenamiento";

export default function Registro() {
  const tema = useTema();
  const sesion = useSesion();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [errores, setErrores] = useState<ErroresRegistro & { confirmacion?: string }>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  function revalidar() {
    const erroresCampos = validarRegistro(nombre, email, contrasena);
    setErrores((previos) => ({
      ...previos,
      ...erroresCampos,
      confirmacion: confirmacion && confirmacion !== contrasena ? "Las contraseñas no coinciden." : undefined,
    }));
  }

  async function enviar() {
    const erroresCampos = validarRegistro(nombre, email, contrasena);
    const erroresConfirmacion = confirmacion !== contrasena ? "Las contraseñas no coinciden." : undefined;
    setErrores({ ...erroresCampos, confirmacion: erroresConfirmacion });
    if (erroresCampos.nombre || erroresCampos.email || erroresCampos.contrasena || erroresConfirmacion) return;

    setErrorGeneral(null);
    setCargando(true);
    try {
      const { token, usuario } = await registrarCuenta(nombre, email, contrasena);
      await guardarUltimoEmail(email);
      await sesion.iniciar(token, usuario);
      router.replace("/");
    } catch (error) {
      setErrorGeneral(
        error instanceof ErrorDeAutenticacion ? error.message : "No se pudo crear la cuenta. Probá de nuevo.",
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <SafeAreaView style={[styles.contenedor, { backgroundColor: tema.fondo }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.icono, { backgroundColor: tema.primario }]}>
            <Ionicons name="person-add" size={28} color="#FFFFFF" />
          </View>
          <Text style={[styles.titulo, { color: tema.textoPrincipal }]}>Crear cuenta</Text>
          <Text style={[styles.bajada, { color: tema.textoSecundario }]}>
            Guardá tus favoritos y tu recorrido entre dispositivos.
          </Text>

          {errorGeneral ? (
            <View style={[styles.bannerError, { backgroundColor: `${tema.error}1A`, borderColor: tema.error }]}>
              <Text style={{ color: tema.error, fontWeight: "600" }}>{errorGeneral}</Text>
            </View>
          ) : null}

          <CampoTexto
            etiqueta="Nombre"
            value={nombre}
            onChangeText={setNombre}
            onBlur={revalidar}
            error={errores.nombre}
            placeholder="Nombre y apellido"
            textContentType="name"
          />
          <CampoTexto
            etiqueta="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            onBlur={revalidar}
            error={errores.email}
            placeholder="turista@correo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
          />
          <CampoTexto
            etiqueta="Contraseña"
            value={contrasena}
            onChangeText={setContrasena}
            onBlur={revalidar}
            error={errores.contrasena}
            secureTextEntry
            textContentType="newPassword"
          />
          <CampoTexto
            etiqueta="Repetir contraseña"
            value={confirmacion}
            onChangeText={setConfirmacion}
            onBlur={revalidar}
            error={errores.confirmacion}
            secureTextEntry
            textContentType="newPassword"
          />

          <Boton etiqueta="Crear cuenta" onPress={enviar} cargando={cargando} deshabilitado={cargando} />

          <Text style={[styles.pie, { color: tema.textoSecundario }]}>
            ¿Ya tenés cuenta?{" "}
            <Text style={{ color: tema.primario, fontWeight: "700" }} onPress={() => router.replace("/login")}>
              Ingresá
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 26, paddingVertical: 32 },
  icono: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 18,
  },
  titulo: { fontSize: 26, fontWeight: "800", marginBottom: 6, textAlign: "center" },
  bajada: { fontSize: 13, marginBottom: 26, lineHeight: 18, textAlign: "center" },
  bannerError: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  pie: { textAlign: "center", marginTop: 24, fontSize: 13 },
});
