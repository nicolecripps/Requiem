import { useState, useEffect, useRef } from 'react'
import { transposeTab } from '@shared/transpose'
import type { Tab } from '@shared/types'
import TabDisplay from '../components/TabDisplay'

interface Props {
  tab: Tab
  onBack: () => void
}

const SCROLL_SPEED_KEY = 'gtr-autoscroll-speed'

export default function TabView({ tab, onBack }: Props): JSX.Element {
  const [semitones, setSemitones] = useState(0)
  const [useFlats, setUseFlats] = useState(false)
  const [autoScroll, setAutoScroll] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(() => {
    const saved = parseFloat(localStorage.getItem(SCROLL_SPEED_KEY) ?? '')
    return Number.isFinite(saved) ? Math.min(Math.max(saved, 0.5), 10) : 5
  })
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollPosRef = useRef(0)

  const content = transposeTab(tab.content, semitones, useFlats)

  async function handleOpenPdf(): Promise<void> {
    if (tab.pdf_path) {
      await window.api.openPdf(tab.pdf_path)
    }
  }

  // Keep the screen awake while a tab is open
  useEffect(() => {
    window.api.setKeepAwake(true)
    return () => {
      window.api.setKeepAwake(false)
    }
  }, [])

  // Persist auto-scroll speed
  useEffect(() => {
    localStorage.setItem(SCROLL_SPEED_KEY, String(scrollSpeed))
  }, [scrollSpeed])

  // Auto-scroll loop
  useEffect(() => {
    if (!autoScroll) return undefined
    const el = scrollRef.current
    if (!el) return undefined
    scrollPosRef.current = el.scrollTop
    const id = setInterval(() => {
      scrollPosRef.current += scrollSpeed * 0.5
      el.scrollTop = scrollPosRef.current
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
        setAutoScroll(false)
      }
    }, 50)
    return () => clearInterval(id)
  }, [autoScroll, scrollSpeed])

  function handleWheel(): void {
    if (autoScroll) setAutoScroll(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start gap-4 px-5 py-3 border-b border-hairline shrink-0">
        <button
          onClick={onBack}
          className="mt-0.5 text-smoke hover:text-ink text-sm"
        >
          ← Back
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{tab.title}</h1>
          <p className="text-sm text-smoke truncate">{tab.artist}</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {/* Meta */}
          {tab.key && <Meta label="Key" value={tab.key} />}
          {tab.capo != null && tab.capo > 0 && <Meta label="Capo" value={String(tab.capo)} />}
          {tab.tuning && <Meta label="Tuning" value={tab.tuning} />}
        </div>
      </div>

      {/* Transpose toolbar */}
      <div className="flex items-center gap-4 px-5 py-2.5 bg-surface/50 border-b border-hairline shrink-0">
        <span className="text-xs text-smoke font-medium">Transpose</span>
        <button
          onClick={() => setSemitones((s) => Math.max(s - 1, -11))}
          className="w-7 h-7 rounded bg-surface3 hover:bg-surface3/80 text-lg font-bold leading-none"
        >
          −
        </button>
        <span className="text-sm w-16 text-center font-mono">
          {semitones === 0 ? 'Original' : semitones > 0 ? `+${semitones}` : semitones}
        </span>
        <button
          onClick={() => setSemitones((s) => Math.min(s + 1, 11))}
          className="w-7 h-7 rounded bg-surface3 hover:bg-surface3/80 text-lg font-bold leading-none"
        >
          +
        </button>
        <button
          onClick={() => setSemitones(0)}
          disabled={semitones === 0}
          className="text-xs text-smoke hover:text-ink disabled:opacity-30 ml-1"
        >
          Reset
        </button>
        <label className="flex items-center gap-1.5 text-xs text-smoke ml-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={useFlats}
            onChange={(e) => setUseFlats(e.target.checked)}
            className="accent-lilac"
          />
          Use flats
        </label>

        <div className="flex items-center gap-2 ml-3">
          <span className="text-xs text-smoke font-medium">Auto-scroll</span>
          <button
            onClick={() => setAutoScroll((a) => !a)}
            className="w-7 h-7 rounded bg-surface3 hover:bg-surface3/80 text-sm font-bold leading-none flex items-center justify-center"
            title={autoScroll ? 'Pause' : 'Play'}
          >
            {autoScroll ? '⏸' : '▶'}
          </button>
          <button
            onClick={() => setScrollSpeed((s) => Math.max(s - 0.5, 0.5))}
            className="w-7 h-7 rounded bg-surface3 hover:bg-surface3/80 text-lg font-bold leading-none"
          >
            −
          </button>
          <span className="text-sm w-10 text-center font-mono">{scrollSpeed}x</span>
          <button
            onClick={() => setScrollSpeed((s) => Math.min(s + 0.5, 10))}
            className="w-7 h-7 rounded bg-surface3 hover:bg-surface3/80 text-lg font-bold leading-none"
          >
            +
          </button>
        </div>

        {tab.pdf_path && (
          <button
            onClick={handleOpenPdf}
            className="ml-auto text-xs px-3 py-1.5 bg-surface3 hover:bg-surface3/80 rounded transition-colors"
          >
            Open PDF
          </button>
        )}
      </div>

      {/* Tab content */}
      <div ref={scrollRef} onWheel={handleWheel} className="flex-1 overflow-auto p-5">
        <TabDisplay content={content} />
      </div>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="text-center">
      <p className="text-xs text-dim">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}
