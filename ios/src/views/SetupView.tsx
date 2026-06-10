import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { getLibraryUrl, setLibraryUrl, getPassphrase, setPassphrase as storePassphrase } from '../utils/storage'

interface Props {
  onComplete: () => void
}

export default function SetupView({ onComplete }: Props) {
  const [url, setUrl] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getLibraryUrl(), getPassphrase()]).then(([savedUrl, savedPass]) => {
      if (savedUrl) setUrl(savedUrl)
      if (savedPass) setPassphrase(savedPass)
    })
  }, [])

  async function handleSave() {
    const trimmedUrl = url.trim()
    const trimmedPass = passphrase.trim()
    if (!trimmedUrl) { setError('Paste the Library URL from the Windows app.'); return }
    if (!trimmedUrl.startsWith('http')) { setError('URL must start with http or https.'); return }
    if (!trimmedPass) { setError('Enter the passphrase from the Windows app.'); return }
    await setLibraryUrl(trimmedUrl)
    await storePassphrase(trimmedPass)
    onComplete()
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.card}>
        <Text style={s.title}>Guitar Tab Reader</Text>
        <Text style={s.sub}>
          Enter the Library URL and Passphrase from{'\n'}
          the Windows app to connect your library.
        </Text>

        <View style={s.steps}>
          <Text style={s.step}>1. In the Windows app → Settings → Sync Now</Text>
          <Text style={s.step}>2. Copy the Library URL shown below the Sync button</Text>
          <Text style={s.step}>3. Copy the Passphrase shown below it</Text>
          <Text style={s.step}>4. Paste both below</Text>
        </View>

        <TextInput
          style={s.input}
          value={url}
          onChangeText={t => { setUrl(t); setError('') }}
          placeholder="https://raw.githubusercontent.com/..."
          placeholderTextColor="#6f6a7d"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <TextInput
          style={s.input}
          value={passphrase}
          onChangeText={t => { setPassphrase(t); setError('') }}
          placeholder="Passphrase"
          placeholderTextColor="#6f6a7d"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {!!error && <Text style={s.error}>{error}</Text>}

        <TouchableOpacity style={s.btn} onPress={handleSave}>
          <Text style={s.btnText}>Connect Library</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', padding: 24 },
  card:    { backgroundColor: '#15131c', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: '#1f1c2b' },
  title:   { color: '#b9a3e3', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  sub:     { color: '#9b96a8', fontSize: 14, lineHeight: 22, marginBottom: 16 },
  steps:   { backgroundColor: '#0a0a0f', borderRadius: 8, padding: 12, marginBottom: 16, gap: 6 },
  step:    { color: '#6f6a7d', fontSize: 12, lineHeight: 18 },
  input:   { backgroundColor: '#1f1c2b', color: '#e8e6f0', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }), marginBottom: 12 },
  error:   { color: '#f87171', fontSize: 13, marginBottom: 12 },
  btn:     { backgroundColor: '#b9a3e3', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#0a0a0f', fontWeight: '700', fontSize: 15 },
})
