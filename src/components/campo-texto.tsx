import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useTema } from "@/hooks/use-tema";

interface Props extends TextInputProps {
  etiqueta: string;
  error?: string;
}

export function CampoTexto({ etiqueta, error, style, secureTextEntry, ...resto }: Props) {
  const tema = useTema();
  // Si el campo es de contraseña, arranca oculto; el ojito lo destapa a pedido.
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  return (
    <View style={styles.contenedor}>
      <Text style={[styles.etiqueta, { color: tema.textoSecundario }]}>{etiqueta}</Text>
      <View style={styles.filaCampo}>
        <TextInput
          style={[
            styles.campo,
            secureTextEntry ? styles.campoConIcono : null,
            {
              backgroundColor: tema.superficie,
              borderColor: error ? tema.error : tema.borde,
              color: tema.textoPrincipal,
            },
            style,
          ]}
          placeholderTextColor={tema.textoSecundario}
          // Tamaño mínimo de toque cómodo (44pt) y sin autocorrección agresiva en
          // campos de credenciales, para no pelear con lo que el usuario escribe.
          autoCorrect={false}
          secureTextEntry={secureTextEntry && !mostrarContrasena}
          {...resto}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setMostrarContrasena((valor) => !valor)}
            style={styles.botonOjo}
            accessibilityRole="button"
            accessibilityLabel={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
            hitSlop={8}
          >
            <Ionicons
              name={mostrarContrasena ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={tema.textoSecundario}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={[styles.error, { color: tema.error }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginBottom: 18 },
  etiqueta: { fontSize: 12, fontWeight: "700", marginBottom: 6 },
  filaCampo: { justifyContent: "center" },
  campo: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 48,
  },
  campoConIcono: { paddingRight: 46 },
  botonOjo: { position: "absolute", right: 14, height: 44, justifyContent: "center" },
  error: { fontSize: 12, marginTop: 6, fontWeight: "600" },
});
