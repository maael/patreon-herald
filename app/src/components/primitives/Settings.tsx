import React, { Dispatch, SetStateAction } from 'react'
// import { Howl } from 'howler'
import { Settings } from '../../utils'

// const bell = new Howl({
//   src: ['sounds/pleasing-bell.ogg'],
// })

interface Props {
  settings: Settings
  setSettings: Dispatch<SetStateAction<Settings>>
  setChatPaused: Dispatch<SetStateAction<Boolean>>
  resetChat: () => void
  channelId?: string
}

export default function SettingsComponent(_: Props) {
  return (
    <>
      <div>Settings...</div>
    </>
  )
}
