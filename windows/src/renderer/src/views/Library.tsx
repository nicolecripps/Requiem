import { useEffect, useState, useCallback, useMemo } from 'react'
import type { Tab } from '@shared/types'
import EditTabModal from '../components/EditTabModal'

type SortKey = 'added_at' | 'title' | 'artist'
type SortDir = 'asc' | 'desc'

interface Props {
  onOpenTab: (tab: Tab) => void
  onSynced: (syncedAt: string) => void
}

const selectClass =
  'bg-surface2 border border-hairline rounded px-2 py-1.5 text-xs focus:outline-none focus:border-lilac text-ink'

export default function Library({ onOpenTab, onSynced }: Props): JSX.Element {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('added_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filterKey, setFilterKey] = useState('')
  const [filterCapo, setFilterCapo] = useState('')
  const [editingTab, setEditingTab] = useState<Tab | null>(null)

  const load = useCallback(async () => {
    const result = query.trim()
      ? await window.api.searchTabs(query)
      : await window.api.listTabs()
    setTabs(result)
  }, [query])

  useEffect(() => { load() }, [load])

  async function handleDelete(e: React.MouseEvent, id: number): Promise<void> {
    e.stopPropagation()
    await window.api.deleteTab(id)
    load()
    window.api.syncToICloud().then(r => { if (r.success && r.syncedAt) onSynced(r.syncedAt) })
  }

  function handleEdit(e: React.MouseEvent, tab: Tab): void {
    e.stopPropagation()
    setEditingTab(tab)
  }

  function handleSaved(updated: Tab): void {
    setTabs(prev => prev.map(t => (t.id === updated.id ? updated : t)))
    setEditingTab(null)
    window.api.syncToICloud().then(r => { if (r.success && r.syncedAt) onSynced(r.syncedAt) })
  }

  const uniqueKeys = useMemo(() => {
    const keys = new Set<string>()
    tabs.forEach(t => { if (t.key) keys.add(t.key) })
    return Array.from(keys).sort()
  }, [tabs])

  const uniqueCapos = useMemo(() => {
    const capos = new Set<number>()
    tabs.forEach(t => { if (t.capo != null) capos.add(t.capo) })
    return Array.from(capos).sort((a, b) => a - b)
  }, [tabs])

  const displayed = useMemo(() => {
    return [...tabs]
      .filter(t => !filterKey || t.key === filterKey)
      .filter(t => {
        if (!filterCapo) return true
        return t.capo === parseInt(filterCapo)
      })
      .sort((a, b) => {
        const va = a[sortKey] ?? ''
        const vb = b[sortKey] ?? ''
        return sortDir === 'asc'
          ? String(va).localeCompare(String(vb))
          : String(vb).localeCompare(String(va))
      })
  }, [tabs, filterKey, filterCapo, sortKey, sortDir])

  function toggleSort(key: SortKey): void {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const hasFilters = !!(query || filterKey || filterCapo)

  return (
    <>
    {editingTab && (
      <EditTabModal
        tab={editingTab}
        onSave={handleSaved}
        onClose={() => setEditingTab(null)}
      />
    )}
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-hairline shrink-0 flex-wrap">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by title or artist..."
          className="flex-1 min-w-[180px] max-w-sm bg-surface2 border border-hairline rounded px-3 py-1.5 text-sm focus:outline-none focus:border-lilac"
        />

        {uniqueKeys.length > 0 && (
          <select value={filterKey} onChange={e => setFilterKey(e.target.value)} className={selectClass}>
            <option value="">All Keys</option>
            {uniqueKeys.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        )}

        {uniqueCapos.length > 0 && (
          <select value={filterCapo} onChange={e => setFilterCapo(e.target.value)} className={selectClass}>
            <option value="">Any Capo</option>
            {uniqueCapos.map(c => (
              <option key={c} value={String(c)}>{c === 0 ? 'No Capo' : `Capo ${c}`}</option>
            ))}
          </select>
        )}

        <span className="text-xs text-dim">Sort:</span>
        {(['title', 'artist', 'added_at'] as SortKey[]).map(k => (
          <button
            key={k}
            onClick={() => toggleSort(k)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              sortKey === k
                ? 'bg-lilac/20 text-lilac font-semibold'
                : 'text-smoke hover:text-ink'
            }`}
          >
            {k === 'added_at' ? 'Date' : k.charAt(0).toUpperCase() + k.slice(1)}
            {sortKey === k && (sortDir === 'asc' ? ' ↑' : ' ↓')}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-dim text-sm gap-2">
            <p>
              {hasFilters
                ? 'No tabs match your filters.'
                : 'No tabs yet. Import one from the Add Tab screen.'}
            </p>
          </div>
        ) : (
          <ul>
            {displayed.map(tab => (
              <li
                key={tab.id}
                onClick={() => onOpenTab(tab)}
                className="flex items-center gap-4 px-5 py-3 border-b border-hairline/50 hover:bg-surface2/50 cursor-pointer group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{tab.title}</p>
                  <p className="text-sm text-smoke truncate">{tab.artist}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {tab.type && (
                    <span className="text-xs px-2 py-0.5 bg-surface3 rounded text-ink">
                      {tab.type}
                    </span>
                  )}
                  {tab.key && (
                    <span className="text-xs text-smoke">Key of {tab.key}</span>
                  )}
                  {tab.capo != null && tab.capo > 0 && (
                    <span className="text-xs text-dim">Capo {tab.capo}</span>
                  )}
                  <span className="text-xs text-dim">
                    {new Date(tab.added_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={e => handleEdit(e, tab)}
                    className="opacity-0 group-hover:opacity-100 text-xs text-smoke hover:text-ink px-2 py-1 transition-opacity"
                  >
                    Edit
                  </button>
                  <button
                    onClick={e => handleDelete(e, tab.id)}
                    className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-300 px-2 py-1 transition-opacity"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
    </>
  )
}
