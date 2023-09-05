import { useQueue } from '@uidotdev/usehooks'
import { useCallback, useEffect, useState, useRef } from 'react'
import tmi from 'tmi.js'

function setupClient(onMessage: (tags: any, client: any) => void, twitch?: string, token?: string) {
  console.info('[setup_client]')
  const client = new tmi.Client({
    channels: [twitch],
    ...(token
      ? {
          identity: {
            username: twitch,
            password: `oauth:${token}`,
          },
        }
      : {}),
    options: { updateEmotesetsTimer: 0, skipUpdatingEmotesets: true },
  })
  client.on('connected', () => console.info('[connected]', client.readyState()))
  client.on('message', (_channel, tags) => {
    console.info('[message]')
    onMessage(tags, client)
  })
  client.connect()
  return client
}

function useStaticClient(onMessage: (tags: any, client: any) => void, twitch?: string, token?: string) {
  const [client, setClient] = useState(() => setupClient(onMessage, twitch, token))
  useEffect(() => {
    console.info('[remake_client]')
    client.disconnect()
    setClient(setupClient(onMessage, twitch, token))
    return () => client.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twitch, token])
  return client
}

export function makeAudio(target: HTMLAudioElement) {
  console.info('[makeAudio]')
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const source = ctx.createMediaElementSource(target)
  const gain = ctx.createGain()
  source.connect(gain)
  gain.connect(ctx.destination)
  return { ctx, source, gain }
}

export default function useTwitchAlert(twitch?: string, token?: string, data?: Map<string, any>) {
  const { add, remove, first, size } = useQueue<any>()
  const ref = useRef<HTMLAudioElement>()
  const [audio, setAudio] = useState<any>(null)
  const seenList = useRef<Set<string>>(new Set())
  const onMessage = useCallback(
    (tags, client) => {
      const userId = tags['user-id']
      if (!userId) {
        console.warn('Skipping, no user id')
        return
      }
      if (seenList.current.has(userId)) {
        console.warn('Skipping, already played')
        return
      }
      const sound = data?.get(userId)
      if (!sound?.sound) {
        console.warn('Skipping, no sound', data, tags)
        return
      }
      seenList.current.add(userId)
      add({ ...sound, key: Math.random() })
      try {
        if (token) {
          client?.say(twitch, `Roll out the red carpet, ${tags['display-name']} is here!`)
        }
      } catch (e) {
        console.error('[say:error]', e)
      }
    },
    [data, twitch, token, add]
  )
  useStaticClient(onMessage, twitch, token)
  useEffect(() => {
    console.info('[first]', audio, first, ref.current)
    if (ref.current && first) {
      if (audio) {
        console.info('[audio:volume]', first.volume)
        if (audio.ctx.state === 'suspended') {
          audio.ctx.resume()
        }
        audio.gain.gain.value = first.volume || 1
      }
      ref.current.src = first.sound
      console.info('[playing]')
      ref.current.pause()
      ref.current.currentTime = 0
      ref.current.load()
      ref.current.play()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [first?.key, audio])
  console.info('size', { first, size })
  return {
    audio,
    setAudio,
    ref,
    remove,
  }
}
