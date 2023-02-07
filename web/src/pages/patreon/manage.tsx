import { signIn } from 'next-auth/react'

export default function PatronManage() {
  return (
    <div>
      Patron Manage<button onClick={() => signIn('twitch')}>Twitch Login</button>
    </div>
  )
}
