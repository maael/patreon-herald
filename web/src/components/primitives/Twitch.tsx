/* eslint-disable @next/next/no-img-element */
import { signIn, useSession } from 'next-auth/react'
import { FaQuestion, FaTwitch } from 'react-icons/fa'

export default function Twitch() {
  const session = useSession() as any
  return (
    <div className="text-center flex flex-row gap-1 justify-center items-center">
      <TwitchPrompt />
      <div className="flex flex-row gap-3.5 justify-center items-center">
        <div className="relative">
          {session?.data?.twitch?.image ? (
            <img
              src={session?.data?.twitch?.image}
              className="w-10 aspect-square rounded-full drop-shadow-lg border-2 border-purple-600"
              title={`Connected to ${session?.data?.twitch?.displayName}`}
            />
          ) : (
            <div className="w-10 aspect-square rounded-full shadow border-2 bg-gray-200 border-purple-600 text-purple-600 flex justify-center items-center">
              <FaQuestion />
            </div>
          )}
          <div className="bg-white text-purple-600 text-xs p-1.5 rounded-full absolute -right-2 -bottom-2 shadow border-1">
            <FaTwitch />
          </div>
        </div>
        <h4 className="font-badscript font-bold text-lg hidden sm:block drop-shadow-lg">
          {session?.data?.twitch?.displayName}
        </h4>
      </div>
    </div>
  )
}

export function TwitchPrompt() {
  const session = useSession() as any
  return session?.data?.twitch ? null : (
    <button onClick={() => signIn('twitch')}>
      <FaTwitch className="text-purple-600 mr-1" /> Connect Twitch
    </button>
  )
}
