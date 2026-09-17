import { useEffect, useState } from 'react'

const CHECK_INTERVAL_MS = 5 * 60 * 1000

// Ohne Service Worker gibt es keinen eingebauten "neue Version"-Mechanismus.
// Stattdessen vergleichen wir das aktuell geladene Haupt-Skript (Vite hasht
// den Dateinamen bei jedem Build neu) mit dem, was gerade tatsächlich auf dem
// Server liegt - lädt man / frisch (kein Cache dank vercel.json), verrät ein
// anderer Dateiname zuverlässig, dass es ein neueres Deployment gibt.
async function fetchLatestScriptSrc() {
  const res = await fetch('/', { cache: 'no-store' })
  const html = await res.text()
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const src = doc.querySelector('script[type="module"]')?.getAttribute('src')
  return src ? new URL(src, window.location.origin).href : null
}

export function useUpdateAvailable() {
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    const currentSrc = document.querySelector('script[type="module"]')?.src
    if (!currentSrc) return

    let cancelled = false

    async function check() {
      try {
        const latestSrc = await fetchLatestScriptSrc()
        if (!cancelled && latestSrc && latestSrc !== currentSrc) setAvailable(true)
      } catch {
        // Netzwerkfehler ignorieren - der nächste Versuch holt es nach.
      }
    }

    function onVisible() {
      if (document.visibilityState === 'visible') check()
    }

    check()
    const interval = setInterval(check, CHECK_INTERVAL_MS)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return available
}
