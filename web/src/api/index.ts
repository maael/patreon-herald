import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
import dbConnect from '~/db/mongo'
import ConnectionModel, { Connection } from '~/db/connectionModel'
import CampaignModel, { Campaign } from '~/db/campaignModel'
import { EmailType, sendEmail } from './email'

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
    const result = await ConnectionModel.findOneAndUpdate({ 'patreon.id': patreon?.id }, { patreon }, { upsert: true })
    return result
  },
  /**
   * Associates twitch account to patreon account on twitch auth callback
   */
  createConnection: async (patreonId: string, twitch: Connection['twitch']) => {
    await dbConnect()
    return ConnectionModel.findOneAndUpdate({ 'patreon.id': patreonId }, { twitch }, { upsert: true }).lean()
  },
  /**
   * Disassociates twitch account to patreon account
   */
  deleteConnection: async (patreonId: string) => {
    await dbConnect()
    return ConnectionModel.findOneAndUpdate({ 'patreon.id': patreonId }, { $unset: { twitch: 1 } }, {}).lean()
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
  /**
   * Gets associated twitch details for patreon accounts
   * Used during patreon members call
   */
  getTwitchConnectionsByPatreonIds: async (patreonIds: string[]) => {
    await dbConnect()
    const result = (await ConnectionModel.find(
      { 'patreon.id': patreonIds },
      { 'patreon.id': 1, twitch: 1 }
    ).lean()) as Connection[]
    return new Map(result.map((r) => [r.patreon?.id, r.twitch]))
  },
  /**
   * Used to clean up after removing custom users
   */
  deleteCustomUser: async (customId: string) => {
    if (!customId.startsWith('custom-')) return
    await dbConnect()
    return ConnectionModel.deleteOne({ 'patreon.id': customId })
  },
}

