import * as LocalAuthentication from "expo-local-authentication";

export async function hayBiometriaDisponible(): Promise<boolean> {
  const tieneHardware = await LocalAuthentication.hasHardwareAsync();
  if (!tieneHardware) return false;
  return LocalAuthentication.isEnrolledAsync();
}

export async function autenticarConBiometria(): Promise<boolean> {
  const resultado = await LocalAuthentication.authenticateAsync({
    promptMessage: "Ingresá con tu huella o rostro",
    cancelLabel: "Cancelar",
  });
  return resultado.success;
}
