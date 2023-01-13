import React, { Dispatch, SetStateAction } from 'react'
import { ChatItem } from '../../chat'
import { Settings as TSettings, ChannelInfo } from '../../utils'
import Settings from '../primitives/Settings'
import ChatBox, { ChatControls } from '../primitives/ChatBox'
import formatDuration from 'date-fns/formatDuration'

export default function MainScreen({
  chatEvents,
  settings,
  setSettings,
  channelInfo,
  chatPaused,
  setChatPaused,
  resetChat,
}: {
  chatEvents: ChatItem[]
  settings: TSettings
  setSettings: Dispatch<SetStateAction<TSettings>>
  channelInfo: ChannelInfo
  chatPaused: boolean
  setChatPaused: Dispatch<SetStateAction<Boolean>>
  resetChat: () => void
}) {
  const messageDelay = React.useMemo(() => {
    const mostRecent = chatEvents[chatEvents.length - 1]
    if (!mostRecent) return '0s delay'
    return `~${formatDuration({
      seconds: Number(((mostRecent.receivedTs - mostRecent.tmiTs) / 1000).toFixed(2)),
    }).replace(' seconds', 's')} delay`
  }, [chatEvents])
  return (
    <div className="flex flex-col flex-1" style={{ height: '100vh' }}>
      <Settings
        channelId={channelInfo.userId}
        settings={settings}
        setSettings={setSettings}
        setChatPaused={setChatPaused}
        resetChat={resetChat}
      />
      {settings.performanceMode ? (
        <div className="h-full flex-1 gap-2 flex flex-col justify-center items-center">
          <div className="flex justify-center items-center gap-2 flex-row">
            <div>{chatEvents.length} messages</div>
            <ChatControls chatEvents={chatEvents} paused={chatPaused} setPaused={setChatPaused} clear={resetChat} />
          </div>
          <div>{messageDelay}</div>
        </div>
      ) : (
        <ChatBox
          messageDelay={messageDelay}
          chatEvents={chatEvents}
          paused={chatPaused}
          setPaused={setChatPaused}
          clear={resetChat}
          settings={settings}
          setSettings={setSettings}
        />
      )}
    </div>
  )
}
