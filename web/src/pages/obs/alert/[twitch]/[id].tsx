import { useRouter } from 'next/router'
import { useEffect, useRef } from 'react'
import { useQuery } from 'react-query'
import tmi from 'tmi.js'

export default function Alert() {
  const seenList = useRef<Set<string>>(new Set())
  const ref = useRef<HTMLAudioElement>(null)
  const {
    query: { id, twitch },
  } = useRouter()
  const { data } = useQuery(['alerts', id], {
    queryFn: async () =>
      fetch(`/api/internal/alert/${id}`)
        .then((r) => r.json())
        .then((data) => {
          return new Map<string, any>(
            data.connections
              .map((c) => {
                const sound = (data?.campaign?.sounds || {})[c.patreon.id] || {}
                if (!sound.isApproved) return
                return [c.twitch.id, { ...c, ...sound, sound: `https://files.mael-cdn.com${sound.sound}` }]
              })
              .filter(Boolean)
          )
        }),
  })
  useEffect(() => {
    const client = new tmi.Client({ channels: [twitch] })

    client.connect()

    client.on('message', (_channel, tags) => {
      const sound = data?.get(tags['user-id'])?.sound
      if (ref.current && sound && !seenList.current.has(tags['user-id'])) {
        seenList.current.add(tags['user-id'])
        ref.current.src = sound
        ref.current.pause()
        ref.current.currentTime = 0
        ref.current.load()
        ref.current.play()
      }
    })

    return () => {
      client.disconnect()
    }
  }, [data, twitch])

  return (
    <audio controls ref={ref} className="invisible">
      <source />
    </audio>
  )
}
