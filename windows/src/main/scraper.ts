import { BrowserWindow, app } from 'electron'
import { join } from 'path'
import { mkdirSync, writeFileSync } from 'fs'
import { extractChords } from '@shared/transpose'
import type { ScrapeResponse } from '@shared/types'

export async function scrapeTab(url: string): Promise<ScrapeResponse> {
  if (!url.includes('ultimate-guitar.com')) {
    return { success: false, error: 'URL must be from ultimate-guitar.com' }
  }

  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  try {
    await win.loadURL(url)

    // Poll for window.UGAPP — Cloudflare challenge may take a few seconds to resolve
    const ugapp = await pollForUGAPP(win, 30000)
    if (!ugapp) {
      return { success: false, error: 'Could not find tab data. The page may have changed or the URL is not a tab page.' }
    }

    const tabData = ugapp?.store?.page?.data?.tab
    const tabView = ugapp?.store?.page?.data?.tab_view

    if (!tabData) {
      return { success: false, error: 'Could not parse tab metadata from page.' }
    }

    const content: string | null = tabView?.wiki_tab?.content ?? null
    if (!content) {
      return {
        success: false,
        error: 'This appears to be a Pro tab — content is not available on a free account.'
      }
    }

    // Save PDF using Electron's built-in printToPDF
    const pdfsDir = join(app.getPath('userData'), 'pdfs')
    mkdirSync(pdfsDir, { recursive: true })
    const safeName = `${tabData.artist_name}_${tabData.song_name}`
      .replace(/[^a-z0-9_\- ]/gi, '_')
      .slice(0, 80)
    const pdfPath = join(pdfsDir, `${safeName}_${Date.now()}.pdf`)

    const pdfBuffer = await win.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      marginsType: 0
    })
    writeFileSync(pdfPath, pdfBuffer)

    const chords = extractChords(content)

    return {
      success: true,
      tab: {
        title: tabData.song_name ?? 'Unknown',
        artist: tabData.artist_name ?? 'Unknown',
        type: tabData.type ?? null,
        url,
        content,
        chords: chords.length > 0 ? chords : null,
        tuning: tabView?.meta?.tuning?.value ?? null,
        key: tabView?.meta?.tonality_name ?? null,
        capo: tabView?.meta?.capo ?? null,
        pdf_path: pdfPath
      }
    }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Unknown scrape error' }
  } finally {
    win.destroy()
  }
}

async function pollForUGAPP(win: BrowserWindow, timeout: number): Promise<any | null> {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    try {
      const data = await win.webContents.executeJavaScript(
        `window.UGAPP?.store?.page?.data ?? null`
      )
      if (data?.tab) return { store: { page: { data } } }
    } catch {
      // page not ready yet — keep polling
    }
    await new Promise(r => setTimeout(r, 500))
  }
  return null
}
