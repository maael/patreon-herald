import { NextApiHandler } from 'next'
import { patreon } from '~/api'

const handler: NextApiHandler = async (req, res) => {
  const { accessToken, type } = req.query
  if (!accessToken) return res.status(400).json({ error: 'Needs access token' })
  if (!type) return res.status(400).json({ error: 'Define type' })
  if (type === 'post') {
    const data = await patreon.makeWebhooks(req.query.accessToken.toString(), '63e52b8e8a76b230774bab57', '9441253')
    res.json({ type, data })
  } else if (type === 'patch') {
    const fetchRes = await fetch('https://www.patreon.com/api/oauth2/v2/webhooks/526532', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          id: '526532',
          type: 'webhook',
          attributes: {
            triggers: ['members:delete', 'posts:publish', 'posts:update'],
            uri: 'https://patreon-herald.mael.tech/api/webhooks/patreon/63e52b8e8a76b230774bab57',
            paused: 'false', // <- do this if you’re attempting to send missed events, see NOTE in Example Webhook Payload
          },
        },
      }),
    })
    const data = await fetchRes.json()
    res.json({ type, data })
  } else if (type === 'members') {
    res.json({
      type,
      data: await patreon.getInitialMembers(req.query.accessToken.toString(), req.query.campaignId.toString()),
    })
  } else {
    const data = await patreon.getWebhooks(req.query.accessToken.toString())
    res.json({ type: 'get', data })
  }
}

export default handler
