import React from 'react'
import ReactDom from 'react-dom'
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import App from './App'

Sentry.init({
  dsn: 'https://e1ab42f992464540aa50ecac933a0c0e@o304997.ingest.sentry.io/4504498168135680',
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0,
  beforeSend(event) {
    if (event.message?.includes('Unable to connect.')) return null
    if (
      event.message?.includes('Cannot disconnect from server. Socket is not opened or connection is already closing.')
    ) {
      return null
    }
    return event
  },
})

Sentry.setTag('version', NL_APPVERSION)

window['myApp'] = {
  onWindowClose: async () => {
    Neutralino.app.exit()
  },
  setTitle: (channel: string, isActive: boolean) => {
    Neutralino.window.setTitle(['Patreon Herald', channel, isActive ? '[Connected]' : ''].filter(Boolean).join(' - '))
  },
}

// Initialize native API communication. This is non-blocking
// use 'ready' event to run code on app load.
// Avoid calling API functions before init or after init.
Neutralino.init()

Neutralino.events.on('windowClose', window['myApp'].onWindowClose)

Neutralino.events.on('ready', async () => {
  try {
    const channelInfo = JSON.parse(await Neutralino.storage.getData(`main-settings`))
    Sentry.setUser({ username: channelInfo?.login })
  } catch (e) {
    Sentry.captureException(e)
  } finally {
    ReactDom.render(<App />, document.querySelector('#app'))
  }
})
