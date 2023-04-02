import { NextApiHandler } from 'next'
import { campaigns } from '~/api'
import { Body, IncludedTier } from '~/types'

const handler: NextApiHandler = async (req, res) => {
  const body: Body = req.body
  const campaignId = req.query.campaignMongoId.toString()
  const patronId = body.data.relationships.user.data.id
  const currentlyEntitledTiers = body.data.relationships.currently_entitled_tiers.data.map((d) => d.id)
  const includedTiers = body.included.reduce((acc, t) => {
    if (t.type === 'tier') {
      acc.set(t.id, t)
    }
    return acc
  }, new Map<string, IncludedTier>())
  const tiersInfo = currentlyEntitledTiers.map((t) => includedTiers.get(t)).filter(Boolean)
  const currentlyEntitledAmountsCents = Math.max(...tiersInfo.map((t) => t?.attributes.amount_cents || 0))
  const entitlementInfo = {
    currentlyEntitledAmountsCents,
    currentlyEntitledTiers,
    lifetimeSupportCents: 0,
  }
  console.info('[webhook:upsert]', campaignId, patronId, entitlementInfo)
  await campaigns.upsertPatronCampaignEntitlement(campaignId, patronId, entitlementInfo)
  res.json({ ok: 1 })
}

export default handler
