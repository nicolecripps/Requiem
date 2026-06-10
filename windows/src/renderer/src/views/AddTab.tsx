import { useState } from 'react'
import type { Tab } from '@shared/types'

type Mode = 'single' | 'bulk'
type SingleStatus = 'idle' | 'loading' | 'success' | 'error'
type ItemStatus = 'queued' | 'importing' | 'done' | 'skipped' | 'error'

interface ImportItem {
  url: string
  status: ItemStatus
  tab?: Tab
  error?: string
}

interface Props {
  onTabAdded: (tab: Tab) => void
  onSynced: (syncedAt: string) => void
}

export default function AddTab({ onTabAdded, onSynced }: Props): JSX.Element {
  const [mode, setMode] = useState<Mode>('single')

  // single
  const [url, setUrl] = useState('')
  const [singleStatus, setSingleStatus] = useState<SingleStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [savedTab, setSavedTab] = useState<Tab | null>(null)

  // bulk
  const [bulkText, setBulkText] = useState('')
  const [items, setItems] = useState<ImportItem[]>([])
  const [running, setRunning] = useState(false)

  async function handleSingleImport(): Promise<void> {
    const trimmed = url.trim()
    if (!trimmed) return
    setSingleStatus('loading')
    setErrorMsg('')
    setSavedTab(null)

    const result = await window.api.scrapeTab(trimmed)

    if (result.success && result.tab) {
      setSavedTab(result.tab)
      setSingleStatus('success')
      setUrl('')
      window.api.syncToICloud().then(r => { if (r.success && r.syncedAt) onSynced(r.syncedAt) })
    } else {
      setErrorMsg((result as any).error ?? 'Import failed.')
      setSingleStatus('error')
    }
  }

  async function handleBulkImport(): Promise<void> {
    const uniqueUrls = Array.from(new Set(
      bulkText
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0 && l.includes('ultimate-guitar.com'))
    ))

    if (uniqueUrls.length === 0) return

    const existingUrls = new Set(await window.api.checkUrls(uniqueUrls))

    const initialItems: ImportItem[] = uniqueUrls.map(u => ({
      url: u,
      status: existingUrls.has(u) ? 'skipped' : 'queued'
    }))

    setItems(initialItems)
    setRunning(true)

    const current = [...initialItems]
    for (let i = 0; i < current.length; i++) {
      if (current[i].status !== 'queued') continue

      current[i] = { ...current[i], status: 'importing' }
      setItems([...current])

      const result = await window.api.scrapeTab(current[i].url)

      if (result.success && result.tab) {
        current[i] = { ...current[i], status: 'done', tab: result.tab }
      } else {
        current[i] = { ...current[i], status: 'error', error: (result as any).error ?? 'Import failed.' }
      }
      setItems([...current])
    }

    setRunning(false)
    window.api.syncToICloud().then(r => { if (r.success && r.syncedAt) onSynced(r.syncedAt) })
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      <div className="w-full max-w-lg">
        {/* Header + mode toggle */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Import a Tab</h1>
            <p className="text-smoke text-sm">
              Paste a URL from ultimate-guitar.com to save the tab and a PDF.
            </p>
          </div>
          <div className="flex gap-1 bg-surface2 rounded p-1 shrink-0 ml-4">
            <button
              onClick={() => setMode('single')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                mode === 'single' ? 'bg-lilac text-void' : 'text-smoke hover:text-ink'
              }`}
            >
              Single
            </button>
            <button
              onClick={() => setMode('bulk')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                mode === 'bulk' ? 'bg-lilac text-void' : 'text-smoke hover:text-ink'
              }`}
            >
              Bulk
            </button>
          </div>
        </div>

        {mode === 'single' ? (
          <>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSingleImport()}
                placeholder="https://tabs.ultimate-guitar.com/tab/..."
                disabled={singleStatus === 'loading'}
                className="flex-1 bg-surface2 border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-lilac disabled:opacity-50"
              />
              <button
                onClick={handleSingleImport}
                disabled={singleStatus === 'loading' || !url.trim()}
                className="px-5 py-2 bg-lilac hover:bg-lilac-dim text-void disabled:opacity-40 rounded text-sm font-semibold transition-colors"
              >
                {singleStatus === 'loading' ? 'Importing...' : 'Import'}
              </button>
            </div>

            {singleStatus === 'loading' && (
              <p className="mt-4 text-smoke text-sm animate-pulse">
                Loading page and extracting tab data...
              </p>
            )}

            {singleStatus === 'error' && (
              <div className="mt-4 p-3 bg-red-900/40 border border-red-700 rounded text-sm text-red-300">
                {errorMsg}
              </div>
            )}

            {singleStatus === 'success' && savedTab && (
              <div className="mt-4 p-4 bg-green-900/30 border border-green-700 rounded">
                <p className="text-green-300 font-semibold text-sm mb-1">Imported successfully!</p>
                <p className="text-ink font-medium">{savedTab.title}</p>
                <p className="text-smoke text-sm">{savedTab.artist}</p>
                <button
                  onClick={() => onTabAdded(savedTab)}
                  className="mt-3 px-4 py-1.5 bg-lilac hover:bg-lilac-dim text-void rounded text-sm font-semibold transition-colors"
                >
                  View Tab
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              disabled={running}
              placeholder={
                'Paste one URL per line:\nhttps://tabs.ultimate-guitar.com/tab/...\nhttps://tabs.ultimate-guitar.com/tab/...'
              }
              rows={6}
              className="w-full bg-surface2 border border-hairline rounded px-3 py-2 text-sm focus:outline-none focus:border-lilac disabled:opacity-50 resize-none font-mono"
            />
            <button
              onClick={handleBulkImport}
              disabled={running || !bulkText.trim()}
              className="mt-3 w-full px-5 py-2 bg-lilac hover:bg-lilac-dim text-void disabled:opacity-40 rounded text-sm font-semibold transition-colors"
            >
              {running ? 'Importing...' : 'Import All'}
            </button>

            {items.length > 0 && (
              <div className="mt-4 space-y-0 max-h-64 overflow-y-auto border border-hairline rounded">
                {items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2 border-b border-hairline last:border-0 text-xs">
                    <span className="shrink-0 mt-0.5 w-4 text-center">
                      {item.status === 'queued'    && <span className="text-dim">○</span>}
                      {item.status === 'importing' && <span className="text-lilac animate-pulse">●</span>}
                      {item.status === 'done'      && <span className="text-green-400">✓</span>}
                      {item.status === 'skipped'   && <span className="text-yellow-500">↷</span>}
                      {item.status === 'error'     && <span className="text-red-400">✗</span>}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-dim font-mono">{item.url}</p>
                      {item.tab && (
                        <p className="text-ink mt-0.5">
                          {item.tab.title} — {item.tab.artist}
                        </p>
                      )}
                      {item.status === 'skipped' && (
                        <p className="text-yellow-600 mt-0.5">Already in library</p>
                      )}
                      {item.error && <p className="text-red-400 mt-0.5">{item.error}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
