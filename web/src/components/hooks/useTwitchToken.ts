import { useEffect, useState } from 'react'

export default function useTwitchToken(twitchId?: string, tokens?: { accessToken?: string; refreshToken?: string }) {
  const tokenFromUrl = tokens?.accessToken
  const refreshTokenFromUrl = tokens?.refreshToken
  const [token, setToken] = useState<string>()

  useEffect(() => {
    if (tokenFromUrl && refreshTokenFromUrl) {
      // eslint-disable-next-line @typescript-eslint/no-extra-semi
      ;(async () => {
        const validation = await fetch('https://id.twitch.tv/oauth2/validate', {
          headers: {
            Authorization: `OAuth ${tokenFromUrl}`,
          },
        })
        if (validation.status === 200) {
          console.info('[token:validated]')
          setToken(tokenFromUrl)
        } else {
          console.info('[token:refresh]', refreshTokenFromUrl)
          const newTokenResult = await fetch(`/api/twitch/refresh`, {
            headers: {
              'X-twitch-refresh-token': refreshTokenFromUrl!,
            },
          })
          if (newTokenResult.ok) {
            const data = await newTokenResult.json()
            setToken(data.token)
          } else {
            console.error('[token:error]', 'Failed to refresh')
          }
        }
      })()
    }
  }, [tokenFromUrl, refreshTokenFromUrl, twitchId])
  return token
}
