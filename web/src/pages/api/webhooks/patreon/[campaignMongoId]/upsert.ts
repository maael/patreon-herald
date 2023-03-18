import { NextApiHandler } from 'next'

const handler: NextApiHandler = async (req, res) => {
  console.info('[webhook:upsert]', req.query.campaignMongoId, JSON.stringify(req.body.data, undefined, 2))
  /**
   * TODO: Update the campaign up removing/disabling this user
   */
  res.json({ ok: 1 })
}

export default handler
