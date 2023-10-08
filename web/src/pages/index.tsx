import * as React from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Banner from '~/components/primitives/Banner'
import classNames from 'classnames'
import { GiTrumpetFlag } from 'react-icons/gi'

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
      <Banner>
        <h1 className="text-6xl font-bold font-badscript drop-shadow-lg">Patreon Herald</h1>
        <p className="text-2xl font-bold drop-shadow-lg">Time to roll out the carpet</p>
      </Banner>
      <div className="max-w-4xl w-full mx-auto text-center flex-1 px-5 pt-12 pb-20 gap-10 flex flex-col">
        <div className="flex flex-col md:flex-row-reverse gap-6">
          <div className="flex-1">
            <div className="block">
              <ChatBlock />
            </div>
          </div>
          <div className="md:flex-2 flex gap-3 flex-col justify-center items-center">
            <h5 className="text-4xl mb-1">🎺 Highlight your supporters!</h5>
            <p className="text-lg">
              The first time they chat in the stream, play a sound of their choosing to let them stand out, and to let
              you know they're there.
            </p>
            <p className="text-lg">Say hi, and recognise their support!</p>
          </div>
        </div>
        <div className="flex-1 px-2 md:px-10 flex gap-4 flex-col items-center">
          <h5 className="text-4xl mb-1">Take out the manual steps and tools</h5>
          <ol className="list-decimal text-left text-xl gap-2 flex flex-col">
            <li>Log in with your Patreon, set up your campaign settings, with what tiers to allow sounds for</li>
            <li>Put a link to Patreon Herald in their welcome message</li>
            <li>Wait for them to submit their sounds, and you get to approve or reject them, or add your own!</li>
          </ol>
          <h5 className="text-2xl">✅ / ❌</h5>
        </div>
        <div className="flex flex-col items-center">
          <CtaButton />
        </div>
        <div className="flex-1 md:px-10 flex gap-2 flex-col items-center text-lg">
          <h5 className="text-4xl mb-1">Other features</h5>
          <div>Automatically removes users who are no longer supporters</div>
          <div>Generates an url ready for easy use as an overlay for the sounds</div>
          <div>Keeps the sounds no matter where you stream</div>
        </div>
      </div>
      <div className="text-center text-xs">
        Made by <a href="https://mael.tech">Matt Elphick</a>
      </div>
    </>
  )
}

function ChatBlock() {
  return (
    <div className="max-w-xl mx-auto flex flex-col gap-2 bg-orange-100 px-10 py-4 rounded-md drop-shadow-md">
      <ChatItem avatar={'🚀'} length={10} />
      <ChatItem avatar={'👾'} length={35} />
      <ChatItem avatar={'🐸'} highlighted>
        Hey there!
      </ChatItem>
      <ChatItem avatar={'🤖'} length={3} />
    </div>
  )
}

function ChatItem({
  length,
  avatar,
  children,
  highlighted,
}: {
  highlighted?: boolean
  avatar: string
  length?: number
  children?: string
}) {
  return (
    <div className={classNames('flex place-content-end gap-2 items-center', { 'opacity-60': !highlighted })}>
      <div className="bg-orange-300 w-10 aspect-square rounded-full border-2 border-black drop-shadow-md text-center flex justify-center items-center">
        {avatar}
      </div>
      <div className="rounded-md bg-orange-400 drop-shadow-md px-3 py-1 tracking-widest inline-block">
        {children || Array.from({ length: length || 4 }, () => '.').join('')}
      </div>
    </div>
  )
}

function CtaButton() {
  return (
    <button onClick={() => signIn('patreon')} className="font-badscript text-3xl py-5">
      <GiTrumpetFlag className="text-orange-500 mr-2 transform -scale-x-100" /> Get started now{' '}
      <GiTrumpetFlag className="text-orange-500 ml-2" />
    </button>
  )
}
