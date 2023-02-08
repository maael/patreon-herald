import { NextApiHandler } from 'next'
import { unstable_getServerSession } from 'next-auth'
import { authOptions } from '~/pages/api/auth/[...nextauth]'
import { campaigns } from '~/api'

const handler: NextApiHandler = async (req, res) => {
  const pathParts = req.query.path || []
  const method = req.method
  if (pathParts[0] === 'campaigns' && method === 'GET') {
    const ids = req.query.ids?.toString()
    if (!ids) {
      const session = await unstable_getServerSession(req, res, authOptions)
      if (!session) {
        return res.status(400).json({ error: 'Needs session' })
      }
      const userCampaigns = await campaigns.getCampaignsForUser((session as any).uid)
      res.json({ campaigns: userCampaigns || [] })
    } else {
      const userCampaigns = await campaigns.getCampaignsWithIds(ids)
      res.json({ campaigns: userCampaigns || [] })
    }
  } else if (pathParts[0] === 'campaigns' && method === 'POST') {
    const session = await unstable_getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(400).json({ error: 'Needs session' })
    }
    const internalCampaign = await campaigns.createForPatreonCampaign((session as any).uid, req.body)
    res.json({ campaign: internalCampaign })
  } else {
    res.json({ ok: 1 })
  }
}

export default handler
