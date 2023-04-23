/* eslint-disable @next/next/no-img-element */
import { FaPatreon, FaTwitch } from 'react-icons/fa'

export function PatreonUserLabel({ image, name }: { image?: string | null; name?: string | null }) {
  return (
    <div className="inline-block mr-1">
      <div className="flex flex-row gap-3 justify-center items-center">
        <div className="relative">
          <img
            className="rounded-full w-8 aspect-square drop-shadow-lg border-2 border-orange-600"
            src={image || undefined}
            title={`${name}`}
          />
          <div className="bg-white text-orange-500 text-xs p-1.5 rounded-full absolute -right-2 -bottom-2 shadow">
            <FaPatreon />
          </div>
        </div>
        <div className="font-bold text-black text-xl drop-shadow-lg">{name}</div>
      </div>
    </div>
  )
}

export function TwitchUserLabel({ image, name }: { image?: string | null; name?: string | null }) {
  return (
    <div className="inline-block mr-1">
      <div className="flex flex-row gap-3 justify-center items-center">
        <div className="relative">
          <img
            className="rounded-full w-8 aspect-square drop-shadow-lg border-2 border-purple-600"
            src={image || undefined}
            title={`${name}`}
          />
          <div className="bg-white text-purple-500 text-xs p-1.5 rounded-full absolute -right-2 -bottom-2 shadow">
            <FaTwitch />
          </div>
        </div>
        <div className="font-bold text-black text-xl drop-shadow-lg">{name}</div>
      </div>
    </div>
  )
}
