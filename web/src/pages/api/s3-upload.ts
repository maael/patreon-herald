import { APIRoute } from 'next-s3-upload'
import path from 'node:path'
import { v4 as uuid } from 'uuid'

export default APIRoute.configure({
  key(req, filename) {
    return `patreon-herald/${req.body.campaignId}/${req.body.patronId}--${uuid()}${path.parse(filename).ext}`
  },
})
