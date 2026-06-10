import { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, SafeAreaView,
  NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent
} from 'react-native'
import { useKeepAwake } from 'expo-keep-awake'
import TabDisplay from '../components/TabDisplay'
import { getAutoScrollSpeed, setAutoScrollSpeed } from '../utils/storage'
import type { LibraryTab } from '../types'

interface Props {
  tab: LibraryTab
  onBack: () => void
}

export default function TabView({ tab, onBack }: Props) {
  useKeepAwake()

  const [semitones, setSemitones] = useState(0)
  const [useFlats, setUseFlats] = useState(false)
  const [autoScroll, setAutoScroll] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(5)

  const scrollRef = useRef<ScrollView>(null)
  const offsetRef = useRef(0)
  const scrollPosRef = useRef(0)
  const contentHeightRef = useRef(0)
  const layoutHeightRef = useRef(0)

  useEffect(() => {
    getAutoScrollSpeed().then(setScrollSpeed)
  }, [])

  useEffect(() => {
    setAutoScrollSpeed(scrollSpeed)
  }, [scrollSpeed])

  useEffect(() => {
    if (!autoScroll) return undefined
    scrollPosRef.current = offsetRef.current
    const id = setInterval(() => {
      scrollPosRef.current += scrollSpeed * 0.5
      const max = contentHeightRef.current - layoutHeightRef.current
      if (scrollPosRef.current >= max) {
        scrollRef.current?.scrollTo({ y: Math.max(max, 0), animated: false })
        setAutoScroll(false)
      } else {
        scrollRef.current?.scrollTo({ y: scrollPosRef.current, animated: false })
      }
    }, 50)
    return () => clearInterval(id)
  }, [autoScroll, scrollSpeed])

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>): void {
    offsetRef.current = e.nativeEvent.contentOffset.y
  }

  function handleContentSizeChange(_w: number, h: number): void {
    contentHeightRef.current = h
  }

  function handleLayout(e: LayoutChangeEvent): void {
    layoutHeightRef.current = e.nativeEvent.layout.height
  }

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={s.titleBlock}>
          <Text style={s.title} numberOfLines={1}>{tab.title}</Text>
          <Text style={s.artist} numberOfLines={1}>{tab.artist}</Text>
        </View>
      </View>

      {/* Meta row */}
      {(tab.key || tab.capo || tab.tuning) ? (
        <View style={s.meta}>
          {tab.key    ? <Text style={s.metaItem}>Key: <Text style={s.metaVal}>{tab.key}</Text></Text> : null}
          {tab.capo   ? <Text style={s.metaItem}>Capo: <Text style={s.metaVal}>{tab.capo}</Text></Text> : null}
          {tab.tuning ? <Text style={s.metaItem}>Tuning: <Text style={s.metaVal}>{tab.tuning}</Text></Text> : null}
        </View>
      ) : null}

      {/* Transpose toolbar */}
      <View style={s.toolbar}>
        <Text style={s.toolLabel}>Transpose</Text>
        <TouchableOpacity style={s.transposeBtn} onPress={() => setSemitones(s2 => Math.max(s2 - 1, -11))}>
          <Text style={s.transposeBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={s.semitones}>
          {semitones === 0 ? 'Original' : semitones > 0 ? `+${semitones}` : semitones}
        </Text>
        <TouchableOpacity style={s.transposeBtn} onPress={() => setSemitones(s2 => Math.min(s2 + 1, 11))}>
          <Text style={s.transposeBtnText}>+</Text>
        </TouchableOpacity>
        {semitones !== 0 && (
          <TouchableOpacity onPress={() => setSemitones(0)} style={s.resetBtn}>
            <Text style={s.resetText}>Reset</Text>
          </TouchableOpacity>
        )}
        <View style={s.flatsRow}>
          <Text style={s.toolLabel}>Flats</Text>
          <Switch
            value={useFlats}
            onValueChange={setUseFlats}
            trackColor={{ true: '#b9a3e3' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Auto-scroll toolbar */}
      <View style={s.toolbar}>
        <Text style={s.toolLabel}>Auto-scroll</Text>
        <TouchableOpacity style={s.transposeBtn} onPress={() => setAutoScroll(a => !a)}>
          <Text style={s.transposeBtnText}>{autoScroll ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.transposeBtn} onPress={() => setScrollSpeed(sp => Math.max(sp - 0.5, 0.5))}>
          <Text style={s.transposeBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={s.semitones}>{scrollSpeed}x</Text>
        <TouchableOpacity style={s.transposeBtn} onPress={() => setScrollSpeed(sp => Math.min(sp + 0.5, 10))}>
          <Text style={s.transposeBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Tab content */}
      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        onScrollBeginDrag={() => setAutoScroll(false)}
      >
        <TabDisplay content={tab.content} semitones={semitones} useFlats={useFlats} />
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#0a0a0f' },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1c2b' },
  backBtn:       { marginRight: 12 },
  backText:      { color: '#9b96a8', fontSize: 14 },
  titleBlock:    { flex: 1 },
  title:         { color: '#e8e6f0', fontSize: 16, fontWeight: '700' },
  artist:        { color: '#9b96a8', fontSize: 13 },
  meta:          { flexDirection: 'row', gap: 16, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1f1c2b' },
  metaItem:      { color: '#6f6a7d', fontSize: 12 },
  metaVal:       { color: '#e8e6f0' },
  toolbar:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#15131c', borderBottomWidth: 1, borderBottomColor: '#1f1c2b' },
  toolLabel:     { color: '#9b96a8', fontSize: 12 },
  transposeBtn:  { width: 30, height: 30, borderRadius: 6, backgroundColor: '#2a2638', alignItems: 'center', justifyContent: 'center' },
  transposeBtnText: { color: '#e8e6f0', fontSize: 18, fontWeight: '600', lineHeight: 22 },
  semitones:     { color: '#e8e6f0', fontSize: 13, width: 60, textAlign: 'center' },
  resetBtn:      { paddingHorizontal: 8 },
  resetText:     { color: '#9b96a8', fontSize: 12 },
  flatsRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto' },
  scroll:        { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
})
