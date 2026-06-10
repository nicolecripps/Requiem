import { useState, useEffect } from 'react'
import { ABOUT_INFO } from '@shared/about'

interface Props {
  onClose: () => void
  onSynced: (syncedAt: string) => void
}

const inputClass =
  'flex-1 bg-surface2 border border-hairline rounded px-3 py-1.5 text-sm focus:outline-none focus:border-lilac font-mono'

export default function SettingsModal({ onClose, onSynced }: Props): JSX.Element {
  const [syncPath, setSyncPath] = useState<string>('')
  const [githubToken, setGithubToken] = useState<string>('')
  const [repoOwner, setRepoOwner] = useState<string>('')
  const [repoName, setRepoName] = useState<string>('')
  const [repoBranch, setRepoBranch] = useState<string>('main')
  const [passphrase, setPassphrase] = useState<string>('')
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [detectedPath, setDetectedPath] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState<'url' | 'pass' | null>(null)

  useEffect(() => {
    window.api.getSettings().then(s => {
      setSyncPath(s.syncPath ?? '')
      setGithubToken(s.githubToken ?? '')
      setRepoOwner(s.repoOwner ?? '')
      setRepoName(s.repoName ?? '')
      setRepoBranch(s.repoBranch ?? 'main')
      setPassphrase(s.passphrase ?? '')
      setLastSyncedAt(s.lastSyncedAt)
      setDetectedPath(s.detectedSyncPath)
    })
  }, [])

  function buildPatch() {
    return {
      syncPath: syncPath.trim() || null,
      githubToken: githubToken.trim() || null,
      repoOwner: repoOwner.trim() || null,
      repoName: repoName.trim() || null,
      repoBranch: repoBranch.trim() || null
    }
  }

  async function handleSave(): Promise<void> {
    setSaving(true)
    await window.api.saveSettings(buildPatch())
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleBrowse(): Promise<void> {
    const picked = await window.api.pickDirectory()
    if (picked) setSyncPath(picked)
  }

  async function handleAutoDetect(): Promise<void> {
    if (detectedPath) setSyncPath(detectedPath)
  }

  async function handleSyncNow(): Promise<void> {
    setSyncing(true)
    setSyncError(null)
    // ensure latest values are persisted before syncing
    await window.api.saveSettings(buildPatch())
    const result = await window.api.syncToICloud()
    setSyncing(false)
    if (result.success && result.syncedAt) {
      setLastSyncedAt(result.syncedAt)
      onSynced(result.syncedAt)
    } else if (result.reason === 'not_configured') {
      setSyncError('Add a GitHub repo + token (or a sync folder) below first.')
    } else {
      setSyncError(result.error ?? 'Sync failed.')
    }
  }

  function handleBackdropClick(e: React.MouseEvent): void {
    if (e.target === e.currentTarget) onClose()
  }

  const libraryUrl =
    repoOwner.trim() && repoName.trim()
      ? `https://raw.githubusercontent.com/${repoOwner.trim()}/${repoName.trim()}/${repoBranch.trim() || 'main'}/library.enc`
      : ''

  function handleCopy(text: string, which: 'url' | 'pass'): void {
    navigator.clipboard.writeText(text)
    setCopied(which)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface border border-hairline rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
          <h2 className="font-semibold text-base">Settings</h2>
          <button onClick={onClose} className="text-smoke hover:text-ink text-lg leading-none">×</button>
        </div>

        <div className="px-5 py-5 space-y-6">
          {/* Phone sync via GitHub repo */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-dim mb-3">Phone Sync (GitHub Repo)</h3>

            <details className="mb-3 text-xs text-dim leading-relaxed">
              <summary className="cursor-pointer text-smoke hover:text-ink mb-1">One-time setup steps</summary>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>Create a new <span className="font-mono text-smoke">public</span> repo on GitHub (no files needed)</li>
                <li>Go to <span className="font-mono text-smoke">github.com/settings/tokens</span> → Generate new token (classic) → check only the <span className="font-mono text-smoke">public_repo</span> scope</li>
                <li>Enter the repo owner, name and token below, then Save and Sync Now</li>
                <li>On your phone, enter the Library URL and Passphrase shown below the Sync button</li>
              </ol>
            </details>

            <label className="block text-xs text-smoke mb-1.5">Repo Owner</label>
            <input
              value={repoOwner}
              onChange={e => setRepoOwner(e.target.value)}
              placeholder="e.g. your-github-username"
              className={`${inputClass} w-full mb-2 block`}
            />

            <label className="block text-xs text-smoke mb-1.5">Repo Name</label>
            <input
              value={repoName}
              onChange={e => setRepoName(e.target.value)}
              placeholder="e.g. GuitarTabReader"
              className={`${inputClass} w-full mb-2 block`}
            />

            <label className="block text-xs text-smoke mb-1.5">Branch</label>
            <input
              value={repoBranch}
              onChange={e => setRepoBranch(e.target.value)}
              placeholder="main"
              className={`${inputClass} w-full mb-2 block`}
            />

            <label className="block text-xs text-smoke mb-1.5">Personal Access Token</label>
            <input
              value={githubToken}
              onChange={e => setGithubToken(e.target.value)}
              placeholder="ghp_..."
              type="password"
              className={`${inputClass} w-full block`}
            />
          </div>

          {/* Local backup folder */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-dim mb-3">Local Backup Folder (optional)</h3>

            <label className="block text-xs text-smoke mb-1.5">Folder</label>
            <div className="flex gap-2 mb-2">
              <input
                value={syncPath}
                onChange={e => setSyncPath(e.target.value)}
                placeholder="C:\Users\You\OneDrive\GuitarTabs"
                className={inputClass}
              />
              <button
                onClick={handleBrowse}
                className="px-3 py-1.5 bg-surface3 hover:bg-surface3/80 rounded text-xs transition-colors shrink-0"
              >
                Browse
              </button>
            </div>

            {detectedPath && detectedPath !== syncPath && (
              <button
                onClick={handleAutoDetect}
                className="text-xs text-lilac hover:text-lilac-dim transition-colors"
              >
                Auto-detected: {detectedPath} — use this
              </button>
            )}
          </div>

          {/* Sync status */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-dim">
                {lastSyncedAt
                  ? <>Last synced: <span className="text-ink">{new Date(lastSyncedAt).toLocaleString()}</span></>
                  : <span className="text-dim">Never synced</span>
                }
              </span>
              <button
                onClick={handleSyncNow}
                disabled={syncing}
                className="px-4 py-1.5 bg-surface3 hover:bg-surface3/80 disabled:opacity-40 rounded text-xs font-medium transition-colors"
              >
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>

            {syncError && (
              <p className="mt-2 text-xs text-red-400">{syncError}</p>
            )}

            {/* Phone setup info */}
            <div className="mt-4 space-y-2">
              <div>
                <label className="block text-xs text-smoke mb-1.5">Library URL (enter on phone)</label>
                <div className="flex gap-2">
                  <input readOnly value={libraryUrl} placeholder="Set repo owner + name above" className={`${inputClass} text-ink`} />
                  <button
                    onClick={() => libraryUrl && handleCopy(libraryUrl, 'url')}
                    disabled={!libraryUrl}
                    className="px-3 py-1.5 bg-surface3 hover:bg-surface3/80 disabled:opacity-40 rounded text-xs transition-colors shrink-0"
                  >
                    {copied === 'url' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-smoke mb-1.5">Passphrase (enter on phone)</label>
                <div className="flex gap-2">
                  <input readOnly value={passphrase} className={`${inputClass} text-ink`} />
                  <button
                    onClick={() => passphrase && handleCopy(passphrase, 'pass')}
                    disabled={!passphrase}
                    className="px-3 py-1.5 bg-surface3 hover:bg-surface3/80 disabled:opacity-40 rounded text-xs transition-colors shrink-0"
                  >
                    {copied === 'pass' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* About */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-dim mb-3">About</h3>
            <p className="text-sm font-medium text-ink">
              {ABOUT_INFO.appName} <span className="text-dim font-normal">v{ABOUT_INFO.version}</span>
            </p>
            <p className="text-xs text-smoke mt-1">
              Created by {ABOUT_INFO.creator} · {ABOUT_INFO.year}
            </p>
            <p className="text-xs text-smoke mt-1">Tab data sourced from {ABOUT_INFO.dataSource}</p>
            <p className="text-xs text-dim mt-2 leading-relaxed">{ABOUT_INFO.disclaimer}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-hairline">
          <button onClick={onClose} className="px-4 py-2 text-sm text-smoke hover:text-ink transition-colors">
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-lilac hover:bg-lilac-dim text-void disabled:opacity-40 rounded text-sm font-semibold transition-colors"
          >
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
