import type { Library } from '../types'
import bundledLibrary from '../data/library.json'
import { decryptLibrary } from './crypto'

export function loadBundledLibrary(): Library {
  return bundledLibrary as Library
}

export async function fetchLibrary(url: string, passphrase: string): Promise<Library> {
  const response = await fetch(url.trim())
  if (!response.ok) throw new Error(`Server returned ${response.status}`)
  const encrypted = await response.text()

  const json = decryptLibrary(encrypted, passphrase)

  let data: any
  try {
    data = JSON.parse(json)
  } catch {
    throw new Error('Decrypted data is not valid JSON.')
  }
  if (!Array.isArray(data?.tabs)) throw new Error('Invalid library format')
  return data as Library
}
