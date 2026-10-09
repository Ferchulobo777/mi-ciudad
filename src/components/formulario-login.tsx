import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useSesion } from "@/hooks/use-sesion";
import { useTema } from "@/hooks/use-tema";
import { CampoTexto } from "@/components/campo-texto";
import { Boton } from "@/components/boton";
import { validarLogin, type ErroresLogin } from "@/utils/validaciones";
import { iniciarSesion, reingresarConBiometria, ErrorDeAutenticacion } from "@/servicios/auth";
import { guardarUltimoEmail, leerUltimoEmail } from "@/servicios/sesion-almacenamiento";
import { hayBiometriaDisponible, autenticarConBiometria } from "@/servicios/biometria";

interface Props {
  /** Se llama después de un ingreso exitoso. En una pantalla modal navega hacia
   * atrás; embebido en una tab no hace falta (el estado de sesión ya alcanza
   * para que la pantalla se vuelva a renderizar como usuario ingresado). */
  onExito?: () => void;
  /** true cuando el formulario se muestra en la pantalla modal de Login (y no
   * embebido en la pestaña Yo): ofrece "Seguir sin cuenta" para cerrarla. */
  esModal?: boolean;
}

// Formulario compartido entre la pantalla de Login y la tab Yo: se mostraba
// en dos lugares con la misma lógica duplicada, y una pantalla intermedia de
// "todavía no ingresaste" antes de llegar acá que no sumaba nada.
export function FormularioLogin({ onExito, esModal = false }: Props) {
  const tema = useTema();
  const sesion = useSesion();

  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [errores, setErrores] = useState<ErroresLogin>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [emailParaBiometria, setEmailParaBiometria] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const ultimoEmail = await leerUltimoEmail();
      if (!ultimoEmail) return;
      const disponible = await hayBiometriaDisponible();
      if (disponible) setEmailParaBiometria(ultimoEmail);
    })();
  }, []);

  // Se valida recién al salir del campo, no en cada tecla (así no se le grita
  // "email inválido" a alguien que todavía está a la mitad de escribirlo).
  function validarAlSalirDeEmail() {
    setErrores((previos) => ({ ...previos, ...validarLogin(email, contrasena) }));
  }
  function validarAlSalirDeContrasena() {
    setErrores((previos) => ({ ...previos, ...validarLogin(email, contrasena) }));
  }

  async function enviar() {
    const erroresActuales = validarLogin(email, contrasena);
    setErrores(erroresActuales);
    if (erroresActuales.email || erroresActuales.contrasena) return;

    setErrorGeneral(null);
    setCargando(true);
    try {
      const { token, usuario } = await iniciarSesion(email, contrasena);
      await guardarUltimoEmail(email);
      await sesion.iniciar(token, usuario);
      onExito?.();
    } catch (error) {
      setErrorGeneral(
        error instanceof ErrorDeAutenticacion ? error.message : "No se pudo ingresar. Probá de nuevo.",
      );
    } finally {
      setCargando(false);
    }
  }

  async function ingresarConHuella() {
    if (!emailParaBiometria) return;
    const confirmado = await autenticarConBiometria();
    if (!confirmado) return;

    setCargando(true);
    setErrorGeneral(null);
    try {
      const { token, usuario } = await reingresarConBiometria(emailParaBiometria);
      await sesion.iniciar(token, usuario);
      onExito?.();
    } catch {
      setErrorGeneral("No se pudo reingresar con huella. Ingresá con tu contraseña.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <View>
      <View style={[styles.icono, { backgroundColor: tema.primario }]}>
        <Ionicons name="location" size={32} color="#FFFFFF" />
      </View>
      <Text style={[styles.titulo, { color: tema.textoPrincipal }]}>Ingresar</Text>
      <Text style={[styles.bajada, { color: tema.textoSecundario }]}>
        Para guardar favoritos y tu recorrido. No hace falta para ver el catálogo o el mapa.
      </Text>

      {errorGeneral ? (
        <View style={[styles.bannerError, { backgroundColor: `${tema.error}1A`, borderColor: tema.error }]}>
          <Text style={{ color: tema.error, fontWeight: "600" }}>{errorGeneral}</Text>
        </View>
      ) : null}

      <CampoTexto
        testID="campo-email"
        etiqueta="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        onBlur={validarAlSalirDeEmail}
        error={errores.email}
        placeholder="turista@correo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="emailAddress"
      />
      <CampoTexto
        testID="campo-contrasena"
        etiqueta="Contraseña"
        value={contrasena}
        onChangeText={setContrasena}
        onBlur={validarAlSalirDeContrasena}
        error={errores.contrasena}
        secureTextEntry
        textContentType="password"
      />

      <Boton etiqueta="Ingresar" onPress={enviar} cargando={cargando} deshabilitado={cargando} />

      {emailParaBiometria ? (
        <View style={{ marginTop: 12 }}>
          <Boton
            etiqueta="Ingresar con huella"
            variante="secundario"
            onPress={ingresarConHuella}
            deshabilitado={cargando}
          />
        </View>
      ) : null}

      {esModal ? (
        <View style={{ marginTop: 8 }}>
          <Boton etiqueta="Seguir sin cuenta" variante="texto" onPress={() => router.back()} />
        </View>
      ) : null}

      <Text style={[styles.pie, { color: tema.textoSecundario }]}>
        ¿No tenés cuenta?{" "}
        {/* Desde el modal de Login se reemplaza en vez de apilar: así, al
            terminar el registro, "atrás" vuelve directo a la pantalla que pidió
            la cuenta (por ejemplo, el lugar que se quería marcar como favorito). */}
        <Text
          style={{ color: tema.primario, fontWeight: "700" }}
          onPress={() => (esModal ? router.replace("/registro") : router.push("/registro"))}
        >
          Registrate
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
