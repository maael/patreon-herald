import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
import dbConnect from '~/db/mongo'
import ConnectionModel, { Connection } from '~/db/connectionModel'
import CampaignModel, { Campaign } from '~/db/campaignModel'

const s3Client = new S3Client({
  region: process.env.S3_UPLOAD_REGION,
  credentials: { accessKeyId: `${process.env.S3_UPLOAD_KEY}`, secretAccessKey: `${process.env.S3_UPLOAD_SECRET}` },
})

export const connection = {
  /**
   * Gets or creates entry for patreon on sign in
   */
  createInitial: async (patreon: Connection['patreon']) => {
    await dbConnect()
    const existing = await ConnectionModel.findOne({ 'patreon.id': patreon.id })
    if (existing) return existing
    return ConnectionModel.create({ patreon })
  },
  /**
   * Associates twitch account to patreon account on twitch auth callback
   */
  createConnection: async (patreonId: string, twitch: Connection['twitch']) => {
    await dbConnect()
    return ConnectionModel.findOneAndUpdate({ 'patreon.id': patreonId }, { twitch }).lean()
  },
  /**
   * Gets associated twitch details for patreon account, if any
   * Used during jwt/session creation
   */
  getTwitchConnectionByPatreonId: async (patreonId: string) => {
    await dbConnect()
    const result = (await ConnectionModel.findOne({ 'patreon.id': patreonId }, { twitch: 1 }).lean()) as Connection
    return result?.twitch
  },
}

export const campaigns = {
  /**
   * Show creator their campaigns - optionally include sounds field, for use by tray app
   */
  getCampaignsForUser: async (id: string) => {
    await dbConnect()
    return CampaignModel.find({ ownerPatreonId: id })
  },
  /**
   * Used in patreon view to control what campaigns are active or not
   */
  getCampaignsWithIds: async (ids: string, patronId: string) => {
    await dbConnect()
    return CampaignModel.find(
      { patreonCampaignId: { $in: ids.split(',') } },
      { patreonCampaignId: 1, [`sounds.${patronId}`]: 1 }
    ).lean()
  },
  getCampaignForAlert: async (patreonCampaignId: string) => {
    await dbConnect()
    const campaign = await CampaignModel.findOne({ patreonCampaignId }, { patreonCampaignId: 1, sounds: 1 }).lean()
    const connections = await ConnectionModel.find(
      { 'patreon.id': { $in: Object.keys(campaign?.sounds || {}) } },
      { patreon: 1, twitch: 1 }
    ).lean()
    return { campaign, connections }
  },
  /**
   * When a creator enables for a campaign
   */
  createForPatreonCampaign: async (patreonId: string, patreonCampaignData: any, accessToken?: string) => {
    await dbConnect()
    const created = await CampaignModel.create({
      patreonCampaignId: patreonCampaignData.id,
      ownerPatreonId: patreonId,
      sounds: {},
      isActive: true,
    })
    try {
      if (accessToken) {
        const webhookSecrets = await patreon.makeWebhooks(accessToken, created._id.toString(), patreonCampaignData.id)
        await CampaignModel.updateOne({ _id: created._id }, { webhookSecrets })
      }
    } catch (e) {
      console.warn('[createInitial:webhook:error]', patreonId, e)
    }
    return created
  },
  /**
   * When a patreon uploads/adds their sound for approval
   */
  addSound: async (
    patreonCampaignId: string,
    patronId: string,
    sound: Campaign['sounds'][''],
    autoApprove?: boolean
  ) => {
    await dbConnect()
    try {
      const existing = await CampaignModel.findOne({ patreonCampaignId }, { [`sounds.${patronId}`]: 1 })
      if (existing && (existing.sounds as any).get(patronId)) {
        const existingSound = (existing.sounds as any).get(patronId)
        const result = await s3Client.send(
          new DeleteObjectCommand({ Bucket: process.env.S3_UPLOAD_BUCKET, Key: existingSound.sound.slice(1) })
        )
        console.info('[addSound:cleanup]', existingSound.sound, result)
      }
    } catch (e) {
      console.warn('[addSound:cleanup]', e)
    }
    return CampaignModel.updateOne(
      { patreonCampaignId },
      { $set: { [`sounds.${patronId}`]: { ...sound, isApproved: !!autoApprove, isRejected: false } } }
    )
  },
  /**
   * When patreon tells us a pledge is removed
   */
  removeSound: async (patreonCampaignId: string, patronId: string) => {
    await dbConnect()
    return CampaignModel.updateOne({ patreonCampaignId }, { $unset: { [`sounds.${patronId}`]: '' } })
  },
  /**
   * Creator approves a patreon sound
   */
  approveSound: async (patreonCampaignId: string, patronId: string) => {
    await dbConnect()
    return CampaignModel.updateOne(
      { patreonCampaignId },
      { $set: { [`sounds.${patronId}.isApproved`]: true, [`sounds.${patronId}.isRejected`]: false } }
    )
  },
  /**
   * Creator rejects a patreon sound
   */
  rejectSound: async (patreonCampaignId: string, patronId: string) => {
    await dbConnect()
    return CampaignModel.updateOne(
      { patreonCampaignId },
      { $set: { [`sounds.${patronId}.isApproved`]: false, [`sounds.${patronId}.isRejected`]: true } }
    )
  },
  /**
   * Get sound for campaign to show to patreon
   */
  getUserSounds: async (patreonCampaignIds: string[], patronId: string) => {
    await dbConnect()
    return CampaignModel.find({ patreonCampaignId: { $in: patreonCampaignIds } }, { [`sounds.${patronId}`]: 1 })
  },
}

