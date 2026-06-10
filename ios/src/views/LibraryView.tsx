import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, RefreshControl, ActivityIndicator, ScrollView, Modal
} from 'react-native'
import { fetchLibrary, loadBundledLibrary } from '../utils/library'
import { getLibraryUrl, clearLibraryUrl, getPassphrase, clearPassphrase } from '../utils/storage'
import AboutModal from '../components/AboutModal'
import type { LibraryTab } from '../types'

interface Props {
  onOpenTab: (tab: LibraryTab) => void
  onResetUrl: () => void
}

export default function LibraryView({ onOpenTab, onResetUrl }: Props) {
  const [tabs, setTabs] = useState<LibraryTab[]>([])
  const [query, setQuery] = useState('')
  const [filterKey, setFilterKey] = useState('')
  const [filterCapo, setFilterCapo] = useState<number | null>(null)
  const [sortKey, setSortKey] = useState<'title' | 'artist' | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exportedAt, setExportedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAbout, setShowAbout] = useState(false)
  const loadedOnceRef = useRef(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const url = await getLibraryUrl()
      const passphrase = await getPassphrase()
      const lib = (url && passphrase) ? await fetchLibrary(url, passphrase) : loadBundledLibrary()
      setTabs(lib.tabs)
      setExportedAt(lib.exportedAt)
      loadedOnceRef.current = true
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load library.')
      if (!loadedOnceRef.current) {
        const lib = loadBundledLibrary()
        setTabs(lib.tabs)
        setExportedAt(lib.exportedAt)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

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

  const keyOptions = useMemo(() => [
    { value: '', label: 'All Keys' },
    ...uniqueKeys.map(k => ({ value: k, label: k }))
  ], [uniqueKeys])

  const capoOptions = useMemo(() => [
    { value: '', label: 'Any Capo' },
    ...uniqueCapos.map(c => ({ value: String(c), label: c === 0 ? 'No Capo' : `Capo ${c}` }))
  ], [uniqueCapos])

  const filtered = tabs.filter(t => {
    if (query.trim()) {
      const q = query.toLowerCase()
      if (!t.title.toLowerCase().includes(q) && !t.artist.toLowerCase().includes(q)) return false
    }
    if (filterKey && t.key !== filterKey) return false
    if (filterCapo !== null && t.capo !== filterCapo) return false
    return true
  })

  const hasFilters = !!(query.trim() || filterKey || filterCapo !== null)

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const va = a[sortKey].toLowerCase()
        const vb = b[sortKey].toLowerCase()
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      })
    : filtered

  function toggleSort(key: 'title' | 'artist') {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  async function handleReset() {
    await clearLibraryUrl()
    await clearPassphrase()
    onResetUrl()
  }

  if (loading) {
    return (
      <SafeAreaView style={s.root}>
        <ActivityIndicator color="#b9a3e3" style={{ marginTop: 60 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.brand}>Guitar Tab Reader</Text>
        <View style={s.headerActions}>
          <TouchableOpacity onPress={() => setShowAbout(true)}>
            <Text style={s.infoIcon}>ⓘ</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReset}>
            <Text style={s.changeUrl}>Change URL</Text>
          </TouchableOpacity>
        </View>
      </View>

      <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} />

      {/* Search */}
      <View style={s.searchRow}>
        <TextInput
          style={s.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search title or artist..."
          placeholderTextColor="#6f6a7d"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filters & Sort */}
      <View style={s.filterRow}>
        {uniqueKeys.length > 0 && (
          <FilterDropdown options={keyOptions} selectedValue={filterKey} onSelect={setFilterKey} />
        )}
        {uniqueCapos.length > 0 && (
          <FilterDropdown
            options={capoOptions}
            selectedValue={filterCapo === null ? '' : String(filterCapo)}
            onSelect={v => setFilterCapo(v === '' ? null : parseInt(v, 10))}
          />
        )}
        <Text style={s.sortLabel}>Sort:</Text>
        <TouchableOpacity style={[s.sortBtn, sortKey === 'title' && s.sortBtnActive]} onPress={() => toggleSort('title')}>
          <Text style={[s.sortBtnText, sortKey === 'title' && s.sortBtnTextActive]}>
            Title{sortKey === 'title' ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.sortBtn, sortKey === 'artist' && s.sortBtnActive]} onPress={() => toggleSort('artist')}>
          <Text style={[s.sortBtnText, sortKey === 'artist' && s.sortBtnTextActive]}>
            Artist{sortKey === 'artist' ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <Text style={s.errorBanner}>{error}</Text>
      )}

      {exportedAt && (
        <Text style={s.synced}>
          Library synced {new Date(exportedAt).toLocaleString()}
        </Text>
      )}

      <FlatList
        data={sorted}
        keyExtractor={t => String(t.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor="#b9a3e3"
          />
        }
        ListEmptyComponent={
          <Text style={s.empty}>
            {hasFilters ? 'No tabs match your filters.' : 'No tabs in library.'}
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={s.row} onPress={() => onOpenTab(item)} activeOpacity={0.7}>
            <View style={s.rowMain}>
              <Text style={s.rowTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={s.rowArtist} numberOfLines={1}>{item.artist}</Text>
            </View>
            <View style={s.rowMeta}>
              {item.type ? <Text style={s.badge}>{item.type}</Text> : null}
              {item.key  ? <Text style={s.metaText}>Key: {item.key}</Text> : null}
              {item.capo ? <Text style={s.metaText}>Capo {item.capo}</Text> : null}
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={s.sep} />}
      />
    </SafeAreaView>
  )
}

