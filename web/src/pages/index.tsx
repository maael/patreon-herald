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
    <Banner>
      <h1 className="text-6xl font-bold font-badscript">Patreon Herald</h1>
      <p className="text-2xl font-bold">Time to roll out the carpet</p>
    </Banner>
  )
}
