import { Howl } from 'howler'
import { useEffect } from 'react'

const sound = new Howl({
  src: ['/sounds/pleasing-bell.ogg'],
})
export default function Alert() {
  useEffect(() => {
    const interval = setInterval(() => sound.play(), 2_000)
    return () => {
      clearInterval(interval)
    }
  }, [])
  return null
}
