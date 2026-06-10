import { useState, useEffect } from 'react'
import AddTab from './views/AddTab'
import Library from './views/Library'
import TabView from './views/TabView'
import SettingsModal from './components/SettingsModal'
import SplashScreen from './components/SplashScreen'
import type { Tab } from '@shared/types'

type View = 'library' | 'add'

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString()
}

export default function App(): JSX.Element {
  const [view, setView] = useState<View>('library')
  const [selectedTab, setSelectedTab] = useState<Tab | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [syncConfigured, setSyncConfigured] = useState(false)
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    window.api.getSettings().then(s => {
      setLastSyncedAt(s.lastSyncedAt)
      setSyncConfigured(!!s.syncPath)
    })
  }, [])

  function handleSynced(syncedAt: string): void {
    setLastSyncedAt(syncedAt)
  }

  return (
    <div className="flex flex-col h-screen bg-void text-ink">
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      {/* Top nav */}
      <nav className="flex items-center gap-1 px-4 py-2 bg-surface border-b border-hairline shrink-0">
        <span className="font-bold text-lilac mr-4 text-lg select-none">Guitar Tab Reader</span>
        <NavTab
          label="My Library"
          active={view === 'library' && !selectedTab}
          onClick={() => { setSelectedTab(null); setView('library') }}
        />
        <NavTab
          label="Add Tab"
          active={view === 'add'}
          onClick={() => { setSelectedTab(null); setView('add') }}
        />

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          {syncConfigured && (
            <span className="text-xs text-dim">
              {lastSyncedAt ? `☁ ${relativeTime(lastSyncedAt)}` : '☁ Not synced'}
            </span>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="text-smoke hover:text-ink transition-colors text-base px-2 py-1"
            title="Settings"
          >
            ⚙
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {selectedTab ? (
          <TabView tab={selectedTab} onBack={() => setSelectedTab(null)} />
        ) : view === 'library' ? (
          <Library onOpenTab={tab => setSelectedTab(tab)} onSynced={handleSynced} />
        ) : (
          <AddTab onTabAdded={tab => setSelectedTab(tab)} onSynced={handleSynced} />
        )}
      </main>

      {showSettings && (
        <SettingsModal
          onClose={() => {
            setShowSettings(false)
            window.api.getSettings().then(s => setSyncConfigured(!!s.syncPath))
          }}
          onSynced={handleSynced}
        />
      )}
    </div>
  )
}

function NavTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
        active
          ? 'bg-lilac text-void'
          : 'text-smoke hover:text-ink hover:bg-surface2'
      }`}
    >
      {label}
    </button>
  )
}