interface DropdownOption {
  value: string
  label: string
}

function FilterDropdown({ options, selectedValue, onSelect }: {
  options: DropdownOption[]
  selectedValue: string
  onSelect: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === selectedValue) ?? options[0]

  return (
    <>
      <TouchableOpacity style={s.dropdown} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={s.dropdownText} numberOfLines={1}>{selected.label}</Text>
        <Text style={s.dropdownArrow}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={s.modalCard}>
            <ScrollView>
              {options.map(o => (
                <TouchableOpacity
                  key={o.value}
                  style={s.modalOption}
                  onPress={() => { onSelect(o.value); setOpen(false) }}
                >
                  <Text style={[s.modalOptionText, o.value === selectedValue && s.modalOptionTextActive]}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#0a0a0f' },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  brand:     { color: '#b9a3e3', fontSize: 18, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  infoIcon:  { color: '#6f6a7d', fontSize: 16 },
  changeUrl: { color: '#6f6a7d', fontSize: 12 },
  searchRow: { paddingHorizontal: 16, paddingBottom: 8 },
  search:    { backgroundColor: '#1f1c2b', color: '#e8e6f0', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  filterRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  dropdown:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1f1c2b', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  dropdownText: { color: '#e8e6f0', fontSize: 13, fontWeight: '600' },
  dropdownArrow: { color: '#6f6a7d', fontSize: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalCard: { backgroundColor: '#15131c', borderRadius: 12, maxHeight: '60%', width: '100%', paddingVertical: 8, borderWidth: 1, borderColor: '#1f1c2b' },
  modalOption: { paddingHorizontal: 20, paddingVertical: 14 },
  modalOptionText: { color: '#e8e6f0', fontSize: 15 },
  modalOptionTextActive: { color: '#b9a3e3', fontWeight: '700' },
  sortLabel: { color: '#6f6a7d', fontSize: 12 },
  sortBtn:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  sortBtnActive: { backgroundColor: 'rgba(185,163,227,0.15)' },
  sortBtnText: { color: '#9b96a8', fontSize: 12, fontWeight: '600' },
  sortBtnTextActive: { color: '#b9a3e3' },
  synced:    { color: '#2a2638', fontSize: 11, textAlign: 'center', paddingBottom: 6 },
  errorBanner: { color: '#f87171', fontSize: 12, textAlign: 'center', paddingHorizontal: 16, paddingBottom: 6 },
  row:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  rowMain:   { flex: 1, marginRight: 12 },
  rowTitle:  { color: '#e8e6f0', fontSize: 15, fontWeight: '600', marginBottom: 1 },
  rowArtist: { color: '#9b96a8', fontSize: 13 },
  rowMeta:   { flexDirection: 'row', gap: 6, alignItems: 'center', flexShrink: 0 },
  badge:     { color: '#e8e6f0', fontSize: 11, backgroundColor: '#2a2638', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  metaText:  { color: '#6f6a7d', fontSize: 11 },
  sep:       { height: 1, backgroundColor: '#1f1c2b', marginHorizontal: 16 },
  empty:     { color: '#6f6a7d', fontSize: 14, textAlign: 'center', marginTop: 60 },
})
