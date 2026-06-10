import { useState } from 'react'
import type { Tab } from '@shared/types'

interface Props {
  tab: Tab
  onSave: (updated: Tab) => void
  onClose: () => void
}

const inputClass =
  'w-full bg-surface2 border border-hairline rounded px-3 py-1.5 text-sm focus:outline-none focus:border-lilac'

export default function EditTabModal({ tab, onSave, onClose }: Props): JSX.Element {
  const [title, setTitle] = useState(tab.title)
  const [artist, setArtist] = useState(tab.artist)
  const [type, setType] = useState(tab.type ?? '')
  const [key, setKey] = useState(tab.key ?? '')
  const [capo, setCapo] = useState(tab.capo != null ? String(tab.capo) : '')
  const [tuning, setTuning] = useState(tab.tuning ?? '')
  const [content, setContent] = useState(tab.content)
  const [saving, setSaving] = useState(false)

  async function handleSave(): Promise<void> {
    if (!title.trim() || !artist.trim()) return
    setSaving(true)

    const capoNum = capo.trim() === '' ? null : parseInt(capo)
    const updated = await window.api.updateTab(tab.id, {
      title: title.trim(),
      artist: artist.trim(),
      type: type.trim() || null,
      key: key.trim() || null,
      capo: isNaN(capoNum as number) ? null : capoNum,
      tuning: tuning.trim() || null,
      content
    })

    setSaving(false)
    onSave(updated)
  }

  function handleBackdropClick(e: React.MouseEvent): void {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface border border-hairline rounded-lg w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline shrink-0">
          <h2 className="font-semibold text-base">Edit Tab</h2>
          <button
            onClick={onClose}
            className="text-smoke hover:text-ink text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Title + Artist */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-smoke mb-1">Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-smoke mb-1">Artist</label>
              <input
                value={artist}
                onChange={e => setArtist(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Type / Key / Capo / Tuning */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-smoke mb-1">Type</label>
              <input
                value={type}
                onChange={e => setType(e.target.value)}
                placeholder="Chords"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-smoke mb-1">Key</label>
              <input
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="Am"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-smoke mb-1">Capo</label>
              <input
                type="number"
                min={0}
                max={12}
                value={capo}
                onChange={e => setCapo(e.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-smoke mb-1">Tuning</label>
              <input
                value={tuning}
                onChange={e => setTuning(e.target.value)}
                placeholder="Standard"
                className={inputClass}
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs text-smoke mb-1">Tab Content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={16}
              className="w-full bg-surface2 border border-hairline rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-lilac resize-y"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-hairline shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-smoke hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !artist.trim()}
            className="px-5 py-2 bg-lilac hover:bg-lilac-dim text-void disabled:opacity-40 rounded text-sm font-semibold transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
