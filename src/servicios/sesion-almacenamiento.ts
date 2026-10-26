import * as SecureStore from "expo-secure-store";

// El token nunca va a expo-sqlite/kv-store: la cátedra pide expo-secure-store
// específicamente para credenciales, porque en Android y iOS usa el llavero
// cifrado del sistema operativo en vez de un archivo plano.
const CLAVE_TOKEN = "mi-ciudad.token-sesion";
const CLAVE_ULTIMO_EMAIL = "mi-ciudad.ultimo-email";

export function guardarToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(CLAVE_TOKEN, token);
}

export function leerToken(): Promise<string | null> {
  return SecureStore.getItemAsync(CLAVE_TOKEN);
}

export function borrarToken(): Promise<void> {
  return SecureStore.deleteItemAsync(CLAVE_TOKEN);
}

// Se guarda aparte del token para poder ofrecer el reingreso con huella: al
// cerrar sesión se borra el token pero se mantiene este dato, así el botón de
// biometría sabe a qué cuenta reingresar sin tener que volver a pedir el email.
export function guardarUltimoEmail(email: string): Promise<void> {
  return SecureStore.setItemAsync(CLAVE_ULTIMO_EMAIL, email);
}

export function leerUltimoEmail(): Promise<string | null> {
  return SecureStore.getItemAsync(CLAVE_ULTIMO_EMAIL);
}

// Copia del último token emitido, que sobrevive al cierre de sesión. Es la
// credencial del reingreso con huella: la API no tiene refresh token, y sin
// esto la biometría no tendría nada que presentarle. Va en el llavero cifrado,
// igual que el token de la sesión activa.
const CLAVE_TOKEN_BIOMETRIA = "mi-ciudad.token-biometria";

export function guardarTokenParaBiometria(token: string): Promise<void> {
  return SecureStore.setItemAsync(CLAVE_TOKEN_BIOMETRIA, token);
}

export function leerTokenParaBiometria(): Promise<string | null> {
  return SecureStore.getItemAsync(CLAVE_TOKEN_BIOMETRIA);
}

export function borrarTokenParaBiometria(): Promise<void> {
  return SecureStore.deleteItemAsync(CLAVE_TOKEN_BIOMETRIA);
}
