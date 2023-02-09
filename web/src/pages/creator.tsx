import * as React from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useQuery } from 'react-query'
import { useRouter } from 'next/router'
import ManageCampaign from '~/components/primitives/ManageCampaign'
import Twitch from '~/components/primitives/Twitch'
import Link from 'next/link'

export default function CreatorManage() {
  const session = useSession()
  const accessToken = (session?.data as any)?.accessToken
  const { data: campaignData } = useQuery(['patreon', 'creator', 'campaigns'], {
    enabled: !!accessToken,
    queryFn: async () => {
      try {
        const result = await fetch(`/api/patreon/campaigns`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then((r) => r.json())
        if (result.errors) {
          await signOut()
        }
        return result
      } catch (e) {
        return { error: e.toString(), accessToken }
      }
    },
  })
  const { data: internalCampaignData, refetch: refetchInternalCampaignData } = useQuery(
    ['internal', 'creator', 'campaigns'],
    {
      queryFn: async () => {
        try {
          const result = await fetch(`/api/internal/campaigns`)
            .then((r) => r.json())
            .then((d) => {
              return { data: new Map<string, any>(d.campaigns.map((c) => [c.patreonCampaignId, c])) }
            })
          return result
        } catch (e) {
          return { error: e.toString(), data: undefined }
        }
      },
    }
  )
  const [managing, setManaging] = React.useState<undefined | string>()
  const { asPath } = useRouter()
  React.useEffect(() => {
    setManaging(asPath.split('#')[1])
  }, [asPath])
  console.info(campaignData)
  return (
    <div className="max-w-3xl flex flex-col gap-2 mx-auto pt-5 pb-10">
      <Link href="/">
        <a className="bg-yellow-200 text-yellow-700 text-center px-3 py-2 text-sm">
          Looking for the Patron view? Swap to the patron view here →
        </a>
      </Link>
      <Twitch />
      <h1 className="text-center text-5xl">Creator</h1>
      <h2 className="text-center text-3xl mb-5">Manage your campaigns</h2>
      {campaignData?.data?.map((campaign) => {
        return (
          <div key={campaign.id} className="bg-gray-200 rounded-md shadow-md px-10 py-5">
            <div className="flex flex-col justify-center items-center gap-2 text-center">
              <img src={campaign.attributes.avatar_photo_url} className="w-20 aspect-square rounded-full" />
              <h2 className="text-bold text-2xl">{campaign.attributes.name}</h2>
              <h3>{campaign.attributes.creation_name}</h3>
              <input
                disabled
                value={`https://patreon-herald.mael.tech/obs/alert/${(session.data as any).twitch.username}/${
                  campaign.id
                }`}
              />
              {internalCampaignData?.data?.has(campaign.id) ? (
                <button
                  onClick={() => {
                    if (managing) {
                      setManaging(undefined)
                    } else {
                      window.location.hash = campaign.id
                      setManaging(campaign.id)
                    }
                  }}
                >
                  Manage
                </button>
              ) : (
                <button
                  onClick={async () => {
                    const res = await fetch('/api/internal/campaigns', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(campaign),
                    })
                    await res.json()
                    await refetchInternalCampaignData()
                  }}
                >
                  Enable
                </button>
              )}
              {managing ? (
                <ManageCampaign
                  internalCampaign={internalCampaignData?.data?.get(campaign.id)}
                  campaign={campaign}
                  accessToken={accessToken}
                  campaignData={campaignData}
                  refetch={refetchInternalCampaignData}
                />
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
