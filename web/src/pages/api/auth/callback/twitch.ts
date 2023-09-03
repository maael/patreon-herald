import { unstable_getServerSession } from 'next-auth'
import fetch from 'isomorphic-fetch'
import { authOptions } from '../[...nextauth]'
import { campaigns, connection } from '~/api'

export default async function (req, res) {
  const session = await unstable_getServerSession(req, res, authOptions)
  const { code } = req.query
  const result = await getAccessToken(code)
  const token = result.access_token
  const info = await getInfo(token)
  const twitchUser = (info?.data || [])[0]
  await Promise.all([
    connection.createConnection((session as any)?.uid, {
      id: twitchUser?.id,
      username: twitchUser?.login,
      image: twitchUser?.profile_image_url,
      displayName: twitchUser?.display_name,
    }),
    campaigns.updateCampaignTwitchTokens((session as any)?.uid, result.access_token, result.refresh_token),
  ])
  res.redirect(307, '/')
}

async function getAccessToken(code: string) {
  return fetch(`https://id.twitch.tv/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      client_id: process.env.TWITCH_ID || '',
      client_secret: process.env.TWITCH_SECRET || '',
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/twitch`,
    }),
  }).then((r) => r.json())
}

async function getInfo(accessToken: string) {
  return fetch(`https://api.twitch.tv/helix/users`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Client-Id': process.env.TWITCH_ID || '',
    },
  }).then((r) => r.json())
}
