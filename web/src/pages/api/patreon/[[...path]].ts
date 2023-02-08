import { NextApiHandler, NextApiRequest } from 'next'
import fetch from 'isomorphic-fetch'

function getPath(pathParts) {
  if (pathParts[0] === 'campaigns') {
    return `/api/current_user/campaigns?include=rewards,creator`
  } else if (pathParts[0] === 'members') {
    return `/v2/campaigns/${pathParts[1]}/members?include=currently_entitled_tiers,user&${encodeURI(
      'fields[user]=full_name,thumb_url&fields[tier]=title,amount_cents'
    )}`
  } else if (pathParts[0] === 'memberships') {
    return `/v2/identity?include=memberships,campaign,memberships.campaign,memberships.campaign.creator&${encodeURI(
      'fields[user]=full_name,thumb_url&fields[member]=currently_entitled_amount_cents,full_name,patron_status&fields[campaign]=creation_name,image_small_url,image_url,summary'
    )}`
  } else {
    return undefined
  }
}

function mapResult(pathParts, result) {
  if (pathParts[0] === 'members') {
    const linkedUsers = new Map<string, any>(
      result.included.filter((r) => r.type === 'user').map((r) => [r.id, { ...r.attributes, id: r.id }])
    )
    const linkedTiers = new Map<string, any>(
      result.included.filter((r) => r.type === 'tier').map((r) => [r.id, { ...r.attributes, id: r.id }])
    )
    return result.data.map((d) => {
      return {
        tiers: d.relationships.currently_entitled_tiers.data
          .map((d) => ({ ...(linkedTiers.get(d.id) || {}), id: d.id }))
          .filter(Boolean),
        user: { ...(linkedUsers.get(d.relationships.user.data.id) || {}), id: d.relationships.user.data.id },
      }
    })
  } else if (pathParts[0] === 'memberships') {
    const linkedUsers = new Map<string, any>(
      result.included.filter((r) => r.type === 'user').map((r) => [r.id, { ...r.attributes, id: r.id }])
    )
    const linkedCampaigns = new Map<string, any>(
      result.included
        .filter((r) => r.type === 'campaign')
        .map((r) => [r.id, { ...r.attributes, creator: linkedUsers.get(r.relationships.creator.data.id), id: r.id }])
    )
    const linkedMembers = new Map<string, any>(
      result.included
        .filter((r) => r.type === 'member')
        .map((r) => [
          r.id,
          { ...r.attributes, campaign: linkedCampaigns.get(r.relationships.campaign.data.id), id: r.id },
        ])
    )

    return {
      user: {
        ...result.data.attributes,
        id: result.data.id,
      },
      memberships: result.data.relationships.memberships.data.map((m) => {
        return {
          ...(linkedMembers.get(m.id) || {}),
        }
      }),
    }
  }
  return result
}

async function patreonRequest(req: NextApiRequest, path: string) {
  return fetch(`https://www.patreon.com/api/oauth2${path}`, {
    headers: { Authorization: req.headers.authorization },
  }).then((r) => r.json())
}

const handler: NextApiHandler = async (req, res) => {
  try {
    const patreonPath = getPath(req.query.path || [])
    if (!patreonPath) throw new Error('No matching path')
    const result = mapResult(req.query.path || [], await patreonRequest(req, patreonPath))
    res.json(result)
  } catch (e) {
    res.json({ error: e })
  }
}

export default handler
