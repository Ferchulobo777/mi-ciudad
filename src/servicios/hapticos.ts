import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

// En Android se usa el motor háptico del sistema (performAndroidHapticsAsync),
// que es lo que recomienda la documentación: se siente igual que el resto del
// teléfono y no necesita el permiso VIBRATE. La vibración nunca es la única
// señal: siempre acompaña un cambio visible en pantalla.
export async function vibrarConfirmacion(): Promise<void> {
  try {
    if (Platform.OS === "android") {
      await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch {
    // Sin motor háptico (o en bajo consumo) no pasa nada: es un extra.
  }
}

export async function vibrarSeleccion(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Ídem.
  }
}
