import { unstable_getServerSession } from 'next-auth'
import fetch from 'isomorphic-fetch'
import { authOptions } from '../[...nextauth]'

export default async function (req, res) {
  const session = await unstable_getServerSession(req, res, authOptions)
  const { code } = req.query
  const result = await getAccessToken(code)
  const token = result.access_token
  const info = await getInfo(token)
  const twitchUser = (info?.data || [])[0]
  /**
   * TODO: Now we have the two "users", we can make a record tying them together
   * Then in lookup/token/session creation, we can put them into it to make it available in the frontend
   * We can also store the sound against the connection too, of: {campaignId, patreonId, twitchId, soundUrl}
   * and the tray app just has to download that list
   *
   * Will use Patreon webhook API to register a webhook on members:pledge:create/members:pledge:delete
   *
   * Will also need to select the tiers to be eligible for adding sounds at
   */
  res.json({
    ok: 1,
    patreon: { id: (session as any)?.uid, login: session?.user?.name, image: session?.user?.image },
    twitch: {
      id: twitchUser?.id,
      login: twitchUser?.login,
      image: twitchUser?.profile_image_url,
      displayName: twitchUser?.display_name,
    },
  })
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
      redirect_uri: 'http://localhost:3000/api/auth/callback/twitch',
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
