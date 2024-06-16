import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import PatreonListCanvas from '~/components/primitives/PatreonListCanvas'
import { Config, DEFAULT_CONFIG } from '~/util/list'

interface PatreonMember {
  tiers: { title: string; id: string; amount_cents: number }[]
  user: { id: string; full_name: string; thumb_url: string; twitch?: { displayName: string; image: string } }
}

const wait = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function retry(fn: () => Promise<void>, options: { limit: number; wait: number }) {
  let complete = false
  let tries = 0
  let lastError: Error | null = null
  do {
    tries = tries + 1
    try {
      await fn()
      complete = true
    } catch (e) {
      console.error('Retry error:', e)
      if (tries >= options.limit) {
        lastError = e
        complete = true
      } else {
        await wait(options.wait)
      }
    }
  } while (!complete)
  if (lastError) {
    throw lastError
  }
}

export default function PatreonListPage() {
  const { query } = useRouter()
  const config = { ...DEFAULT_CONFIG, ...query }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [members, setMembers] = useState<PatreonMember[]>()
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-extra-semi
    ;(async () => {
      try {
        if (query?.id) {
          retry(
            async () => {
              setLoading(true)
              const result = await fetch(`/api/patreon/members/${query?.id}`).then((r) => r.json())
              setMembers(result)
            },
            {
              limit: 5,
              wait: 1_000,
            }
          )
        }
      } catch (e) {
        console.warn('error', e)
        setError(true)
      } finally {
        setLoading(false)
      }
    })()
  }, [query?.id])
  return error ? (
    <div className="text-center">Sorry, something went wrong!</div>
  ) : loading ? null : (
    <PatreonList config={config} members={members} />
  )
}

function PatreonList({ config, members }: { config: Config; members?: PatreonMember[] }) {
  if (!members || members.length === 0) return null

  const tierBlocks = Object.values<{ title: string; amount: number; members: any[]; id: string }>(
    members.reduce((acc, m) => {
      const highestTier = m.tiers.sort((a, b) => b.amount_cents - a.amount_cents).at(0)
      if (highestTier) {
        acc[highestTier.id] = {
          id: highestTier.id,
          title: highestTier.title,
          amount: highestTier.amount_cents,
          members: [],
          ...(acc[highestTier.id] || {}),
        }
        acc[highestTier.id].members.push(m.user)
      }
      return acc
    }, {})
  )
    .filter((t) => (config.showFreeTier !== 'show' ? t.amount > 0 : true))
    .sort((a, b) => (config.tierOrdering === 'highestFirst' ? b.amount - a.amount : a.amount - b.amount))

  const totalMembers = tierBlocks.reduce((acc, t) => acc + t.members.length, 0)

  const items = tierBlocks.map((b) => ({ title: b.title, items: b.members.map((m) => m.full_name) }))
  console.info(totalMembers, tierBlocks, items)
  return <PatreonListCanvas items={items} />
}
