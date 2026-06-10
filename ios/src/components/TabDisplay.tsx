import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native'
import { transposeTab } from '@shared/transpose'

const MONO = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' })

const SECTION_NAMES = new Set([
  'verse', 'chorus', 'bridge', 'intro', 'outro',
  'pre-chorus', 'interlude', 'hook', 'solo', 'breakdown', 'tab'
])

type Block =
  | { type: 'section'; label: string }
  | { type: 'chord'; text: string }
  | { type: 'tab'; text: string }
  | { type: 'lyric'; text: string }
  | { type: 'blank' }

function classifyLine(line: string): Block {
  const stripped = line.replace(/\[ch\]([^\[]*?)\[\/ch\]/g, '$1')
  const trimmed = stripped.trim()

  if (trimmed === '') return { type: 'blank' }
  if (/^\[\/[^\]]+\]$/.test(trimmed)) return { type: 'blank' }

  const secMatch = trimmed.match(/^\[([^\]\/]+)\]$/)
  if (secMatch) {
    const name = secMatch[1].toLowerCase().replace(/\s+\d+$/, '')
    if (SECTION_NAMES.has(name)) {
      const raw = secMatch[1]
      return { type: 'section', label: raw.charAt(0).toUpperCase() + raw.slice(1) }
    }
  }

  if (/^[A-Z][A-Z\s\d\-]+$/.test(trimmed) && trimmed.length < 40) {
    const lower = trimmed.toLowerCase().replace(/\s+\d+$/, '').trim()
    if (SECTION_NAMES.has(lower)) {
      return { type: 'section', label: trimmed.charAt(0) + trimmed.slice(1).toLowerCase() }
    }
  }

  if (/^[EBGDAe]\|/.test(trimmed)) return { type: 'tab', text: stripped }

  const tokens = stripped.trim().split(/\s+/)
  const chordLike = tokens.filter(t => /^[A-G][b#]?(maj|min|m|M|aug|dim|sus|add|\d|\/[A-G])*$/.test(t))
  if (chordLike.length > 0 && chordLike.length === tokens.length) {
    return { type: 'chord', text: stripped }
  }

  return { type: 'lyric', text: stripped }
}

function parseContent(raw: string): Block[] {
  const cleaned = raw.replace(/\[tab\]/g, '').replace(/\[\/tab\]/g, '')
  return cleaned.split(/\r?\n/).map(classifyLine)
}

interface Props {
  content: string
  semitones?: number
  useFlats?: boolean
}

export default function TabDisplay({ content, semitones = 0, useFlats = false }: Props) {
  const transposed = transposeTab(content, semitones, useFlats)
  const blocks = parseContent(transposed)

  return (
    <View>
      {blocks.map((block, i) => {
        if (block.type === 'blank') {
          return <View key={i} style={s.blank} />
        }
        if (block.type === 'section') {
          return <Text key={i} style={s.section}>{block.label}</Text>
        }
        if (block.type === 'chord') {
          return <Text key={i} style={s.chord}>{block.text}</Text>
        }
        if (block.type === 'tab') {
          return (
            <ScrollView key={i} horizontal showsHorizontalScrollIndicator={false}>
              <Text style={s.tab}>{block.text}</Text>
            </ScrollView>
          )
        }
        return <Text key={i} style={s.lyric}>{block.text}</Text>
      })}
    </View>
  )
}

const s = StyleSheet.create({
  blank:   { height: 8 },
  section: { color: '#b9a3e3', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 4 },
  chord:   { color: '#b9a3e3', fontFamily: MONO, fontSize: 13, lineHeight: 20 },
  tab:     { color: '#4ade80', fontFamily: MONO, fontSize: 13, lineHeight: 20 },
  lyric:   { color: '#e8e6f0', fontSize: 14, lineHeight: 22 },
})
