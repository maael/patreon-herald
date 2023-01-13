import React from 'react'
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import * as Sentry from '@sentry/react'
import chat, { ChatItem, useChatEvents } from './chat'
import useStorage from './components/hooks/useStorage'
import MainScreen from './components/screens/Main'
import SetupScreen from './components/screens/Setup'
import SettingsScreen from './components/screens/Settings'
import Header from './components/primitives/Header'
import { ChannelInfo, defaultSettings, Settings, useAuthEvents } from './utils'
import { useUpdateCheck } from './utils/updates'

export default function App() {
  return (
    <Router initialEntries={['/setup']}>
      <InnerApp />
    </Router>
  )
}

function InnerApp() {
  useUpdateCheck()
  const [settings, setSettings] = useStorage<Settings>('settings', defaultSettings)
  const [client, setClient] = React.useState<ReturnType<typeof chat> | null>(null)
  const [channelInfo, setChannelInfo] = useStorage<ChannelInfo>('channelInfo', {}, (c) => {
    console.info('[client][app]', c)
    if (!c.login) return null
    console.info('[client][app][startClient]')
    if (settings.autoConnect) setClient((cl) => (cl ? cl : chat(c)))
  })
  const updateClientInfo = React.useCallback(
    (d) => {
      console.info('[auth][client][update]', d)
      setChannelInfo(d)
      if (client?.readyState() === 'OPEN') {
        try {
          client.disconnect()
        } catch (e) {
          console.warn('[app-disconnect]', e)
        }
      }
      client?.removeAllListeners()
      setClient(chat(d))
    },
    [client]
  )
  useAuthEvents(updateClientInfo)
  React.useEffect(() => {
    Sentry.setUser({ username: channelInfo.login })
    if (channelInfo.login) {
      if (settings.autoConnect) setClient((cl) => (cl ? cl : chat(channelInfo)))
    }
  }, [channelInfo.login])
  const onNewChat = React.useCallback((chat: ChatItem) => {
    console.info('[chat]', chat)
  }, [])
  const [chatPaused, setChatPaused] = React.useState(false)
  const [chatEvents, resetChat] = useChatEvents(chatPaused, onNewChat)
  React.useEffect(() => {
    window['myApp'].setTitle(channelInfo.login, !!client)
  }, [channelInfo.login, client])
  return (
    <>
      <Header client={client} resetChat={resetChat} setClient={setClient} channelInfo={channelInfo} />
      <Switch>
        <Route path="/" exact>
          <MainScreen
            chatEvents={chatEvents}
            settings={settings}
            setSettings={setSettings}
            channelInfo={channelInfo}
            chatPaused={chatPaused}
            setChatPaused={setChatPaused}
            resetChat={resetChat}
          />
        </Route>
        <Route path="/setup" exact>
          <SetupScreen resetChat={resetChat} setClient={setClient} channel={channelInfo} setChannel={setChannelInfo} />
        </Route>
        <Route path="/settings" exact>
          <SettingsScreen settings={settings} setSettings={setSettings} />
        </Route>
      </Switch>
      <Toaster />
    </>
  )
}
