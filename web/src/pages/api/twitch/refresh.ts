import fetch from 'isomorphic-fetch'
import { campaigns } from '~/api'

export default async function (req, res) {
  const currentRefreshToken = req.headers['x-twitch-refresh-token'] || req.query.token?.toString()
  const result = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(currentRefreshToken)}&client_id=${
      process.env.TWITCH_ID
    }&client_secret=${process.env.TWITCH_SECRET}`,
  })
  const data = await result.json()
  if (result.status === 200) {
    // update and return
    await campaigns.updateTokens(currentRefreshToken, data.access_token, data.refresh_token)
    console.info('[refresh]', 'Refreshed')
    res.json({ ok: 1, token: data.access_token })
  } else {
    console.info('[refresh:error]', 'Failed to refresh', data, result.status)
    res.status(500).json({ error: 'Failed to get refresh token' })
  }
}
