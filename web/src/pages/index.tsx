import * as React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Banner from '~/components/primitives/Banner'

export default function Index() {
  const session = useSession()
  const router = useRouter()
  React.useEffect(() => {
    if (session.status === 'authenticated') {
      router.push('/patron')
    }
  }, [session.status, router])
  return (
    <>
      <Banner className="h-1/3">
        <h1 className="text-6xl font-bold font-badscript">Patreon Herald</h1>
        <p className="text-2xl font-bold">Time to roll out the carpet</p>
      </Banner>
      <div className="flex justify-center items-center text-center flex-1">
        <p className="font-badscript text-7xl">This is a work in progress</p>
      </div>
    </>
  )
}
