export interface LibraryTab {
  id: number
  title: string
  artist: string
  type: string | null
  url: string
  content: string
  chords: string[] | null
  key: string | null
  capo: number | null
  tuning: string | null
  addedAt: string
}

export interface Library {
  exportedAt: string
  version: number
  tabs: LibraryTab[]
}
