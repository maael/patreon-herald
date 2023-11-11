import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Config, DEFAULT_CONFIG } from '~/util/list'

interface PatreonMember {
  tiers: { title: string; id: string; amount_cents: number }[]
  user: { id: string; full_name: string; thumb_url: string; twitch?: { displayName: string; image: string } }
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
          setLoading(true)
          const result = await fetch(`/api/patreon/members/${query?.id}`).then((r) => r.json())
          setMembers(result)
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
    <div>Sorry, something went wrong!</div>
  ) : loading ? null : (
    <PatreonList config={config} members={members} />
  )
}

function getStyles(type: string, config: Config) {
  return {
    color: config[`${type}Color`],
    fontSize: config[`${type}Size`],
    fontFamily: config[`${type}Font`],
  }
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
  ).sort((a, b) => (config.tierOrdering === 'highestFirst' ? b.amount - a.amount : a.amount - b.amount))

  return (
    <div className="p-5 flex-1 flex flex-col gap-5 font-bold overflow-hidden">
      <h1
        style={{ ...getStyles('title', config), height: '10vh', flexShrink: 0, fontSize: '5vh' }}
        className="text-center flex justify-center items-center"
      >
        {config.title}
      </h1>
      <div className="flex flex-row flex-wrap justify-around gap-5 flex-1">
        {tierBlocks.map((t) => {
          return <TierBlock key={t.id} title={t.title} members={t.members} config={config} />
        })}
      </div>
    </div>
  )
}

function TierBlock({ title, members, config }: { title: string; members: PatreonMember['user'][]; config: Config }) {
  return (
    <div className="flex flex-col gap-1 flex-1">
      <h2 className="text-center" style={getStyles('tier', config)}>
        {title}
      </h2>
      <div style={{ display: 'flex', alignItems: 'center', flexFlow: 'column wrap', height: '85vh', gap: 5 }}>
        {members.map((m) => {
          return (
            <div
              key={m.id}
              style={{
                ...getStyles('patreons', config),
                flex: '0 1',
                textAlign: 'center',
                textOverflow: 'ellipsis',
              }}
            >
              {config.patreonsName === 'preferTwitch' ? m.twitch?.displayName || m.full_name : m.full_name}
            </div>
          )
        })}
      </div>
    </div>
  )
}
