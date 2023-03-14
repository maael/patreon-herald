import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'

export default function useRestrictedRoute() {
  const { status } = useSession()
  const { push } = useRouter()
  useEffect(() => {
    if (status === 'unauthenticated') {
      push('/')
    }
  }, [status, push])
}
