import dbConnect from '~/db/mongo'
import ConnectionModel, { Connection } from '~/db/connectionModel'
import CampaignModel from '~/db/campaignModel'

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
  getCampaignsWithIds: async (ids: string) => {
    await dbConnect()
    return CampaignModel.find({ patreonCampaignId: { $in: ids.split(',') } }, { patreonCampaignId: 1 }).lean()
  },
  /**
   * When a creator enables for a campaign
   */
  createForPatreonCampaign: async (patreonId: string, patreonCampaignData: any) => {
    console.info({ patreonId, patreonCampaignData })
    await dbConnect()
    return CampaignModel.create({
      patreonCampaignId: patreonCampaignData.id,
      ownerPatreonId: patreonId,
      sounds: [],
      isActive: true,
    })
  },
  /**
   * When a patreon uploads/adds their sound for approval
   */
  addSound: async (patreonCampaignId: string, patreonId: string, soundUrl: string) => {
    return CampaignModel.updateOne({ patreonCampaignId }, { sounds: {} })
  },
  /**
   * When patreon tells us a pledge is removed
   */
  removeSound: async (patreonCampaignId: string, patronId: string) => {
    return CampaignModel.updateOne({ patreonCampaignId }, { sounds: {} })
  },
  /**
   * Creator approves a patreon sound
   */
  approveSound: async (patreonCampaignId: string, patreonId: string) => {
    return CampaignModel.updateOne({ patreonCampaignId }, { sounds: {} })
  },
  /**
   * Creator rejects a patreon sound
   */
  rejectSound: async (patreonCampaignId: string, patreonId: string) => {
    return CampaignModel.updateOne({ patreonCampaignId }, { sounds: {} })
  },
  /**
   * Get sound for campaign to show to patreon
   */
  getSoundForCampaign: async (patreonCampaignId: string, patreonId: string) => {
    return CampaignModel.findOne({ patreonCampaignId }, { sounds: {} })
  },
}
