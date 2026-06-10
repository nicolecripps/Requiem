import { useState, useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { View, StyleSheet } from 'react-native'
import SetupView from './src/views/SetupView'
import LibraryView from './src/views/LibraryView'
import TabView from './src/views/TabView'
import SplashScreen from './src/components/SplashScreen'
import { getLibraryUrl } from './src/utils/storage'
import type { LibraryTab } from './src/types'

type Screen = 'loading' | 'setup' | 'library' | 'tab'

export default function App() {
  const [screen, setScreen] = useState<Screen>('loading')
  const [selectedTab, setSelectedTab] = useState<LibraryTab | null>(null)
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    getLibraryUrl().then(url => {
      setScreen(url ? 'library' : 'setup')
    })
  }, [])

  let content: JSX.Element | null = null

  if (screen === 'setup') {
    content = <SetupView onComplete={() => setScreen('library')} />
  } else if (screen === 'tab' && selectedTab) {
    content = <TabView tab={selectedTab} onBack={() => setScreen('library')} />
  } else if (screen === 'library') {
    content = (
      <LibraryView
        onOpenTab={tab => { setSelectedTab(tab); setScreen('tab') }}
        onResetUrl={() => { setSelectedTab(null); setScreen('setup') }}
      />
    )
  }

  return (
    <View style={s.root}>
      {content}
      {showSplash && <SplashScreen ready={screen !== 'loading'} onDone={() => setShowSplash(false)} />}
      <StatusBar style="light" />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
})
