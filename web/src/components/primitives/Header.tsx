/* eslint-disable @next/next/no-img-element */
import { signIn, signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FaSignOutAlt, FaPatreon } from 'react-icons/fa'
import TrumpetSvg from './TrumpetSvg'
import Twitch from './Twitch'

function Patreon({ image, name }: { image?: string | null; name?: string | null }) {
  return (
    <div className="flex flex-row gap-3.5 justify-center items-center">
      <div className="relative">
        <img
          className="rounded-full w-10 aspect-square drop-shadow-lg border-2 border-orange-600"
          src={image || undefined}
          title={`Logged in as ${name}`}
        />
        <div className="bg-white text-orange-500 text-xs p-1.5 rounded-full absolute -right-2 -bottom-2 shadow">
          <FaPatreon />
        </div>
      </div>
      <div className="font-badscript font-bold text-white text-xl drop-shadow-lg hidden sm:block">{name}</div>
    </div>
  )
}

export default function Header() {
  const session = useSession()
  const router = useRouter()
  return router.route.startsWith('/obs') ? null : (
    <div className="bg-orange-400 py-2 px-5">
      <div className="flex flex-row gap-1 w-full max-w-6xl mx-auto">
        <Link href="/">
          <a>
            <h1 className="flex justify-center items-center text-2xl bg-white rounded-full p-3 fill-orange-500 shadow-md transition-transform hover:scale-105">
              <TrumpetSvg width="2rem" height="2rem" />
            </h1>
          </a>
        </Link>
        <div className="flex-1" />
        {session?.status === 'authenticated' ? (
          <div className="flex flex-row gap-5 sm:gap-8 justify-center items-center mx-5 sm:mx-5 text-white">
            <Twitch canRemove />
            <Patreon image={session?.data?.user?.image} name={session?.data?.user?.name} />
          </div>
        ) : null}
        {session?.status === 'authenticated' ? (
          <button onClick={() => signOut()} className="font-badscript">
            <span className="hidden sm:block mr-1">Logout</span>
            <FaSignOutAlt />
          </button>
        ) : (
          <button onClick={() => signIn('patreon')} className="font-badscript">
            Login with <FaPatreon className="text-orange-500 ml-2" />
          </button>
        )}
      </div>
    </div>
  )
}
