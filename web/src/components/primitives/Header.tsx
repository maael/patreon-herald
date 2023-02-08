/* eslint-disable @next/next/no-img-element */
import { signIn, signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FaSignOutAlt, FaPatreon } from 'react-icons/fa'

export default function Header() {
  const session = useSession()
  const router = useRouter()
  return router.route.startsWith('/obs') ? null : (
    <div className="bg-red-200">
      <div className="flex flex-row gap-1 w-full max-w-6xl mx-auto overflow-hidden bg-blue-200">
        <Link href="/">
          <a>
            <h1 className="flex justify-center items-center text-2xl">Patron Herald</h1>
          </a>
        </Link>
        <div className="flex-1" />
        {session?.status === 'authenticated' ? (
          <div className="flex flex-row gap-1 justify-center items-center">
            <img className="rounded-full w-10 aspect-square" src={session?.data?.user?.image || undefined} />
            <div>{session?.data?.user?.name}</div>
          </div>
        ) : null}
        {session?.status === 'authenticated' ? (
          <button onClick={() => signOut()}>
            <FaSignOutAlt />
          </button>
        ) : (
          <button onClick={() => signIn('patreon')}>
            Login with <FaPatreon className="text-orange-500 ml-1" />
          </button>
        )}
      </div>
    </div>
  )
}
