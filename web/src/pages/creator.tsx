import * as React from 'react'
import { signOut, useSession } from 'next-auth/react'
import { SiObsstudio } from 'react-icons/si'
import { useQuery } from 'react-query'
import { useRouter } from 'next/router'
import ManageCampaign from '~/components/primitives/ManageCampaign'
import { TwitchPrompt } from '~/components/primitives/Twitch'
import Link from 'next/link'
import Banner from '~/components/primitives/Banner'
import useRestrictedRoute from '~/components/hooks/useRestrictRoute'
import { FaCheck, FaChevronCircleDown, FaChevronCircleUp, FaCopy, FaExclamationCircle } from 'react-icons/fa'
import useCopyToClipboard from '~/components/hooks/useCopyToClipboard'

export default function CreatorManage() {
  useRestrictedRoute()
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
    <>
      <Banner iconCount={8} className="grid-cols-8 md:grid-cols-8 h-32">
        <h1 className="text-6xl font-bold font-badscript px-20">Creator</h1>
      </Banner>
      <div className="max-w-3xl flex flex-col gap-2 mx-auto pt-5 pb-10">
        <Link href="/">
          <a className="bg-yellow-200 text-yellow-700 text-center px-3 py-2 text-sm">
            Looking for the Patron view? Swap to the patron view here →
          </a>
        </Link>
        <TwitchPrompt />
        <h2 className="text-center text-3xl mb-5">Manage your campaigns</h2>
        {campaignData?.data?.map((campaign) => (
          <Campaign
            key={campaign?._id}
            session={session}
            campaign={campaign}
            internalCampaignData={internalCampaignData}
            managing={managing}
            setManaging={setManaging}
            refetchInternalCampaignData={refetchInternalCampaignData}
            accessToken={accessToken}
            campaignData={campaignData}
          />
        ))}
      </div>
    </>
  )
}

function Campaign({
  session,
  campaign,
  internalCampaignData,
  managing,
  setManaging,
  refetchInternalCampaignData,
  accessToken,
  campaignData,
}) {
  const obsUrl = `https://patreon-herald.mael.tech/obs/alert/${(session?.data as any)?.twitch?.username}/${campaign.id}`
  const [copied, copy] = useCopyToClipboard(obsUrl)
  return (
    <div key={campaign.id} className="bg-gray-200 rounded-md shadow-md px-10 py-5">
      <div className="flex flex-col justify-center items-center gap-2 text-center">
        <img src={campaign.attributes.avatar_photo_url} className="w-20 aspect-square rounded-full" />
        <h2 className="text-bold text-2xl">{campaign.attributes.name}</h2>
        <h3>{campaign.attributes.creation_name}</h3>
        <div className="flex flow-row flex-nowrap drop-shadow">
          <div className="bg-black rounded-l-md text-white flex justify-center items-center px-3 gap-2">
            <SiObsstudio /> OBS Source URL
          </div>
          <input className="text-ellipsis border bg-white px-3 py-1 border border-black" disabled value={obsUrl} />
          <button
            className="bg-black text-white flex justify-center items-center px-3"
            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
            onClick={() => copy()}
          >
            {copied ? <FaCheck /> : <FaCopy />}
          </button>
        </div>
        {internalCampaignData?.data?.has(campaign.id) ? (
          <div className="flex flex-row justify-around items-center w-full">
            <button
              className="gap-2"
              onClick={() => {
                if (managing) {
                  setManaging(undefined)
                } else {
                  window.location.hash = campaign.id
                  setManaging(campaign.id)
                }
              }}
            >
              {managing ? <FaChevronCircleUp /> : <FaChevronCircleDown />} Manage
            </button>
            <button className="bg-red-600">
              <FaExclamationCircle /> Disable
            </button>
          </div>
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
}
