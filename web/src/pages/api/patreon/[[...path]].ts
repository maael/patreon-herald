import { NextApiHandler } from 'next'
import fetch from 'isomorphic-fetch'

function getPath(pathParts) {
  if (pathParts[0] === 'campaigns') {
    return `https://www.patreon.com/api/oauth2/v2/campaigns?${encodeURIComponent(
      'fields[campaign]'
    )}=summary&${encodeURIComponent('fields[tier]')}=title`
  }
  if (pathParts[0] === 'members') {
    return `https://www.patreon.com/api/oauth2/v2/campaigns/${pathParts[1]}/members?include=currently_entitled_tiers`
  } else {
    return undefined
  }
}

const handler: NextApiHandler = async (req, res) => {
  try {
    const patreonPath = getPath(req.query.path || [])
    if (!patreonPath) throw new Error('No matching path')
    const result = await fetch(patreonPath, {
      headers: { Authorization: req.headers.authorization },
    }).then((r) => r.json())
    console.info({ result })
    res.json(result)
  } catch (e) {
    res.json({ error: e })
  }
}

export default handler
