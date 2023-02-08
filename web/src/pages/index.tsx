import * as React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'

export default function Index() {
  const session = useSession()
  const router = useRouter()
  React.useEffect(() => {
    if (session.status === 'authenticated') {
      router.push('/patron')
    }
  }, [session.status, router])
  return <div>Sales Page</div>
}