export const patreon = {
  makeWebhooks: async (accessToken: string, createdCampaignId: string, campaignId: string) => {
    const data = await Promise.all([
      fetch('https://www.patreon.com/api/oauth2/v2/webhooks', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            type: 'webhook',
            attributes: {
              triggers: ['members:create', 'members:update'],
              uri: `https://patreon-herald.mael.tech/api/webhooks/patreon/${createdCampaignId}/upsert`,
            },
            relationships: {
              campaign: {
                data: { type: 'campaign', id: campaignId },
              },
            },
          },
        }),
      }).then((r) => r.json()),
      fetch('https://www.patreon.com/api/oauth2/v2/webhooks', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            type: 'webhook',
            attributes: {
              triggers: ['members:delete'],
              uri: `https://patreon-herald.mael.tech/api/webhooks/patreon/${createdCampaignId}/delete`,
            },
            relationships: {
              campaign: {
                data: { type: 'campaign', id: campaignId },
              },
            },
          },
        }),
      }).then((r) => r.json()),
    ])
    console.info('[create:webhooks]', data)
    const webhookSecrets = { upsert: data[0].data?.attributes.secret, delete: data[1].data?.attributes.secret }
    return webhookSecrets
  },
  getWebhooks: async (accessToken: string) => {
    return fetch('https://www.patreon.com/api/oauth2/v2/webhooks', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }).then((r) => r.json())
  },
  getInitialMembers: async (accessToken: string, campaignId: string) => {
    let cursor = null
    let data = []
    try {
      do {
        const page = await patreon.getMembersPage(accessToken, campaignId, cursor)
        console.info(accessToken, JSON.stringify(page, undefined, 2))
        const linkedUsers = new Map<string, any>(
          page.included.filter((r) => r.type === 'user').map((r) => [r.id, { ...r.attributes, id: r.id }])
        )
        const linkedTiers = new Map<string, any>(
          page.included.filter((r) => r.type === 'tier').map((r) => [r.id, { ...r.attributes, id: r.id }])
        )
        data = data.concat(
          page.data.map((d) => {
            return {
              tiers: d.relationships.currently_entitled_tiers.data
                .map((d) => ({ ...(linkedTiers.get(d.id) || {}), id: d.id }))
                .filter(Boolean),
              user: { ...(linkedUsers.get(d.relationships.user.data.id) || {}), id: d.relationships.user.data.id },
            }
          })
        )
        cursor = page?.meta?.pagination?.cursors?.next
      } while (cursor !== null)
      return data
    } catch (e) {
      console.error(e)
      return []
    }
  },
  getMembersPage: async (accessToken: string, campaignId: string, cursor: string | null) => {
    return fetch(
      `https://www.patreon.com/api/oauth2/v2/campaigns/${campaignId}/members?${encodeURI(
        `include=currently_entitled_tiers,user&fields[user]=full_name,thumb_url&fields[tier]=title,amount_cents&page[count]=500${
          cursor ? '&page[cursor]=${cursor}' : ''
        }`
      )}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    ).then((r) => r.json())
  },
}
