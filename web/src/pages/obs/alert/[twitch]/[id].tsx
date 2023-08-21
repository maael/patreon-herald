import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from 'react-query'
import tmi from 'tmi.js'

function makeAudio(target: HTMLAudioElement, audio?: any) {
  if (audio) {
    if (audio.ctx.state === 'suspended') {
      audio.ctx.resume()
    }
    return audio
  }
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const source = ctx.createMediaElementSource(target)
  const gain = ctx.createGain()
  source.connect(gain)
  gain.connect(ctx.destination)
  return { ctx, source, gain }
}

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
  const [audio, setAudio] = useState<
    | {
        ctx: AudioContext
        source: MediaElementAudioSourceNode
        gain: GainNode
      }
    | undefined
  >()
  console.info('[loaded]', { count: data?.size })
  useEffect(() => {
    console.info('[connect]', { twitch })
    const client = new tmi.Client({ channels: [twitch] })

    if (ref.current) setAudio(makeAudio(ref.current, audio))

    client.connect()

    client.on('message', (_channel, tags) => {
      const userId = tags['user-id']
      const sound = data?.get(userId)?.sound
      if (ref.current && sound) {
        // && !seenList.current.has(userId)) {
        console.info('[playing]', { userId, displayName: tags['display-name'], sound, audio })
        if (audio) {
          console.info('[audio:volume]', 5)
          audio.gain.gain.value = 0.1
        }
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
  }, [data, twitch, audio, setAudio])

  return (
    <audio
      controls
      ref={ref}
      className="invisible"
      crossOrigin="anonymous"
      onPlay={(e) => {
        setAudio(makeAudio(e.currentTarget, audio))
      }}
      onLoadStart={(e) => {
        setAudio(makeAudio(e.currentTarget, audio))
      }}
    >
      <source />
    </audio>
  )
}
