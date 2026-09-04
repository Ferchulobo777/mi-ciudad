import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useSesion } from "@/hooks/use-sesion";
import { useTema } from "@/hooks/use-tema";
import { Boton } from "@/components/boton";

// Preferencias, tema y cerrar sesión de verdad se suman cuando exista la
// pantalla completa de Perfil (Mockups-Propuestas/MiCiudad-Perfil.dc.html).
// Por ahora resuelve el ingreso, el registro y el cierre de sesión.
export default function Yo() {
  const tema = useTema();
  const { usuario, token, cerrar } = useSesion();

  return (
    <SafeAreaView style={[styles.contenedor, { backgroundColor: tema.fondo }]}>
      {token && usuario ? (
        <>
          <View style={[styles.avatar, { backgroundColor: tema.primario }]}>
            <Text style={styles.inicial}>{usuario.nombre.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={[styles.nombre, { color: tema.textoPrincipal }]}>{usuario.nombre}</Text>
          <Text style={{ color: tema.textoSecundario, marginBottom: 28 }}>{usuario.email}</Text>
          <Boton etiqueta="Cerrar sesión" variante="secundario" onPress={cerrar} />
        </>
      ) : (
        <>
          <Text style={[styles.titulo, { color: tema.textoPrincipal }]}>Todavía no ingresaste</Text>
          <Text style={[styles.texto, { color: tema.textoSecundario }]}>
            Ingresá o creá una cuenta para guardar tus favoritos y tu recorrido.
          </Text>
          <View style={styles.acciones}>
            <Boton etiqueta="Ingresar" onPress={() => router.push("/login")} />
            <Boton etiqueta="Crear cuenta" variante="secundario" onPress={() => router.push("/registro")} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  inicial: { color: "#FFFFFF", fontSize: 26, fontWeight: "800" },
  nombre: { fontSize: 20, fontWeight: "800" },
  titulo: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
  texto: { fontSize: 14, textAlign: "center", marginBottom: 24, lineHeight: 20 },
  acciones: { width: "100%", gap: 12 },
});
