import { useState, useEffect } from 'react'

export default function SplashScreen({ onDone }: { onDone: () => void }): JSX.Element {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setExiting(true), 500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-void transition-transform duration-700 ease-in ${
        exiting ? 'translate-y-full' : 'translate-y-0'
      }`}
      onTransitionEnd={() => exiting && onDone()}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-16 h-16 text-lilac animate-moon-pop drop-shadow-[0_0_24px_rgba(185,163,227,0.5)]"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </div>
  )
}