export const campaigns = {
  /**
   * Update tokens
   */
  updateTokens: async (oldRefreshToken: string, newAuthToken: string, newRefreshToken: string) => {
    const update: Partial<Campaign> = {}
    if (newAuthToken) update.twitchAccessToken = newAuthToken
    if (newRefreshToken) update.twitchRefreshToken = newRefreshToken
    await CampaignModel.updateOne({ twitchRefreshToken: oldRefreshToken }, update)
  },
  /**
   * Get campaign patreon webhook IDs for refreshing
   */
  getCampaignWebhooksById: async (id: string) => {
    await dbConnect()
    const result = await CampaignModel.findOne({ _id: id }, { _id: 1, patreonCampaignId: 1, webhooks: 1 }).lean()
    return result
  },
  /**
   * Show creator their campaigns - optionally include sounds field, for use by tray app
   */
  getCampaignsForUser: async (id: string) => {
    await dbConnect()
    const result = await CampaignModel.find({ ownerPatreonId: id }).lean()
    if (result[0] && result[0].customUsers) {
      const connections = await connection.getTwitchConnectionsByPatreonIds(result[0].customUsers)
      result[0].customUsers = result[0].customUsers.map((u) => ({
        user: {
          id: u,
          twitch: connections.get(u),
        },
      })) as any
    }
    return result
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
    const campaign = await CampaignModel.findOne(
      { patreonCampaignId },
      {
        patreonCampaignId: 1,
        sounds: 1,
        entitledCriteria: 1,
        entitlements: 1,
        twitchAccessToken: 1,
        twitchRefreshToken: 1,
      }
    ).lean()
    const connections = await ConnectionModel.find(
      { 'patreon.id': { $in: Object.keys(campaign?.sounds || {}) } },
      { patreon: 1, twitch: 1 }
    ).lean()
    return { campaign, connections }
  },
  /**
   * Associate twitch tokens with campaigns
   */
  updateCampaignTwitchTokens: async (patreonId: string, twitchAccessToken: string, twitchRefreshToken: string) => {
    await dbConnect()
    await CampaignModel.updateMany(
      { ownerPatreonId: patreonId },
      {
        twitchAccessToken,
        twitchRefreshToken,
      }
    )
  },
  /**
   * Associate twitch tokens with campaigns
   */
  updateCampaignPatreonTokens: async (
    resourceType: 'patreonCampaign' | 'owner',
    resourceId: string,
    patreonAccessToken?: string,
    patreonRefreshToken?: string
  ) => {
    try {
      if (!resourceId || !patreonAccessToken || !patreonRefreshToken) {
        console.warn('Failed to update patreon tokens')
        return
      }
      await dbConnect()
      const query =
        resourceType === 'owner'
          ? {
              ownerPatreonId: resourceId,
            }
          : {
              patreonCampaignId: resourceId,
            }
      await CampaignModel.updateMany(query, {
        patreonAccessToken,
        patreonRefreshToken,
      })
    } catch (e) {
      console.warn('Failed to update patreon tokens', e)
    }
  },
  getPatreonTokens: async (patreonCampaignId: string) => {
    return CampaignModel.findOne(
      { patreonCampaignId },
      {
        patreonAccessToken: 1,
        patreonRefreshToken: 1,
      }
    ).lean()
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
        await patreon.makeWebhooks(accessToken, created._id.toString(), patreonCampaignData.id)
      }
    } catch (e) {
      console.warn('[createInitial:webhook:error]', patreonId, e)
    }
    return created
  },
  /**
   * Update campaign settings
   */
  updateCampaignSettings: async (campaignId: string, settings: Pick<Campaign, 'entitledCriteria'>) => {
    return CampaignModel.updateOne({ _id: campaignId }, { entitledCriteria: settings.entitledCriteria })
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
    let existing: any
    try {
      existing = await CampaignModel.findOne({ patreonCampaignId }, { ownerPatreonId: 1, [`sounds.${patronId}`]: 1 })
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
    const result = await CampaignModel.updateOne(
      { patreonCampaignId },
      { $set: { [`sounds.${patronId}`]: { ...sound, isApproved: !!autoApprove, isRejected: false } } }
    )
    if (!autoApprove) {
      await sendEmail(EmailType.NewSound, existing?.ownerPatreonId, {
        campaignId: patreonCampaignId,
        patreonId: patronId,
      })
    }
    return result
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
    const [result, email] = await Promise.all([
      CampaignModel.updateOne(
        { patreonCampaignId },
        { $set: { [`sounds.${patronId}.isApproved`]: true, [`sounds.${patronId}.isRejected`]: false } }
      ),
      ConnectionModel.findOne({ 'patreon.id': patronId }, { patreon: 1 }).lean(),
    ])
    await sendEmail(EmailType.ApprovedSound, email, {})
    return result
  },
  /**
   * Creator rejects a patreon sound
   */
  rejectSound: async (patreonCampaignId: string, patronId: string) => {
    await dbConnect()
    const [result, email] = await Promise.all([
      CampaignModel.updateOne(
        { patreonCampaignId },
        { $set: { [`sounds.${patronId}.isApproved`]: false, [`sounds.${patronId}.isRejected`]: true } }
      ),
      ConnectionModel.findOne({ 'patreon.id': patronId }, { patreon: 1 }).lean(),
    ])
    await sendEmail(EmailType.RejectedSound, email, {})
    return result
  },
  /**
   * Creator sets volume for a patreon sound
   */
  setSoundVolume: async (patreonCampaignId: string, patronId: string, volume: number) => {
    await dbConnect()
    return CampaignModel.updateOne({ patreonCampaignId }, { $set: { [`sounds.${patronId}.volume`]: volume } })
  },
  /**
   * Get sound for campaign to show to patreon
   */
  getUserSounds: async (patreonCampaignIds: string[], patronId: string) => {
    await dbConnect()
    return CampaignModel.find({ patreonCampaignId: { $in: patreonCampaignIds } }, { [`sounds.${patronId}`]: 1 })
  },
  /**
   * Upsert patron entitlement details for campaign
   */
  upsertPatronCampaignEntitlement: async (
    campaignId: string,
    patronId: string,
    details: Campaign['entitlements'][0]
  ) => {
    await dbConnect()
    return CampaignModel.updateOne({ _id: campaignId }, { $set: { [`entitlements.${patronId}`]: details } })
  },
  /**
   * Upsert multiple patron entitlement details for campaign
   */
  upsertPatronCampaignEntitlements: async (patreonCampaignId: string, entitlements: Campaign['entitlements']) => {
    await dbConnect()
    return CampaignModel.updateOne({ patreonCampaignId }, { $set: entitlements })
  },
  /**
   * Remove patron entitlement details for campaign
   */
  removePatronCampaignEntitlement: async (campaignId: string, patronId: string) => {
    await dbConnect()
    return CampaignModel.updateOne({ _id: campaignId }, { $unset: { [`entitlements.${patronId}`]: '' } })
  },
  /**
   * Update campaign webhook IDs
   */
  updateCampaignWebhooks: async (
    campaignId: string,
    webhooks: { upsert: { id: string; secret: string }; delete: { id: string; secret: string } }
  ) => {
    await dbConnect()
    return CampaignModel.updateOne({ _id: campaignId }, { $set: { webhooks } })
  },
  /**
   * Add campaign custom user
   */
  addCampaignCustomUser: async (campaignId: string, customUserId: string) => {
    await dbConnect()
    return CampaignModel.updateOne({ _id: campaignId }, { $push: { customUsers: customUserId } })
  },
  /**
   * Remove campaign custom user
   */
  removeCampaignCustomUser: async (campaignId: string, customUserId: string) => {
    await dbConnect()
    return CampaignModel.updateOne({ _id: campaignId }, { $pull: { customUsers: customUserId } })
  },
}

