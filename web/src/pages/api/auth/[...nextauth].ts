import NextAuth, { AuthOptions } from 'next-auth'
import TwitchProvider from 'next-auth/providers/twitch'
import PatreonProvider from 'next-auth/providers/patreon'
import { connection } from '~/api'

export const authOptions: AuthOptions = {
  // Configure one or more authentication providers
  providers: [
    PatreonProvider({
      clientId: process.env.PATREON_ID || '',
      clientSecret: process.env.PATREON_SECRET || '',
      userinfo: {
        url: `https://www.patreon.com/api/oauth2/v2/identity?${encodeURI('fields[user]=full_name,thumb_url')}`,
      },
      profile(profile) {
        return {
          id: profile.data.id,
          name: profile.data.attributes.full_name,
          email: undefined,
          image: profile.data.attributes.thumb_url,
        }
      },
      authorization: {
        params: {
          scope: 'identity campaigns campaigns.members identity.memberships w:campaigns.webhook',
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
    async signIn({ profile }) {
      if (!profile) return false
      const profileData = (profile as any).data
      const tidyProfile = {
        id: profileData.id,
        username: profileData.attributes.full_name,
        image: profileData.attributes.image_url,
      }
      await connection.createInitial(tidyProfile)
      return true
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account?.access_token
        token.refreshToken = account?.refresh_token
        token.uid = account?.providerAccountId
      }
      return token
    },
    async session({ session, token }) {
      const anySession = session as any
      anySession.accessToken = token.accessToken
      anySession.refreshToken = token.refreshToken
      anySession.uid = token.uid
      if (!anySession.twitch) {
        anySession.twitch = await connection.getTwitchConnectionByPatreonId(token.uid as string)
      }
      return session
    },
  },
}

export default NextAuth(authOptions)
