import CryptoJS from 'crypto-js'

export function encryptLibrary(json: string, passphrase: string): string {
  return CryptoJS.AES.encrypt(json, passphrase).toString()
}
