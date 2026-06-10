import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native'
import { ABOUT_INFO } from '@shared/about'

interface Props {
  visible: boolean
  onClose: () => void
}

export default function AboutModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={s.card}>
          <Text style={s.title}>{ABOUT_INFO.appName}</Text>
          <Text style={s.version}>v{ABOUT_INFO.version}</Text>

          <View style={s.row}>
            <Text style={s.label}>Created by</Text>
            <Text style={s.value}>{ABOUT_INFO.creator} · {ABOUT_INFO.year}</Text>
          </View>

          <View style={s.row}>
            <Text style={s.label}>Tab data sourced from</Text>
            <Text style={s.value}>{ABOUT_INFO.dataSource}</Text>
          </View>

          <Text style={s.disclaimer}>{ABOUT_INFO.disclaimer}</Text>

          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  card:        { backgroundColor: '#15131c', borderRadius: 12, width: '100%', padding: 20, borderWidth: 1, borderColor: '#1f1c2b' },
  title:       { color: '#b9a3e3', fontSize: 18, fontWeight: '700' },
  version:     { color: '#6f6a7d', fontSize: 12, marginTop: 2, marginBottom: 16 },
  row:         { marginBottom: 10 },
  label:       { color: '#6f6a7d', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  value:       { color: '#e8e6f0', fontSize: 14, marginTop: 2 },
  disclaimer:  { color: '#6f6a7d', fontSize: 12, lineHeight: 18, marginTop: 8 },
  closeBtn:    { marginTop: 20, alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#2a2638', borderRadius: 8 },
  closeBtnText:{ color: '#e8e6f0', fontSize: 13, fontWeight: '600' },
})
