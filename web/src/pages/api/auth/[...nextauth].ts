import NextAuth, { AuthOptions } from 'next-auth'
import TwitchProvider from 'next-auth/providers/twitch'
import PatreonProvider from 'next-auth/providers/patreon'

/**
 * We hijack NextAuth with a route at /api/auth/callback/twitch which takes a higher precedence
 * Then we can use the session for Patreon info (need to get id ideally) and use the code in the
 * query to get the twitch user information, and then store a record connecting them
 *
 * Then in the patreon provider/callbacks we can check to see if this record exists in mongo
 * and if it does we can use that to get/set the twitch information on the token, skipping
 * if it's already present
 *
 * ISSUE: Can't get Patreon ID into session to get via getServerSession in twitch callback route
 *
 * IDEA: Maybe store patreon emails for notifications - new approval of sounds etc
 * IDEA: Or instead of email, we can just have the tray app check for it and display a notification
 * if it's needed - would need to see if possible
 */

export const authOptions: AuthOptions = {
  // Configure one or more authentication providers
  providers: [
    PatreonProvider({
      clientId: process.env.PATREON_ID || '',
      clientSecret: process.env.PATREON_SECRET || '',
      profile(profile) {
        return {
          id: profile.data.id,
          name: profile.data.attributes.full_name,
          email: profile.data.attributes.email,
          image: profile.data.attributes.image_url,
        }
      },
      authorization: {
        params: {
          scope: 'campaigns campaigns.members identity.memberships',
        },
      },
    }),
    TwitchProvider({
      clientId: process.env.TWITCH_ID || '',
      clientSecret: process.env.TWITCH_SECRET || '',
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.preferred_username,
          email: profile.email,
          image: profile.picture,
        }
      },
      authorization: {
        params: {
          scope:
            'openid user:read:email user:read:subscriptions chat:read chat:edit channel:read:subscriptions channel_subscriptions',
          claims: {
            id_token: {
              email: null,
              picture: null,
              preferred_username: null,
            },
          },
        },
      },
    }),
    // ...add more providers here
  ],
  callbacks: {
    async jwt({ token, account }) {
      console.info('[jwt]', { token, account })
      if (account) {
        token.accessToken = account?.access_token
        token.refreshToken = account?.refresh_token
        token.uid = account?.providerAccountId
      }
      return token
    },
    async session({ session, token, user }) {
      console.info('[session]', { session, token, user })
      // eslint-disable-next-line @typescript-eslint/no-extra-semi
      ;(session as any).accessToken = token.accessToken
      ;(session as any).refreshToken = token.refreshToken
      ;(session as any).uid = token.uid
      return session
    },
  },
}

export default NextAuth(authOptions)
