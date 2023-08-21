import mongoose, { Schema, Model } from 'mongoose'

type WithDoc<T> = T

export interface Campaign {
  patreonCampaignId: string
  ownerPatreonId: string
  webhooks: {
    upsert: {
      id: string
      secret: string
    }
    delete: {
      id: string
      secret: string
    }
  }
  entitledCriteria: {
    criteriaType: string
    amountCents: number
    tierId: string
  }
  entitlements: {
    [k: string]: {
      currentlyEntitledAmountsCents: number
      currentlyEntitledTiers: string[]
      lifetimeSupportCents: number
      lastUpdated: string
    }
  }
  sounds: {
    [k: string]: {
      sound: string
      isApproved: boolean
      isRejected: boolean
    }
  }
  customUsers: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ItemModel extends Model<WithDoc<Campaign>> {}

const itemSchema = new Schema<WithDoc<Campaign>, ItemModel>(
  {
    patreonCampaignId: { required: true, unique: true, type: String },
    ownerPatreonId: { required: true, type: String },
    webhooks: {
      upsert: {
        id: String,
        secret: String,
      },
      delete: {
        id: String,
        secret: String,
      },
    },
    entitledCriteria: {
      type: {
        criteriaType: {
          type: String,
          default: 'currently_entitled',
        },
        amountCents: Number,
        tierId: String,
      },
    },
    entitlements: {
      default: {},
      type: Map,
      of: {
        currentlyEntitledAmountsCents: { default: 0, type: Number },
        currentlyEntitledTiers: { default: [], type: Array, of: String },
        lifetimeSupportCents: { default: 0, type: Number },
        lastUpdated: String,
      },
    },
    sounds: {
      default: {},
      type: Map,
      of: {
        sound: String,
        volume: { type: Number, default: 1 },
        isApproved: { type: Boolean, default: false },
        isRejected: { type: Boolean, default: false },
      },
    },
    customUsers: {
      default: [],
      type: [String],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    id: true,
    timestamps: true,
  }
)

const Item =
  (mongoose.models.Campaign as ItemModel) || mongoose.model<WithDoc<Campaign>, ItemModel>('Campaign', itemSchema)

export default Item
