import { useEffect, useRef, useState } from 'react'
import intervalToDuration from 'date-fns/intervalToDuration'
import { FaDownload, FaPause, FaPlay, FaVolumeUp } from 'react-icons/fa'

const zeroPad = (num) => String(num).padStart(2, '0')

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
  useEffect(() => {
    let source: MediaElementAudioSourceNode
    let audioCtx: AudioContext
    if (ref.current && isPlaying) {
      console.info('[audio] connect and create')
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      source = audioCtx.createMediaElementSource(ref.current)
      // create a gain node
      const gainNode = audioCtx.createGain()
      gainNode.gain.value = 2 // double the volume
      source.connect(gainNode)
      // connect the gain node to an output destination
      gainNode.connect(audioCtx.destination)
    }
    return () => {
      if (source) {
        console.info('[audio] disconnect')
        source.disconnect()
      }
      if (audioCtx) {
        console.info('[audio] close')
        audioCtx.close()
      }
    }
  }, [volume, isPlaying])
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
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          crossOrigin="anonymous"
          onTimeUpdate={(e) => {
            setProgress(e.currentTarget.currentTime)
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
          max="2"
          step="0.01"
          value={volume?.toString()}
          className="w-full"
          onChange={(e) => {
            if (ref.current) {
              console.info('would set volume')
              // ref.current.volume = Math.min(volume, 1) // DANGER: Need to figure out how to boost
            }
            onVolumeChange(Number(e.target.value))
          }}
        />
      </div>
    </div>
  )
}
