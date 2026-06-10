import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'

export default function SplashScreen({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const scale = useRef(new Animated.Value(0.4)).current
  const translateY = useRef(new Animated.Value(0)).current
  const [bounced, setBounced] = useState(false)

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true })
      .start(() => setBounced(true))
  }, [])

  useEffect(() => {
    if (bounced && ready) {
      Animated.timing(translateY, {
        toValue: 1000,
        duration: 600,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(onDone)
    }
  }, [bounced, ready])

  return (
    <Animated.View style={[s.root, { transform: [{ translateY }] }]} pointerEvents="none">
      <Animated.View style={[s.moonWrap, { transform: [{ scale }] }]}>
        <View style={s.moonBase} />
        <View style={s.moonCutout} />
      </Animated.View>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0a0a0f', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  moonWrap: { width: 72, height: 72 },
  moonBase: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#b9a3e3', shadowColor: '#b9a3e3', shadowOpacity: 0.6, shadowRadius: 24, shadowOffset: { width: 0, height: 0 } },
  moonCutout: { position: 'absolute', width: 72, height: 72, borderRadius: 36, backgroundColor: '#0a0a0f', top: -10, left: 22 },
})
