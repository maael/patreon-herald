import { NextApiHandler } from 'next'
import { unstable_getServerSession } from 'next-auth'
import { authOptions } from '~/pages/api/auth/[...nextauth]'
import { campaigns } from '~/api'

const internalApi: { [k: string]: NextApiHandler } = {
  /**
   * GET /internal/campaigns
   */
  getCampaigns: async (req, res) => {
    const ids = req.query.ids?.toString()
    const session = await unstable_getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(400).json({ error: 'Needs session' })
    }
    if (!ids) {
      const userCampaigns = await campaigns.getCampaignsForUser((session as any).uid)
      res.json({ campaigns: userCampaigns || [] })
    } else {
      const userCampaigns = await campaigns.getCampaignsWithIds(ids, (session as any).uid)
      res.json({ campaigns: userCampaigns || [] })
    }
  },
  /**
   * POST /internal/campaigns
   */
  createCampaign: async (req, res) => {
    const session = await unstable_getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(400).json({ error: 'Needs session' })
    }
    const internalCampaign = await campaigns.createForPatreonCampaign(
      (session as any).uid,
      req.body,
      (session as any).accessToken
    )
    res.json({ campaign: internalCampaign })
  },
  /**
   * POST /internal/campaign/:id/:patronId
   */
  addSoundToUser: async (req, res) => {
    const pathParts = req.query.path || []
    await campaigns.addSound(pathParts[1], pathParts[2], req.body, req.query.autoApprove === '1')
    res.json({ ok: 1 })
  },
  /**
   * DELETE /internal/campaign/:id/:patronId
   */
  removeUserSound: async (req, res) => {
    const pathParts = req.query.path || []
    await campaigns.removeSound(pathParts[1], pathParts[2])
    res.json({ ok: 1 })
  },
  /**
   * PATCH /internal/campaign/:id/:patronId/approve
   */
  approveUserSound: async (req, res) => {
    const pathParts = req.query.path || []
    await campaigns.approveSound(pathParts[1], pathParts[2])
    res.json({ ok: 1 })
  },
  /**
   * DELETE /internal/campaign/:id/:patronId/approve
   */
  rejectUserSound: async (req, res) => {
    const pathParts = req.query.path || []
    await campaigns.rejectSound(pathParts[1], pathParts[2])
    res.json({ ok: 1 })
  },
  /**
   * GET /internal/sounds/:patronId
   */
  getUserSounds: async (req, res) => {
    const pathParts = req.query.path || []
    await campaigns.getUserSounds(req.query.ids.toString().split(','), pathParts[1])
    res.json({ ok: 1 })
  },
  /**
   * GET /internal/alert/:campaignId
   */
  getCampaignForAlert: async (req, res) => {
    const pathParts = req.query.path || []
    const result = await campaigns.getCampaignForAlert(pathParts[1])
    res.json(result)
  },
  /**
   * PATCH /internal/campaigns/:campaignId
   */
  updateCampaign: async (req, res) => {
    const pathParts = req.query.path || []
    const result = await campaigns.updateCampaignSettings(pathParts[1], req.body)
    res.json(result)
  },
}

const handler: NextApiHandler = async (req, res) => {
  try {
    const pathParts = req.query.path || []
    const method = req.method
    if (pathParts[0] === 'campaigns' && method === 'GET') {
      await internalApi.getCampaigns(req, res)
    } else if (pathParts[0] === 'campaigns' && method === 'POST') {
      await internalApi.createCampaign(req, res)
    } else if (pathParts[0] === 'campaign' && pathParts.at(-1) === 'approve' && method === 'PATCH') {
      await internalApi.approveUserSound(req, res)
    } else if (pathParts[0] === 'campaign' && pathParts.at(-1) === 'approve' && method === 'DELETE') {
      await internalApi.rejectUserSound(req, res)
    } else if (pathParts[0] === 'campaign' && method === 'PATCH') {
      await internalApi.updateCampaign(req, res)
    } else if (pathParts[0] === 'campaign' && method === 'POST') {
      await internalApi.addSoundToUser(req, res)
    } else if (pathParts[0] === 'campaign' && method === 'DELETE') {
      await internalApi.removeUserSound(req, res)
    } else if (pathParts[0] === 'sounds' && method === 'GET') {
      await internalApi.getUserSounds(req, res)
    } else if (pathParts[0] === 'alert' && method === 'GET') {
      await internalApi.getCampaignForAlert(req, res)
    } else {
      res.json({ ok: 1, error: 'Missing endpoint', pathParts })
    }
  } catch (e) {
    console.error('error', e)
  }
}

export default handler
