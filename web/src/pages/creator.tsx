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
import { FaCheck, FaChevronCircleDown, FaChevronCircleUp, FaCopy, FaPlus, FaTimes } from 'react-icons/fa'
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
  return (
    <>
      <Banner iconCount={8} className="grid-cols-8 md:grid-cols-8 h-36">
        <h1 className="text-6xl font-bold font-badscript px-4 sm:px-20">Creator</h1>
      </Banner>
      <div className="max-w-3xl flex flex-col gap-2 mx-auto pt-5 pb-10 w-full">
        <Link href="/patron">
          <a className="bg-yellow-200 text-yellow-700 text-center px-3 py-2 text-sm">
            Looking for the Patron view? Swap to the patron view here →
          </a>
        </Link>
        <TwitchPrompt />
        <h2 className="text-center text-4xl mt-5 mb-2">Manage your campaigns</h2>
        {campaignData?.data?.map((campaign) => (
          <Campaign
            key={campaign?.id}
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
  const isActive = internalCampaignData?.data?.has(campaign.id)
  return (
    <>
      <div className="bg-white w-full drop-shadow-lg rounded-lg relative mt-12 border border-grey-300 p-4 flex flex-col gap-2 z-50">
        <img
          src={campaign.attributes.avatar_photo_url}
          className="rounded-full border-2 border-grey-300 bg-white w-20 h-20 absolute -top-12 left-1/2 -translate-x-1/2 drop-shadow-lg"
        />
        {isActive ? (
          <button className="bg-red-600 absolute top-4 right-4 text-sm px-3 py-1 group h-8">
            <FaTimes />
            <span className="hidden group-hover:block">Disable</span>
          </button>
        ) : null}
        <div>
          <h2 className="text-bold text-2xl">{campaign.attributes.name}</h2>
          <h3>{campaign.attributes.creation_name}</h3>
        </div>
        <div className="w-full flex flex-row justify-between items-center">
          {isActive ? (
            <>
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
              <div className="flex flow-row flex-nowrap drop-shadow">
                <div className="bg-orange-400 rounded-l-md text-white flex justify-center items-center px-3 gap-2">
                  <SiObsstudio /> OBS Source URL
                </div>
                <button
                  className="bg-black text-white flex justify-center items-center px-3"
                  style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                  onClick={() => copy()}
                >
                  {copied ? <FaCheck /> : <FaCopy />}
                </button>
              </div>
            </>
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
              className="bg-green-600 mx-auto text-xl"
            >
              <FaPlus /> Enable
            </button>
          )}
        </div>
      </div>

      {managing ? (
        <ManageCampaign
          internalCampaign={internalCampaignData?.data?.get(campaign.id)}
          campaign={campaign}
          accessToken={accessToken}
          campaignData={campaignData}
          refetch={refetchInternalCampaignData}
        />
      ) : null}
    </>
  )
}
