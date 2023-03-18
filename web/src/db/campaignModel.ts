import mongoose, { Schema, Model } from 'mongoose'

type WithDoc<T> = T

export interface Campaign {
  patreonCampaignId: string
  ownerPatreonId: string
  entitledCriteria: {
    criteriaType: string
    amountCents: number
    tierId: string
  }
  sounds: {
    [k: string]: {
      sound: string
      currentlyEntitledAmountsCents: number
      currentlyEntitledTiers: string[]
      lifetimeSupportCents: number
      isApproved: boolean
      isRejected: boolean
    }
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ItemModel extends Model<WithDoc<Campaign>> {}

const itemSchema = new Schema<WithDoc<Campaign>, ItemModel>(
  {
    patreonCampaignId: { required: true, type: String },
    ownerPatreonId: { required: true, type: String },
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
    sounds: {
      default: {},
      type: Map,
      of: {
        sound: String,
        currentlyEntitledAmountsCents: { default: 0, type: Number },
        currentlyEntitledTiers: { default: [], type: Array, of: String },
        lifetimeSupportCents: { default: 0, type: Number },
        isApproved: { type: Boolean, default: false },
        isRejected: { type: Boolean, default: false },
      },
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
