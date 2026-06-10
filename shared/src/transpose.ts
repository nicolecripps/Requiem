const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLATS  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

const FLAT_TO_SHARP: Record<string, string> = {
  Db: 'C#', Eb: 'D#', Fb: 'E', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B'
}

function rootIndex(root: string): number {
  const normalised = FLAT_TO_SHARP[root] ?? root
  return SHARPS.indexOf(normalised)
}

function shiftRoot(root: string, semitones: number, useFlats: boolean): string {
  const idx = rootIndex(root)
  if (idx === -1) return root
  const newIdx = ((idx + semitones) % 12 + 12) % 12
  return useFlats ? FLATS[newIdx] : SHARPS[newIdx]
}

// Matches a single chord name (root + optional suffix + optional bass note)
const CHORD_NAME_RE = /^([A-G][b#]?)((?:maj|min|m|M|aug|dim|sus|add|dom)?\d*(?:\/[A-G][b#]?)?)$/

export function transposeChord(chord: string, semitones: number, useFlats = false): string {
  if (semitones === 0) return chord
  const m = chord.match(CHORD_NAME_RE)
  if (!m) return chord
  const [, root, suffix] = m
  const newRoot = shiftRoot(root, semitones, useFlats)
  const newSuffix = suffix.replace(/\/([A-G][b#]?)/, (_: string, bassRoot: string) =>
    '/' + shiftRoot(bassRoot, semitones, useFlats)
  )
  return newRoot + newSuffix
}

// Transposes content that uses UG's [ch]chord[/ch] inline markup
export function transposeTab(content: string, semitones: number, useFlats = false): string {
  if (semitones === 0) return content
  return content.replace(/\[ch\]([^\[]+)\[\/ch\]/g, (_, chord) =>
    `[ch]${transposeChord(chord.trim(), semitones, useFlats)}[/ch]`
  )
}

// Extracts unique chord names from UG [ch]...[/ch] markup
export function extractChords(content: string): string[] {
  const found = new Set<string>()
  const re = /\[ch\]([^\[]+)\[\/ch\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) {
    found.add(m[1].trim())
  }
  return Array.from(found).sort()
}

// Section tag names UG uses
const SECTION_TAGS = new Set([
  'verse', 'chorus', 'bridge', 'intro', 'outro',
  'pre-chorus', 'interlude', 'hook', 'solo', 'breakdown', 'tab'
])

export function isSectionTag(tag: string): boolean {
  const lower = tag.toLowerCase().replace(/\s+\d+$/, '') // strip trailing numbers
  return SECTION_TAGS.has(lower)
}
