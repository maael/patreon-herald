import cls from 'classnames'
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
  )
    .filter((t) => (config.showFreeTier !== 'show' ? t.amount > 0 : true))
    .sort((a, b) => (config.tierOrdering === 'highestFirst' ? b.amount - a.amount : a.amount - b.amount))

  const totalMembers = tierBlocks.reduce((acc, t) => acc + t.members.length, 0)

  return (
    <div className="p-5 flex-1 flex flex-col gap-5 font-bold overflow-hidden">
      <h1
        style={{ ...getStyles('title', config), height: '5vh', flexShrink: 0, fontSize: '5vh' }}
        className="text-center flex justify-center items-center"
      >
        {config.title}
      </h1>
      <div className="flex flex-row flex-wrap justify-around gap-5 flex-1">
        {tierBlocks
          .reduce<any[]>((acc, t, idx, arr) => {
            if (idx !== 0 && t.members.length < 10 && arr[idx - 1].members.length < 10 && totalMembers > 100) {
              if (Array.isArray(acc[idx - 1])) {
                acc[idx - 1].push(t)
              } else {
                acc[idx - 1] = [acc[idx - 1], t]
              }
            } else {
              acc.push(t)
            }
            return acc
          }, [])
          .map((t) => {
            return Array.isArray(t) ? (
              <div className="flex flex-col gap-10">
                {t.map((ti) => (
                  <TierBlock compressed key={ti.id} title={ti.title} members={ti.members} config={config} />
                ))}
              </div>
            ) : (
              <TierBlock key={t.id} title={t.title} members={t.members} config={config} />
            )
          })}
      </div>
    </div>
  )
}

function TierBlock({
  title,
  members,
  config,
  compressed,
}: {
  title: string
  members: PatreonMember['user'][]
  config: Config
  compressed?: boolean
}) {
  const patreonStyles = getStyles('patreons', config)
  return (
    <div className={cls('flex flex-col gap-1', { 'flex-1': !compressed })}>
      <h2 className="text-center mx-auto" style={{ ...getStyles('tier', config), maxWidth: 350 }}>
        {title.replace(/[a-z][A-Z]/g, (g) => {
          return g.split('').join(' ')
        })}
      </h2>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexFlow: 'column wrap',
          gap: 1,
          height: !compressed ? '80vh' : undefined,
        }}
      >
        {members.map((m) => {
          return (
            <div
              key={m.id}
              style={{
                ...patreonStyles,
                flex: '0 1',
                textAlign: 'center',
                textOverflow: 'ellipsis',
                fontSize: members.length > 50 ? 15 : members.length > 30 ? 20 : members.length > 20 ? 22 : 30,
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
