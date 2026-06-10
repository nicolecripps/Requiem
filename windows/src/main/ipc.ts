import { ipcMain, shell, dialog, powerSaveBlocker } from 'electron'
import { scrapeTab } from './scraper'
import { insertTab, getAllTabs, searchTabs, deleteTab, updateTab, getExistingUrls } from './db'
import { extractChords } from '@shared/transpose'
import { loadSettings, saveSettings, detectSyncPath } from './settings'
import { exportLibraryJson, syncToRepoFile } from './sync'

let keepAwakeId: number | null = null

export function registerIpcHandlers(): void {
  ipcMain.handle('power:keepAwake', (_event, enabled: boolean) => {
    if (enabled) {
      if (keepAwakeId === null) keepAwakeId = powerSaveBlocker.start('prevent-display-sleep')
    } else if (keepAwakeId !== null) {
      powerSaveBlocker.stop(keepAwakeId)
      keepAwakeId = null
    }
  })

  ipcMain.handle('tab:scrape', async (_event, url: string) => {
    const result = await scrapeTab(url)
    if (result.success) {
      const saved = insertTab(result.tab)
      return { success: true, tab: saved }
    }
    return result
  })

  ipcMain.handle('tab:list', () => getAllTabs())

  ipcMain.handle('tab:search', (_event, query: string) => searchTabs(query))

  ipcMain.handle('tab:delete', (_event, id: number) => {
    deleteTab(id)
    return { success: true }
  })

  ipcMain.handle('tab:openPdf', async (_event, pdfPath: string) => {
    await shell.openPath(pdfPath)
    return { success: true }
  })

  ipcMain.handle('tab:checkUrls', (_event, urls: string[]) => getExistingUrls(urls))

  ipcMain.handle('settings:get', () => ({
    ...loadSettings(),
    detectedSyncPath: detectSyncPath()
  }))

  ipcMain.handle('settings:set', (_event, patch: {
    syncPath?: string | null
    githubToken?: string | null
    repoOwner?: string | null
    repoName?: string | null
    repoBranch?: string | null
  }) => saveSettings(patch))

  ipcMain.handle('settings:pickDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select sync folder (e.g. a folder inside OneDrive)'
    })
    return result.canceled ? null : result.filePaths[0] ?? null
  })

  ipcMain.handle('sync:export', async () => {
    const { syncPath, githubToken, repoOwner, repoName, repoBranch, passphrase } = loadSettings()
    if (!syncPath && !(githubToken && repoOwner && repoName)) {
      return { success: false, reason: 'not_configured' }
    }
    try {
      let syncedAt: string | null = null
      if (syncPath) syncedAt = exportLibraryJson(syncPath)
      if (githubToken && repoOwner && repoName && passphrase) {
        syncedAt = await syncToRepoFile(githubToken, repoOwner, repoName, repoBranch || 'main', passphrase)
      }
      if (syncedAt) saveSettings({ lastSyncedAt: syncedAt })
      return { success: true, syncedAt }
    } catch (err: any) {
      return { success: false, error: err?.message ?? 'Sync failed' }
    }
  })

  ipcMain.handle('tab:update', (_event, id: number, fields: {
    title: string; artist: string; type: string | null
    key: string | null; capo: number | null; tuning: string | null; content: string
  }) => {
    const chords = extractChords(fields.content)
    return updateTab(id, { ...fields, chords: chords.length > 0 ? chords : null })
  })
}
