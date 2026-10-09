import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Magnetometer } from "expo-sensors";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { Coordenadas } from "@/tipos";
import { useTema } from "@/hooks/use-tema";
import { distanciaEnMetros, formatearDistancia, puntoCardinal, rumboEnGrados } from "@/utils/geo";

interface Props {
  desde: Coordenadas;
  hacia: Coordenadas;
}

// Con el teléfono horizontal, el eje y del magnetómetro apunta hacia arriba
// de la pantalla y el x hacia la derecha. El campo magnético apunta al norte,
// así que el ángulo entre ese vector y el eje y es hacia dónde mira el
// teléfono (0 = norte, en sentido horario).
function rumboDelTelefono(x: number, y: number): number {
  return ((Math.atan2(-x, y) * 180) / Math.PI + 360) % 360;
}

// Diferencia angular más corta entre dos rumbos, en el rango [-180, 180).
function diferencia(de: number, a: number): number {
  return ((a - de + 540) % 360) - 180;
}

/**
 * La flecha que pide el PRD cuando el lugar está lejos y no se ve el cartel.
 * El texto con el punto cardinal sale solo de las coordenadas, así que es
 * correcto aunque el teléfono no tenga magnetómetro; la flecha, que sí lo
 * necesita, solo aparece si el sensor existe.
 */
export function FlechaHaciaLugar({ desde, hacia }: Props) {
  const tema = useTema();
  const [rumboTelefono, setRumboTelefono] = useState<number | null>(null);

  useEffect(() => {
    let suscripcion: { remove: () => void } | null = null;
    let suelto = false;

    (async () => {
      if (!(await Magnetometer.isAvailableAsync()) || suelto) return; // 1 · ¿existe?
      Magnetometer.setUpdateInterval(200); //                             2 · cada 200 ms
      suscripcion = Magnetometer.addListener(({ x, y }) => { //           3 · escuchar
        const lectura = rumboDelTelefono(x, y);
        // Filtro paso bajo: el magnetómetro tiembla mucho, y sin suavizar la
        // flecha salta de un lado a otro aunque el teléfono esté quieto.
        setRumboTelefono((anterior) =>
          anterior === null ? lectura : (anterior + diferencia(anterior, lectura) * 0.2 + 360) % 360,
        );
      });
    })();

    return () => {
      suelto = true;
      suscripcion?.remove(); //                                           4 · soltar
    };
  }, []);

  const rumbo = rumboEnGrados(desde, hacia);
  const texto = `Queda a ${formatearDistancia(distanciaEnMetros(desde, hacia))} hacia el ${puntoCardinal(rumbo)}`;
  const giro = rumboTelefono === null ? null : rumbo - rumboTelefono;

  return (
    <View
      style={[styles.contenedor, { backgroundColor: tema.superficie, borderColor: tema.borde }]}
      accessible
      accessibilityLabel={texto}
    >
      {giro !== null && (
        <View style={[styles.circulo, { backgroundColor: `${tema.primario}18` }]}>
          <View style={{ transform: [{ rotate: `${giro}deg` }] }}>
            <Ionicons name="arrow-up" size={28} color={tema.primario} />
          </View>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.texto, { color: tema.textoPrincipal }]}>{texto}</Text>
        {giro !== null && (
          <Text style={[styles.ayuda, { color: tema.textoSecundario }]}>
            Sostené el teléfono horizontal y seguí la flecha.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  circulo: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  texto: { fontSize: 15, fontWeight: "700" },
  ayuda: { fontSize: 13, marginTop: 2 },
});
