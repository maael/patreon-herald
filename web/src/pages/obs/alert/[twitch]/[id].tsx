import { useRouter } from 'next/router'
import useTwitchToken from '~/components/hooks/useTwitchToken'
import useTwitchAlertData from '~/components/hooks/useTwitchAlertData'
import useTwitchAlert, { makeAudio } from '~/components/hooks/useTwitchAlert'

export default function Alert() {
  const {
    query: { id, twitch },
  } = useRouter()
  console.info('[mount]', { id, twitch })
  const { campaignTwitchTokens, data } = useTwitchAlertData(id?.toString())
  const token = useTwitchToken(id?.toString(), campaignTwitchTokens)
  const { audio, setAudio, ref, remove } = useTwitchAlert(twitch?.toString(), token, data)

  return (
    <>
      <style global jsx>{`
        html,
        body,
        body > div {
          background: transparent !important;
          opacity: 0;
        }
      `}</style>
      <audio
        controls
        crossOrigin="anonymous"
        ref={(elem) => {
          if (elem) {
            ref.current = elem
            if (!audio) setAudio(makeAudio(elem))
          }
        }}
        className="invisible"
        onEnded={() => {
          console.info('[audio:end]')
          remove()
        }}
      >
        <source />
      </audio>
    </>
  )
}
