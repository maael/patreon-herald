import { useEffect, useRef } from 'react'

export default function SoundPlayer({ src }: { src?: string }) {
  const ref = useRef<HTMLAudioElement>(null)
  useEffect(() => {
    if (!ref.current) return
    ref.current.pause()
    ref.current.currentTime = 0
    ref.current.load()
  }, [src])
  return (
    <audio controls ref={ref}>
      <source src={src} />
      Your browser does not support the audio element.
    </audio>
  )
}