export const patreon = {
  refreshWebhooks: async (
    accessToken: string,
    campaignId: string,
    webhooks: { upsert: { id: string; secret: string }; delete: { id: string; secret: string } }
  ) => {
    console.info('[webhooks:refresh]', campaignId, webhooks)
    await Promise.all([
      fetch(`https://www.patreon.com/api/oauth2/v2/webhooks/${webhooks.upsert.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            id: webhooks.upsert.id,
            type: 'webhook',
            attributes: {
              triggers: ['members:pledge:create', 'members:pledge:update'],
              uri: `https://patreon-herald.mael.tech/api/webhooks/patreon/${campaignId}/upsert`,
              paused: 'false', // <- do this if you’re attempting to send missed events, see NOTE in Example Webhook Payload
            },
          },
        }),
      }),
      fetch(`https://www.patreon.com/api/oauth2/v2/webhooks/${webhooks.delete.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            id: webhooks.delete.id,
            type: 'webhook',
            attributes: {
              triggers: ['members:pledge:delete'],
              uri: `https://patreon-herald.mael.tech/api/webhooks/patreon/${campaignId}/delete`,
              paused: 'false', // <- do this if you’re attempting to send missed events, see NOTE in Example Webhook Payload
            },
          },
        }),
      }),
    ])
  },
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
              triggers: ['members:create', 'members:update', 'members:pledge:create', 'members:pledge:update'],
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
              triggers: ['members:delete', 'members:pledge:delete'],
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
    const webhookData = {
      upsert: { secret: data[0].data?.attributes.secret, id: data[0].data?.id },
      delete: { secret: data[1].data?.attributes.secret, id: data[1].data?.id },
    }
    await campaigns.updateCampaignWebhooks(createdCampaignId, webhookData)
    return webhookData
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
  getInitialMembers: async (patreonCampaignId: string) => {
    let cursor = null
    let data: {
      tiers: { amount_cents: number; title: string; id: string }[]
      user: { full_name: string; thumb_url: string; id: string }
    }[] = []
    try {
      const campaign = await campaigns.getPatreonTokens(patreonCampaignId)
      if (!campaign?.patreonAccessToken || !campaign?.patreonRefreshToken) {
        console.warn('Failed to get initial members, no tokens')
        return []
      }
      do {
        const page = await patreon.getMembersPage(
          campaign?.patreonAccessToken,
          campaign?.patreonRefreshToken,
          patreonCampaignId,
          cursor
        )
        console.info('[getInitialMembers]', { patreonCampaignId, cursor })
        const linkedUsers = new Map<string, any>(
          (page.included || []).filter((r) => r.type === 'user').map((r) => [r.id, { ...r.attributes, id: r.id }])
        )
        const linkedTiers = new Map<string, any>(
          (page.included || []).filter((r) => r.type === 'tier').map((r) => [r.id, { ...r.attributes, id: r.id }])
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
  getMembersPage: async (
    accessToken: string,
    refreshToken: string,
    patreonCampaignId: string,
    cursor: string | null
  ) => {
    return patreon
      .safeFetch(
        `https://www.patreon.com/api/oauth2/v2/campaigns/${patreonCampaignId}/members?${encodeURI(
          `include=currently_entitled_tiers,user&fields[user]=full_name,thumb_url&fields[tier]=title,amount_cents&page[count]=500${
            cursor ? '&page[cursor]=${cursor}' : ''
          }`
        )}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
        patreonCampaignId,
        accessToken,
        refreshToken
      )
      .then((r) => r.json())
  },
  refreshToken: async (refreshToken: string) => {
    return fetch(
      `https://patreon.com/api/oauth2/token?grant_type=refresh_token&refresh_token=${encodeURIComponent(
        refreshToken
      )}&client_id=${encodeURIComponent(process.env.PATREON_SECRET || '')}&client_secret=${encodeURIComponent(
        process.env.PATREON_ID || ''
      )}`,
      {
        method: 'POST',
      }
    )
      .then((r) => r.json())
      .then((data) => ({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        scope: data.scope,
        token_type: 'Bearer',
      }))
  },
  safeFetch: async (
    init: Parameters<typeof fetch>[0],
    config: Parameters<typeof fetch>[1],
    patreonCampaignId: string,
    accessToken: string,
    refreshToken: string,
    repeat = false
  ) => {
    const result = await fetch(init, {
      ...config,
      headers: {
        ...config?.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (result.status === 401 && !repeat) {
      const newTokens = await patreon.refreshToken(refreshToken)
      await campaigns.updateCampaignPatreonTokens(
        'patreonCampaign',
        patreonCampaignId,
        newTokens.accessToken || accessToken,
        newTokens.refreshToken || refreshToken
      )
      return patreon.safeFetch(init, config, patreonCampaignId, accessToken, refreshToken, true)
    }
    return result
  },
  getPatreonMembersList: async (campaignId: string) => {
    await dbConnect()
    const members = await patreon.getInitialMembers(campaignId)
    return { members }
  },
}

export const twitch = {
  searchUser: async (search?: string) => {
    if (!search || search.length < 3) {
      throw new Error('Requires search input')
    }
    const tokenRequest = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `client_id=${process.env.TWITCH_ID}&client_secret=${process.env.TWITCH_SECRET}&grant_type=client_credentials`,
    })
    const tokenData = await tokenRequest.json()
    if (!tokenData?.access_token) {
      throw new Error('Failed to get token')
    }
    const searchRequest = await fetch(
      `https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(search)}`,
      {
        headers: {
          Authorization: `Bearer ${tokenData?.access_token}`,
          'Client-Id': process.env.TWITCH_ID!,
        },
      }
    )
    const searchData = await searchRequest.json()
    return searchData.data
  },
}
