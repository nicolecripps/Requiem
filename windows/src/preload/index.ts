import { contextBridge, ipcRenderer } from 'electron'
import type { Tab, ScrapeResponse } from '@shared/types'

const api = {
  scrapeTab: (url: string): Promise<ScrapeResponse & { tab?: Tab }> =>
    ipcRenderer.invoke('tab:scrape', url),

  listTabs: (): Promise<Tab[]> =>
    ipcRenderer.invoke('tab:list'),

  searchTabs: (query: string): Promise<Tab[]> =>
    ipcRenderer.invoke('tab:search', query),

  deleteTab: (id: number): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('tab:delete', id),

  openPdf: (pdfPath: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('tab:openPdf', pdfPath),

  checkUrls: (urls: string[]): Promise<string[]> =>
    ipcRenderer.invoke('tab:checkUrls', urls),

  updateTab: (id: number, fields: {
    title: string; artist: string; type: string | null
    key: string | null; capo: number | null; tuning: string | null; content: string
  }): Promise<Tab> =>
    ipcRenderer.invoke('tab:update', id, fields),

  getSettings: (): Promise<{
    syncPath: string | null
    githubToken: string | null
    repoOwner: string | null
    repoName: string | null
    repoBranch: string | null
    passphrase: string | null
    lastSyncedAt: string | null
    detectedSyncPath: string | null
  }> => ipcRenderer.invoke('settings:get'),

  saveSettings: (patch: {
    syncPath?: string | null
    githubToken?: string | null
    repoOwner?: string | null
    repoName?: string | null
    repoBranch?: string | null
  }): Promise<{
    syncPath: string | null
    githubToken: string | null
    repoOwner: string | null
    repoName: string | null
    repoBranch: string | null
    passphrase: string | null
    lastSyncedAt: string | null
  }> => ipcRenderer.invoke('settings:set', patch),

  pickDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke('settings:pickDirectory'),

  syncToICloud: (): Promise<{ success: boolean; syncedAt?: string; reason?: string; error?: string }> =>
    ipcRenderer.invoke('sync:export'),

  setKeepAwake: (enabled: boolean): Promise<void> =>
    ipcRenderer.invoke('power:keepAwake', enabled)
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
