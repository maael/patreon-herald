import { NextApiHandler } from 'next'

const handler: NextApiHandler = async (req, res) => {
  const { accessToken, type } = req.query
  if (!accessToken) return res.status(400).json({ error: 'Needs access token' })
  if (!type) return res.status(400).json({ error: 'Define type' })
  if (type === 'post') {
    const fetchRes = await fetch('https://www.patreon.com/api/oauth2/v2/webhooks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          type: 'webhook',
          attributes: {
            triggers: ['members:delete', 'posts:publish', 'posts:update'],
            uri: `https://patreon-herald.mael.tech/api/webhooks/patreon/63e52b8e8a76b230774bab57`,
          },
          relationships: {
            campaign: {
              data: { type: 'campaign', id: '9441253' },
            },
          },
        },
      }),
    })
    const data = await fetchRes.json()
    res.json({ type, data })
  } else {
    const fetchRes = await fetch('https://www.patreon.com/api/oauth2/v2/webhooks', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await fetchRes.json()
    res.json({ type: 'get', data })
  }
  res.json({ missed: type })
}

export default handler
