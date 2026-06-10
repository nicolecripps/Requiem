import CryptoJS from 'crypto-js'

export function decryptLibrary(ciphertext: string, passphrase: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, passphrase)
  const json = bytes.toString(CryptoJS.enc.Utf8)
  if (!json) throw new Error('Could not decrypt library — check your passphrase.')
  return json
}
