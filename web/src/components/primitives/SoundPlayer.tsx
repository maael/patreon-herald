import { useEffect, useRef, useState } from 'react'
import intervalToDuration from 'date-fns/intervalToDuration'
import { FaDownload, FaPause, FaPlay } from 'react-icons/fa'

const zeroPad = (num) => String(num).padStart(2, '0')

export default function SoundPlayer({ src }: { src?: string }) {
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
  return (
    <>
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
          onTimeUpdate={(e) => {
            setProgress(e.currentTarget.currentTime)
          }}
        >
          <source src={src} />
          Your browser does not support the audio element.
        </audio>
      </div>
    </>
  )
}
