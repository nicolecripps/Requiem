export interface Tab {
  id: number
  title: string
  artist: string
  type: string | null
  url: string
  content: string
  chords: string[] | null
  tuning: string | null
  key: string | null
  capo: number | null
  added_at: string
  pdf_path: string | null
}

export type TabType = 'Chords' | 'Tab' | 'Bass' | 'Ukulele' | 'Drums' | string

export interface ScrapeResult {
  success: true
  tab: Omit<Tab, 'id' | 'added_at'>
}

export interface ScrapeError {
  success: false
  error: string
}

export type ScrapeResponse = ScrapeResult | ScrapeError
