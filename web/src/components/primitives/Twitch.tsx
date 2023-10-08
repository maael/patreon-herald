/* eslint-disable @next/next/no-img-element */
import { signIn, useSession } from 'next-auth/react'
import { FaQuestion, FaTimes, FaTwitch } from 'react-icons/fa'
import cls from 'classnames'

export default function Twitch({ canRemove }: { canRemove?: boolean }) {
  const session = useSession() as any
  const isRemovable = canRemove && session?.data?.twitch
  return (
    <div className="text-center flex flex-row gap-1 justify-center items-center group">
      <TwitchPrompt />
      <div
        className={cls('flex flex-row gap-3.5 justify-center items-center', { 'cursor-pointer': isRemovable })}
        onClick={async () => {
          if (!isRemovable) return
          const result = await fetch(`/api/internal/connection/${session?.data?.uid}`, {
            method: 'DELETE',
          })
          if (result.ok) {
            window.location.reload()
          } else {
            console.error('[error] Failed to remove twitch account')
          }
        }}
        title={isRemovable ? 'Remove Twitch account' : undefined}
      >
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
          {isRemovable ? (
            <div className="absolute top-0 left-0 w-10 aspect-square rounded-full shadow border-2 bg-red-200 border-red-600 text-red-600 justify-center items-center hidden group-hover:flex">
              <FaTimes />
            </div>
          ) : null}
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

export function useTwitch() {
  const session = useSession() as any
  return session?.data?.twitch
}

export function TwitchPrompt() {
  const twitch = useTwitch()
  return twitch ? null : (
    <button onClick={() => signIn('twitch')}>
      <FaTwitch className="text-purple-600 mr-1" /> Connect Twitch
    </button>
  )
}
