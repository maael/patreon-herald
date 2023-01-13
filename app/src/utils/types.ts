export interface Settings {
  autoConnect: boolean
  // subLuck: number
  // numberOfWinners: number
  // followersOnly: boolean
  // chatCommand: string
  // winnerMessage: string
  // sendMessages: boolean
  // blocklist: string[]
  autoScroll?: boolean
  // spamLimit?: number
  performanceMode?: boolean
  // forfeitCommand?: string
  // alertDuration?: number
  // alertTheme?: AlertTheme
  // alertCustomImageUrl?: string
  // autoAnnounce?: boolean
  // timerBell?: boolean
  // giveawayName?: string
  // timerDuration?: number
  // timerAlertHidden?: boolean
}

export enum AlertTheme {
  GW2 = 'gw2',
  Custom = 'custom',
}

export type ChannelInfo = Partial<{
  token: string
  refreshToken: string
  login: string
  userId: string
  clientId: string
}>
