import { NextApiHandler } from 'next'
import { campaigns } from '~/api'
import { Body } from '~/types'

const handler: NextApiHandler = async (req, res) => {
  const body: Body = req.body
  const campaignId = req.query.campaignMongoId?.toString() || ''
  const patronId = body.data.relationships.user.data.id
  console.info('[webhook:delete]', campaignId, patronId)
  await campaigns.removePatronCampaignEntitlement(campaignId, patronId)
  res.json({ ok: 1 })
}

export default handler
