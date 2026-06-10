import AsyncStorage from '@react-native-async-storage/async-storage'

const LIBRARY_URL_KEY = 'library_json_url'
const PASSPHRASE_KEY = 'library_passphrase'
const AUTOSCROLL_SPEED_KEY = 'autoscroll_speed'

export async function getLibraryUrl(): Promise<string | null> {
  return AsyncStorage.getItem(LIBRARY_URL_KEY)
}

export async function setLibraryUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(LIBRARY_URL_KEY, url.trim())
}

export async function clearLibraryUrl(): Promise<void> {
  await AsyncStorage.removeItem(LIBRARY_URL_KEY)
}

export async function getPassphrase(): Promise<string | null> {
  return AsyncStorage.getItem(PASSPHRASE_KEY)
}

export async function setPassphrase(passphrase: string): Promise<void> {
  await AsyncStorage.setItem(PASSPHRASE_KEY, passphrase.trim())
}

export async function clearPassphrase(): Promise<void> {
  await AsyncStorage.removeItem(PASSPHRASE_KEY)
}

export async function getAutoScrollSpeed(): Promise<number> {
  const saved = parseFloat((await AsyncStorage.getItem(AUTOSCROLL_SPEED_KEY)) ?? '')
  return Number.isFinite(saved) ? Math.min(Math.max(saved, 0.5), 10) : 5
}

export async function setAutoScrollSpeed(speed: number): Promise<void> {
  await AsyncStorage.setItem(AUTOSCROLL_SPEED_KEY, String(speed))
}
