import ConnectionModel, { Connection } from '~/db/connectionModel'
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(`${process.env.SEND_GRID_API_KEY}`)

export enum EmailType {
  NewSound = 'NewSound',
}

interface MessageData {
  subject: string
  text: string
  html: string
}
const storedMessages: Record<EmailType, MessageData> = {
  [EmailType.NewSound]: {
    subject: 'Patreon Herald - New sound to review',
    text: 'Hello %PATREON_NAME%! You have a new sound to review! Review it at %CAMPAIGN_ID%.',
    html: 'Hello %PATREON_NAME%!<br/>You have a new sound to review!<br/>Review it <a href="https://patreon-herald.mael.tech/creator#%CAMPAIGN_ID%">here.</a>',
  },
}

interface Metadata {
  campaignId?: string
}

function replace(type: EmailType, key: keyof MessageData, metadata: Metadata & Pick<Connection, 'patreon'>) {
  return storedMessages[type][key]
    .replace('%PATREON_NAME%', metadata?.patreon?.username || '')
    .replace('%CAMPAIGN_ID%', metadata?.campaignId || '')
}

export async function sendEmail(type: EmailType, ownerId?: string, metadata: Metadata = {}) {
  try {
    const account = await ConnectionModel.findOne({ 'patreon.id': ownerId }, { patreon: 1 }).lean()
    if (!account || !account.patreon) return
    const msgMetadata = {
      campaignId: metadata?.campaignId,
      ...account,
    }
    const msg = {
      from: 'patreon-herald@mael.tech',
      to: account.patreon.email || 'matt.a.elphy@gmail.com',
      subject: replace(type, 'subject', msgMetadata),
      text: replace(type, 'text', msgMetadata),
      html: replace(type, 'html', msgMetadata),
    }

    return sgMail.send(msg)
  } catch (e) {
    console.error('[email][send]', e)
  }
}
