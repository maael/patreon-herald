export interface IncludedTier {
  attributes: {
    amount_cents: number
    created_at: string
    description: string
    discord_role_ids: null
    edited_at: string
    image_url: null
    patron_count: number
    post_count: number
    published: true
    published_at: string
    remaining: null
    requires_shipping: boolean
    title: string
    unpublished_at: string | null
    url: string
    user_limit: number | null
  }
  id: string
  type: 'tier'
}

interface IncludedCampaign {
  attributes: {
    created_at: string
    creation_name: string
    discord_server_id: null
    google_analytics_id: null
    has_rss: boolean
    has_sent_rss_notify: boolean
    image_small_url: string
    image_url: string
    is_charged_immediately: boolean
    is_monthly: boolean
    is_nsfw: boolean
    main_video_embed: null
    main_video_url: null
    one_liner: null
    patron_count: 1
    pay_per_name: string
    pledge_url: string
    published_at: string
    rss_artwork_url: null
    rss_feed_title: null
    summary: null
    thanks_embed: null
    thanks_msg: null
    thanks_video_url: null
    url: string
    vanity: string
  }
  id: string
  type: 'campaign'
}

interface IncludedUser {
  attributes: {
    about: null
    created: string
    first_name: string
    full_name: string
    hide_pledges: boolean
    image_url: string
    is_creator: boolean
    last_name: string
    like_count: number
    social_connections: {
      deviantart: null
      discord: null
      facebook: null
      google: null
      instagram: null
      reddit: null
      spotify: null
      twitch: null
      twitter: null
      vimeo: null
      youtube: null
    }
    thumb_url: string
    url: string
    vanity: null
  }
  id: string
  type: 'user'
}

export interface Body {
  data: {
    attributes: {
      campaign_lifetime_support_cents: number
      currently_entitled_amount_cents: number
      email: string
      full_name: string
      is_follower: boolean
      last_charge_date: string
      last_charge_status: string
      lifetime_support_cents: number
      next_charge_date: string
      note: string
      patron_status: string
      pledge_cadence: 1
      pledge_relationship_start: string
      will_pay_amount_cents: number
    }
    id: string
    relationships: {
      address: {
        data: null
      }
      campaign: {
        data: {
          id: string
          type: string
        }
        links: {
          related: string
        }
      }
      currently_entitled_tiers: {
        data: [
          {
            id: string
            type: string
          }
        ]
      }
      user: {
        data: {
          id: string
          type: string
        }
        links: {
          related: string
        }
      }
    }
    type: 'member'
  }
  included: (IncludedCampaign | IncludedUser | IncludedTier)[]
  links: {
    self: string
  }
}
