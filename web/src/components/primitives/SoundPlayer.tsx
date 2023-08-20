import { useEffect, useRef, useState } from 'react'
import intervalToDuration from 'date-fns/intervalToDuration'
import { FaDownload, FaPause, FaPlay, FaVolumeUp } from 'react-icons/fa'

const zeroPad = (num) => String(num).padStart(2, '0')

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

export default function SoundPlayer({
  src,
  volume = 1,
  onVolumeChange,
}: {
  src?: string
  volume?: number
  onVolumeChange: (newVolume: number) => void
}) {
  const ref = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    if (!ref.current) return
    ref.current.pause()
    ref.current.currentTime = 0
    ref.current.load()
  }, [src])
  const duration = intervalToDuration({ start: 0, end: (ref.current?.duration || 0) * 1000 })
  const currentTime = intervalToDuration({ start: 0, end: (progress || 0) * 1000 })
  const formatted = `${zeroPad(currentTime.minutes)}:${zeroPad(currentTime.seconds)}/${zeroPad(
    duration.minutes
  )}:${zeroPad(duration.seconds || 1)}`
  const [audio, setAudio] = useState<
    | {
        ctx: AudioContext
        source: MediaElementAudioSourceNode
        gain: GainNode
      }
    | undefined
  >()
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row gap-1 justify-center items-center">
        <button
          onClick={() => (isPlaying ? ref.current?.pause() : ref.current?.play())}
          className="rounded-full bg-orange-500 h-10 w-10 p-0 text-center text-white"
        >
          {isPlaying ? <FaPause /> : <FaPlay className="-mr-1" />}
        </button>
        <div className="flex flex-col justify-center items-start font-mono">
          {formatted}
          <div className="bg-gray-400 h-1 rounded-full transition-all w-full">
            <div
              className="bg-orange-600 h-1 rounded-full transition-all"
              style={{ width: `${(progress / (ref.current?.duration || 1)) * 100}%` }}
            />
          </div>
        </div>
        <a
          className="rounded-full bg-orange-500 h-7 w-7 p-0 text-center text-white flex justify-center items-center text-xs ml-1"
          href={src}
          download
        >
          <FaDownload />
        </a>
        <audio
          ref={ref}
          className="appearance-none"
          onPlay={(e) => {
            setIsPlaying(true)
            setAudio(makeAudio(e.currentTarget, audio))
          }}
          onPause={() => setIsPlaying(false)}
          crossOrigin="anonymous"
          onTimeUpdate={(e) => {
            setProgress(e.currentTarget.currentTime)
          }}
          onLoadStart={(e) => {
            setAudio(makeAudio(e.currentTarget, audio))
          }}
        >
          <source src={src} />
          Your browser does not support the audio element.
        </audio>
      </div>
      <div className="flex flex-row gap-2 justify-center items-center pl-3">
        <FaVolumeUp className="text-orange-500 text-2xl" />
        <input
          type="range"
          min="0"
          max="4"
          step="0.01"
          value={volume?.toString()}
          className="w-full"
          onChange={(e) => {
            const newVolume = Number(e.target.value)
            if (ref.current && audio) {
              audio.gain.gain.value = newVolume
            }
            onVolumeChange(newVolume)
          }}
        />
      </div>
    </div>
  )
}
