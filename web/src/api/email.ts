import ConnectionModel, { Connection } from '~/db/connectionModel'
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(`${process.env.SEND_GRID_API_KEY}`)

export enum EmailType {
  NewSound = 'NewSound',
  ApprovedSound = 'ApprovedSound',
  RejectedSound = 'RejectedSound',
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
    html: 'Hello %PATREON_NAME%!<br/>You have a new sound to review!<br/>Review it <a href="https://patreon-herald.mael.tech/creator?c=%CAMPAIGN_ID%&p=%PATREON_ID%">here.</a>',
  },
  [EmailType.ApprovedSound]: {
    subject: 'Patreon Herald - Approved sound',
    text: 'Good news, your sound was approved!',
    html: 'Good news, your sound was approved!',
  },
  [EmailType.RejectedSound]: {
    subject: 'Patreon Herald - Rejected sound',
    text: 'Sorry, your sound was rejected - please review it at https://patreon-herald.mael.tech/patron',
    html: 'Sorry, your sound was rejected - please review it <a href="https://patreon-herald.mael.tech/patron">here</a>',
  },
}

interface Metadata {
  campaignId?: string
  patreonId?: string
}

function replace(type: EmailType, key: keyof MessageData, metadata: Metadata & Pick<Connection, 'patreon'>) {
  return storedMessages[type][key]
    .replace('%PATREON_NAME%', metadata?.patreon?.username || '')
    .replace('%CAMPAIGN_ID%', metadata?.campaignId || '')
    .replace('%PATREON_ID%', metadata?.patreonId || '')
}

export async function sendEmail(
  type: EmailType,
  ownerId?: string | Pick<Connection, 'patreon'> | null,
  metadata: Metadata = {}
) {
  try {
    const account =
      ownerId && typeof ownerId === 'string'
        ? await ConnectionModel.findOne({ 'patreon.id': ownerId }, { patreon: 1 }).lean()
        : (ownerId as Pick<Connection, 'patreon'> | undefined)
    if (!account || !account.patreon) return
    const msgMetadata = {
      campaignId: metadata?.campaignId,
      patreonId: metadata?.patreonId,
      ...account,
    }
    const msg = {
      from: {
        name: 'Patreon Herald',
        email: 'patreon-herald@mael.tech',
      },
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
