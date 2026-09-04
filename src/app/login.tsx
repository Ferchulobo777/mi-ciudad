import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTema } from "@/hooks/use-tema";
import { FormularioLogin } from "@/components/formulario-login";

export default function Login() {
  const tema = useTema();

  return (
    <SafeAreaView style={[styles.contenedor, { backgroundColor: tema.fondo }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <FormularioLogin onExito={() => router.back()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 26, paddingVertical: 32 },
});
