# Patreon API

## Webhooks

### `members:pledge:update`

```json
{
  "data": {
    "attributes": {
      "campaign_lifetime_support_cents": 240,
      "currently_entitled_amount_cents": 100,
      "email": "email",
      "full_name": "Matt Test",
      "is_follower": false,
      "last_charge_date": "2023-03-08T08:24:05.000+00:00",
      "last_charge_status": "Paid",
      "lifetime_support_cents": 240,
      "next_charge_date": "2023-04-08T00:00:00.000+00:00",
      "note": "",
      "patron_status": "active_patron",
      "pledge_cadence": 1,
      "pledge_relationship_start": "2023-02-08T16:36:58.615+00:00",
      "will_pay_amount_cents": 100
    },
    "id": "6e8d5b84-dfc9-457b-bb88-89df59777251",
    "relationships": {
      "address": {
        "data": null
      },
      "campaign": {
        "data": {
          "id": "9441253",
          "type": "campaign"
        },
        "links": {
          "related": "https://www.patreon.com/api/oauth2/v2/campaigns/9441253"
        }
      },
      "currently_entitled_tiers": {
        "data": [
          {
            "id": "9512023",
            "type": "tier"
          },
          {
            "id": "9512103",
            "type": "tier"
          }
        ]
      },
      "user": {
        "data": {
          "id": "88555402",
          "type": "user"
        },
        "links": {
          "related": "https://www.patreon.com/api/oauth2/v2/user/88555402"
        }
      }
    },
    "type": "member"
  },
  "included": [
    {
      "attributes": {
        "created_at": "2022-10-20T19:31:46.000+00:00",
        "creation_name": "creating Websites and tools for various things",
        "discord_server_id": null,
        "google_analytics_id": null,
        "has_rss": false,
        "has_sent_rss_notify": false,
        "image_small_url": "https://c10.patreonusercontent.com/4/patreon-media/p/campaign/9441253/0ef3531192c144be8ce0d2be85aebbff/eyJ3IjoxOTIwLCJ3ZSI6MX0%3D/1.jpg?token-time=1680566400&token-hash=WpQ4HorzfgsWB52FDeTixbZUhr3hjzoVCDcxpWSFHyE%3D",
        "image_url": "https://c10.patreonusercontent.com/4/patreon-media/p/campaign/9441253/0ef3531192c144be8ce0d2be85aebbff/eyJ3IjoxOTIwLCJ3ZSI6MX0%3D/1.jpg?token-time=1680566400&token-hash=WpQ4HorzfgsWB52FDeTixbZUhr3hjzoVCDcxpWSFHyE%3D",
        "is_charged_immediately": true,
        "is_monthly": true,
        "is_nsfw": false,
        "main_video_embed": null,
        "main_video_url": null,
        "one_liner": null,
        "patron_count": 1,
        "pay_per_name": "month",
        "pledge_url": "/join/maael",
        "published_at": "2022-10-20T19:33:34.000+00:00",
        "rss_artwork_url": null,
        "rss_feed_title": null,
        "summary": null,
        "thanks_embed": null,
        "thanks_msg": null,
        "thanks_video_url": null,
        "url": "https://www.patreon.com/maael",
        "vanity": "maael"
      },
      "id": "9441253",
      "type": "campaign"
    },
    {
      "attributes": {
        "about": null,
        "created": "2023-02-08T16:36:05.000+00:00",
        "first_name": "Matt",
        "full_name": "Matt Test",
        "hide_pledges": true,
        "image_url": "https://c10.patreonusercontent.com/4/patreon-media/p/user/88555402/4bfe4370ac554bc99e4068c0a96b3b6a/eyJ3IjoyMDB9/1.png?token-time=2145916800&token-hash=G_UxtwH_5S9bYwkabnIyvl2cmwKKKJqy309svWeCqdg%3D",
        "is_creator": false,
        "last_name": "Test",
        "like_count": 0,
        "social_connections": {
          "deviantart": null,
          "discord": null,
          "facebook": null,
          "google": null,
          "instagram": null,
          "reddit": null,
          "spotify": null,
          "twitch": null,
          "twitter": null,
          "vimeo": null,
          "youtube": null
        },
        "thumb_url": "https://c10.patreonusercontent.com/4/patreon-media/p/user/88555402/4bfe4370ac554bc99e4068c0a96b3b6a/eyJ3IjoyMDB9/1.png?token-time=2145916800&token-hash=G_UxtwH_5S9bYwkabnIyvl2cmwKKKJqy309svWeCqdg%3D",
        "url": "https://www.patreon.com/user?u=88555402",
        "vanity": null
      },
      "id": "88555402",
      "type": "user"
    },
    {
      "attributes": {
        "amount_cents": 100,
        "created_at": "2023-02-08T16:57:40.357+00:00",
        "description": "",
        "discord_role_ids": null,
        "edited_at": "2023-02-08T16:57:40.357+00:00",
        "image_url": null,
        "patron_count": 1,
        "post_count": 0,
        "published": true,
        "published_at": "2023-02-08T16:57:40.357+00:00",
        "remaining": null,
        "requires_shipping": false,
        "title": "Bib",
        "unpublished_at": null,
        "url": "/join/maael/checkout?rid=9512103",
        "user_limit": null
      },
      "id": "9512103",
      "type": "tier"
    },
    {
      "attributes": {
        "amount_cents": 100,
        "created_at": "2023-02-08T16:33:53.335+00:00",
        "description": "",
        "discord_role_ids": null,
        "edited_at": "2023-02-08T16:33:53.335+00:00",
        "image_url": null,
        "patron_count": 0,
        "post_count": 0,
        "published": true,
        "published_at": "2023-02-08T16:33:53.335+00:00",
        "remaining": null,
        "requires_shipping": false,
        "title": "Not Even a Bit",
        "unpublished_at": null,
        "url": "/join/maael/checkout?rid=9512023",
        "user_limit": null
      },
      "id": "9512023",
      "type": "tier"
    }
  ],
  "links": {
    "self": "https://www.patreon.com/api/oauth2/v2/members/6e8d5b84-dfc9-457b-bb88-89df59777251"
  }
}
```

