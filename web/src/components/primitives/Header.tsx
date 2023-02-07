/* eslint-disable @next/next/no-img-element */
import { signIn, signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'

export default function Header() {
  const session = useSession()
  const router = useRouter()
  return router.route.startsWith('/obs') ? null : (
    <div className="bg-red-200">
      <div className="flex flex-row gap-1 w-full max-w-6xl mx-auto overflow-hidden bg-blue-200">
        <h1 className="flex justify-center items-center text-2xl">Patron Herald</h1>
        {session?.status === 'authenticated' ? (
          <div className="flex flex-row gap-1 justify-center items-center">
            <img className="rounded-full w-10 aspect-square" src={session?.data?.user?.image || undefined} />
            <div>{session?.data?.user?.name}</div>
          </div>
        ) : null}
        <div className="text-sm flex-1 max-w-md bg-purple-200 overflow-hidden">Session: {JSON.stringify(session)}</div>
        <button onClick={() => signIn('patreon')}>Login</button>
        <button onClick={() => signOut()}>Logout</button>
      </div>
    </div>
  )
}
