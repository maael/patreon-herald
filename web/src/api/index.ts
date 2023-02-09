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
  createForPatreonCampaign: async (patreonId: string, patreonCampaignData: any) => {
    await dbConnect()
    return CampaignModel.create({
      patreonCampaignId: patreonCampaignData.id,
      ownerPatreonId: patreonId,
      sounds: {},
      isActive: true,
    })
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