### `members:pledge:create`

> **Note**
>
> Only the `data` field is shown here, it's assumed the `included` and `links` fields are similar to other webhooks

```json
{
  "data": {
    "attributes": {
      "campaign_lifetime_support_cents": 240,
      "currently_entitled_amount_cents": 100,
      "email": "email",
      "full_name": "Matt Test",
      "is_follower": false,
      "last_charge_date": "2023-03-08T08:24:05.000+00:00",
      "last_charge_status": "Paid",
      "lifetime_support_cents": 240,
      "next_charge_date": "2023-04-08T00:00:00.000+00:00",
      "note": "",
      "patron_status": "active_patron",
      "pledge_cadence": 1,
      "pledge_relationship_start": "2023-02-08T16:36:58.615+00:00",
      "will_pay_amount_cents": 100
    },
    "id": "6e8d5b84-dfc9-457b-bb88-89df59777251",
    "relationships": {
      "address": {
        "data": null
      },
      "campaign": {
        "data": {
          "id": "9441253",
          "type": "campaign"
        },
        "links": {
          "related": "https://www.patreon.com/api/oauth2/v2/campaigns/9441253"
        }
      },
      "currently_entitled_tiers": {
        "data": [
          {
            "id": "9512103",
            "type": "tier"
          },
          {
            "id": "9512023",
            "type": "tier"
          }
        ]
      },
      "user": {
        "data": {
          "id": "88555402",
          "type": "user"
        },
        "links": {
          "related": "https://www.patreon.com/api/oauth2/v2/user/88555402"
        }
      }
    },
    "type": "member"
  }
}
```

### `members:pledge:delete`

> **Note**
>
> Only the `data` field is shown here, it's assumed the `included` and `links` fields are similar to other webhooks

> **Warning**
>
> I think the data shape here is the for the update when the membership is updated, not when it's deleted

```json
{
  "data": {
    "attributes": {
      "campaign_lifetime_support_cents": 240,
      "currently_entitled_amount_cents": 100,
      "email": "email",
      "full_name": "Matt Test",
      "is_follower": false,
      "last_charge_date": "2023-03-08T08:24:05.000+00:00",
      "last_charge_status": "Paid",
      "lifetime_support_cents": 240,
      "next_charge_date": "2023-04-08T00:00:00.000+00:00",
      "note": "",
      "patron_status": "active_patron",
      "pledge_cadence": 1,
      "pledge_relationship_start": "2023-02-08T16:36:58.615+00:00",
      "will_pay_amount_cents": 100
    },
    "id": "6e8d5b84-dfc9-457b-bb88-89df59777251",
    "relationships": {
      "address": {
        "data": null
      },
      "campaign": {
        "data": {
          "id": "9441253",
          "type": "campaign"
        },
        "links": {
          "related": "https://www.patreon.com/api/oauth2/v2/campaigns/9441253"
        }
      },
      "currently_entitled_tiers": {
        "data": [
          {
            "id": "9512023",
            "type": "tier"
          },
          {
            "id": "9512103",
            "type": "tier"
          }
        ]
      },
      "user": {
        "data": {
          "id": "88555402",
          "type": "user"
        },
        "links": {
          "related": "https://www.patreon.com/api/oauth2/v2/user/88555402"
        }
      }
    },
    "type": "member"
  }
}
```
