import { useState } from 'react'
import { useQuery } from 'react-query'

export default function useTwitchAlertData(id?: string) {
  const [campaignTwitchTokens, setCampaignTwitchTokens] = useState({ accessToken: '', refreshToken: '' })
  const { data } = useQuery(['alerts', id], {
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    refetchOnMount: true,
    cacheTime: 30_000,
    enabled: !!id,
    queryFn: async () =>
      fetch(`/api/internal/alert/${id}`)
        .then((r) => r.json())
        .then((data) => {
          console.info('[fetch]', data)
          const criteriaCents = data?.campaign?.entitledCriteria?.amountCents
          setCampaignTwitchTokens({
            accessToken: data?.campaign?.twitchAccessToken,
            refreshToken: data?.campaign?.twitchRefreshToken,
          })
          return new Map<string, any>(
            data.connections
              .map((c) => {
                const sound = (data?.campaign?.sounds || {})[c.patreon.id] || {}
                if (!sound.isApproved) return
                const entitlement = (data?.campaign?.entitlements || {})[c.patreon.id] || {}
                if (
                  (entitlement.currentlyEntitledAmountsCents || 0) < criteriaCents &&
                  !c?.patreon?.id?.startsWith('custom-')
                )
                  return
                return [
                  c.twitch.id,
                  { ...c, ...sound, sound: `https://files.mael-cdn.com${sound.sound}`, volume: sound.volume || 1 },
                ]
              })
              .filter(Boolean)
          )
        }),
  })
  console.info('[loaded]', { count: data?.size, data })
  return { campaignTwitchTokens, data }
}
