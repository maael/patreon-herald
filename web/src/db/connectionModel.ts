import mongoose, { Schema, Model } from 'mongoose'

type WithDoc<T> = T

export interface Connection {
  patreon: {
    id: string
    username?: string
    image?: string
    email?: string
  }
  twitch:
    | {
        id: string
        username: string
        displayName: string
        image: string
      }
    | undefined
  createdAt: string
  updatedAt: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ItemModel extends Model<WithDoc<Connection>> {}

const itemSchema = new Schema<WithDoc<Connection>, ItemModel>(
  {
    patreon: {
      required: true,
      type: {
        id: {
          type: String,
          unique: true,
        },
        username: { required: false, type: String },
        image: { required: false, type: String },
        email: { required: false, type: String },
      },
    },
    twitch: {
      require: false,
      type: {
        id: String,
        username: String,
        displayName: String,
        image: String,
      },
    },
  },
  {
    id: true,
    timestamps: true,
  }
)

const Item =
  (mongoose.models.Connection as ItemModel) || mongoose.model<WithDoc<Connection>, ItemModel>('Connection', itemSchema)

export default Item
