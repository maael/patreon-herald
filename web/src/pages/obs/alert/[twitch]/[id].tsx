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
          const criteriaCents = data?.campaign?.entitledCriteria?.amountCents
          return new Map<string, any>(
            data.connections
              .map((c) => {
                const sound = (data?.campaign?.sounds || {})[c.patreon.id] || {}
                if (!sound.isApproved) return
                const entitlement = (data?.campaign?.entitlements || {})[c.patreon.id] || {}
                if ((entitlement.currentlyEntitledAmountsCents || 0) < criteriaCents) return
                return [c.twitch.id, { ...c, ...sound, sound: `https://files.mael-cdn.com${sound.sound}` }]
              })
              .filter(Boolean)
          )
        }),
  })
  console.info('[loaded]', { count: data?.size })
  useEffect(() => {
    console.info('[connect]', { twitch })
    const client = new tmi.Client({ channels: [twitch] })

    client.connect()

    client.on('message', (_channel, tags) => {
      const userId = tags['user-id']
      const sound = data?.get(userId)?.sound
      if (ref.current && sound && !seenList.current.has(userId)) {
        console.info('[playing]', { userId, displayName: tags['display-name'], sound })
        seenList.current.add(userId)
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
