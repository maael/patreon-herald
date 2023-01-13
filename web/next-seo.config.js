const title = 'Patreon Herald | Roll out the red carpet!'
const description = 'Announce Patreons on their first message in Twitch chat of the stream'
const url = 'https://mael.tech/'

export default {
  title,
  description,
  openGraph: {
    title,
    description,
    url,
    site_name: title,
    type: 'website',
    locale: 'en_GB',
  },
  twitter: {
    handle: '@mattaelphick',
    site: '@mattaelphick',
    cardType: 'summary_large_image',
  },
}
