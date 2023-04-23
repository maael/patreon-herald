import { NextApiHandler, NextApiRequest } from 'next'
import fetch from 'isomorphic-fetch'
import { campaigns, connection, patreon } from '~/api'

function getPath(pathParts) {
  if (pathParts[0] === 'campaigns') {
    return `/api/current_user/campaigns?include=rewards,creator`
  } else if (pathParts[0] === 'memberships') {
    return `/v2/identity?include=memberships,campaign,memberships.campaign,memberships.campaign.creator&${encodeURI(
      'fields[user]=full_name,thumb_url&fields[member]=currently_entitled_amount_cents,full_name,patron_status&fields[campaign]=creation_name,image_small_url,image_url,summary'
    )}`
  } else {
    return undefined
  }
}

function mapResult(pathParts, result) {
  if (pathParts[0] === 'memberships') {
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
    const pathParts = req.query.path || []
    if (pathParts[0] === 'members') {
      const campaignId = pathParts[1]
      const patreons = await patreon.getInitialMembers(
        `${(req.headers.authorization?.split(' ') || [])[1]}`,
        campaignId
      )

      const mappedEntitlements = patreons.reduce(
        (acc, p) => ({
          ...[acc],
          [`entitlements.${p.user.id}.currentlyEntitledAmountsCents`]: Math.max(...p.tiers.map((t) => t.amount_cents)),
          [`entitlements.${p.user.id}.currentlyEntitledTiers`]: p.tiers.map((t) => t.id),
          [`entitlements.${p.user.id}.lastUpdated`]: new Date().toISOString(),
        }),
        {}
      )

      try {
        await campaigns.upsertPatronCampaignEntitlements(campaignId, mappedEntitlements)
      } catch (e) {
        console.info('failed to update entitlements', e)
      }

      const patreonTwitchConnections = await connection.getTwitchConnectionsByPatreonIds(
        patreons.map((p) => p.user.id).filter(Boolean)
      )

      const embellished = patreons.map((p) => {
        return {
          ...p,
          user: {
            ...p.user,
            twitch: patreonTwitchConnections.get(p.user.id) || {},
          },
        }
      })

      res.json(embellished)
    } else {
      const patreonPath = getPath(pathParts)
      if (!patreonPath) throw new Error('No matching path')
      const result = mapResult(req.query.path || [], await patreonRequest(req, patreonPath))
      res.json(result)
    }
  } catch (e) {
    res.json({ error: e })
  }
}

export default handler
