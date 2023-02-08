import { signIn, useSession } from 'next-auth/react'
import { FaTwitch } from 'react-icons/fa'

export default function Twitch() {
  const session = useSession() as any
  return (
    <div className="text-center flex flex-col gap-1 justify-center items-center">
      Twitch
      {session?.data?.twitch ? null : (
        <button onClick={() => signIn('twitch')}>
          <FaTwitch className="text-purple-600" /> Twitch Login
        </button>
      )}
      <img src={session?.data?.twitch?.image} className="w-10 aspect-square rounded-full" />
      <h4>{session?.data?.twitch?.displayName}</h4>
    </div>
  )
}
