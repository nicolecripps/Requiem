interface Props {
  content: string
}

export default function TabDisplay({ content }: Props): JSX.Element {
  const blocks = parseContent(content)

  return (
    <div className="tab-content text-ink">
      {blocks.map((block, i) => {
        if (block.type === 'section') {
          return (
            <div key={i} className="mt-5 mb-1 text-xs font-bold uppercase tracking-widest text-lilac">
              {block.label}
            </div>
          )
        }
        if (block.type === 'chord') {
          return (
            <div key={i} className="text-lilac font-semibold whitespace-pre leading-5">
              {block.text}
            </div>
          )
        }
        if (block.type === 'tab') {
          return (
            <div key={i} className="text-green-400 whitespace-pre leading-5">
              {block.text}
            </div>
          )
        }
        if (block.type === 'blank') {
          return <div key={i} className="h-2" />
        }
        return (
          <div key={i} className="whitespace-pre leading-5">
            {block.text}
          </div>
        )
      })}
    </div>
  )
}

type Block =
  | { type: 'section'; label: string }
  | { type: 'chord'; text: string }
  | { type: 'tab'; text: string }
  | { type: 'lyric'; text: string }
  | { type: 'blank' }

const SECTION_NAMES = new Set([
  'verse', 'chorus', 'bridge', 'intro', 'outro',
  'pre-chorus', 'interlude', 'hook', 'solo', 'breakdown', 'tab'
])

function parseContent(raw: string): Block[] {
  // Strip [tab]/[/tab] wrappers — content is classified line-by-line.
  // classifyLine already detects guitar-string notation (e|, B|, etc.)
  const cleaned = raw.replace(/\[tab\]/g, '').replace(/\[\/tab\]/g, '')
  return cleaned.split(/\r?\n/).map(classifyLine)
}

function classifyLine(line: string): Block {
  // Strip [ch]...[/ch] wrapper tags — keep just the chord name inside
  const stripped = line.replace(/\[ch\]([^\[]*?)\[\/ch\]/g, '$1')
  const trimmed = stripped.trim()

  if (trimmed === '') return { type: 'blank' }

  // Section close tag [/anything] — skip
  if (/^\[\/[^\]]+\]$/.test(trimmed)) return { type: 'blank' }

  // Section open tag: [chorus], [verse 2], etc.
  const secMatch = trimmed.match(/^\[([^\]\/]+)\]$/)
  if (secMatch) {
    const name = secMatch[1].toLowerCase().replace(/\s+\d+$/, '')
    if (SECTION_NAMES.has(name)) {
      const raw = secMatch[1]
      return { type: 'section', label: raw.charAt(0).toUpperCase() + raw.slice(1) }
    }
  }

  // Uppercase section label without brackets (e.g. "VERSE 1", "CHORUS")
  if (/^[A-Z][A-Z\s\d\-]+$/.test(trimmed) && trimmed.length < 40) {
    const lower = trimmed.toLowerCase().replace(/\s+\d+$/, '').trim()
    if (SECTION_NAMES.has(lower)) {
      return { type: 'section', label: trimmed.charAt(0) + trimmed.slice(1).toLowerCase() }
    }
  }

  // Tab notation line: starts with string name + pipe
  if (/^[EBGDAe]\|/.test(trimmed)) {
    return { type: 'tab', text: stripped }
  }

  // Chord-only line: all whitespace-separated tokens look like chord names
  if (isChordOnlyLine(stripped)) {
    return { type: 'chord', text: stripped }
  }

  return { type: 'lyric', text: stripped }
}

function isChordOnlyLine(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  const tokens = trimmed.split(/\s+/)
  const chordLike = tokens.filter(t => /^[A-G][b#]?(maj|min|m|M|aug|dim|sus|add|\d|\/[A-G])*$/.test(t))
  return chordLike.length > 0 && chordLike.length === tokens.length
}
