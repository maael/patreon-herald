import { NextApiHandler } from 'next'

const handler: NextApiHandler = async (req, res) => {
  console.info('[webhook:delete]', req.query.campaignMongoId, req.body)
  /**
   * TODO: Update the campaign up removing/disabling this user
   */
  res.json({ ok: 1 })
}

export default handler
