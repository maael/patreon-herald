/* eslint-disable @next/next/no-img-element */
import * as React from 'react'
import { signOut, useSession } from 'next-auth/react'
import { SiObsstudio } from 'react-icons/si'
import { useQuery } from 'react-query'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import ManageCampaign from '~/components/primitives/ManageCampaign'
import { TwitchPrompt } from '~/components/primitives/Twitch'
import Link from 'next/link'
import Banner from '~/components/primitives/Banner'
import useRestrictedRoute from '~/components/hooks/useRestrictRoute'
import {
  FaCheck,
  FaChevronCircleDown,
  FaChevronCircleUp,
  FaCogs,
  FaCopy,
  FaPlus,
  FaRedoAlt,
  FaTimes,
} from 'react-icons/fa'
import useCopyToClipboard from '~/components/hooks/useCopyToClipboard'
import { ListEditor, useListConfig } from '~/components/primitives/ListEditor'

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
  const { query } = useRouter()
  React.useEffect(() => {
    if (query?.c) setManaging(query.c.toString())
  }, [query])
  React.useEffect(() => {
    if (campaignData?.data && campaignData?.data.length === 1) {
      const campaign = campaignData?.data[0]
      setManaging(campaign.id)
    }
  }, [campaignData?.data])
  return (
    <>
      <Banner>
        <h1 className="text-6xl font-bold font-badscript px-4 sm:px-20">Creator</h1>
      </Banner>
      <div className="max-w-3xl flex flex-col gap-2 mx-auto px-2 pt-5 pb-10 w-full">
        <Link href="/patron">
          <a className="bg-yellow-200 text-yellow-800 text-center px-3 py-2 text-sm drop-shadow-md rounded-md hover:scale-105 transition-transform">
            Looking for the Patron view? Swap to the patron view here →
          </a>
        </Link>
        <TwitchPrompt />
        <h2 className="text-center text-4xl mt-3 mb-2">Manage your campaigns</h2>
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
        {campaignData?.data && campaignData?.data.length === 0 ? (
          <div className="text-2xl text-center">No campaigns to see here</div>
        ) : null}
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
  const twitchUserName = (session?.data as any)?.twitch?.username
  const [editingList, setEditingList] = React.useState(false)
  const [listConfig, setListConfig] = useListConfig()
  const soundObsUrl = `https://patreon-herald.mael.tech/obs/alert/${twitchUserName}/${campaign.id}`
  const listObsUrl = `https://patreon-herald.mael.tech/obs/patreon/${twitchUserName}/${
    campaign.id
  }?${new URLSearchParams(listConfig)}`
  const [copiedSound, copySound] = useCopyToClipboard(soundObsUrl)
  const [copiedList, copyList] = useCopyToClipboard(listObsUrl)
  const isActive = internalCampaignData?.data?.has(campaign.id)
  const internalCampaign = internalCampaignData?.data?.get(campaign.id)
  return (
    <>
      <div className="bg-white w-full drop-shadow-lg rounded-lg relative mt-12 border border-grey-300 p-4 flex flex-col gap-2 z-50">
        <img
          src={campaign.attributes.avatar_photo_url}
          className="rounded-full border-2 border-grey-300 bg-white w-20 h-20 absolute -top-12 left-1/2 -translate-x-1/2 drop-shadow-lg"
        />
        {isActive ? (
          <div className="absolute top-4 right-4 text-sm flex flex-row gap-2 flex-nowrap justify-center items-center">
            <button
              className="bg-yellow-400 px-3 py-1 group h-8 hover:bg-yellow-500 transition-all"
              onClick={async () => {
                try {
                  const result = await fetch(`/api/internal/webhooks/${internalCampaign?._id}`, {
                    method: 'PUT',
                    headers: { Authorization: `Bearer ${accessToken}` },
                  })
                  if (!result.ok) throw new Error('Unexpected error')
                  toast.success('Refreshed webhooks')
                } catch (e) {
                  toast.error('Error, please try again')
                }
              }}
            >
              <FaRedoAlt />
              <span className="hidden group-hover:block">Refresh Webhooks</span>
            </button>
            <button
              className="bg-red-600 px-3 py-1 group h-8 hover:bg-red-700 transition-all"
              onClick={() => {
                try {
                  toast.success('Disabled campaign')
                } catch (e) {
                  toast.error('Error, please try again')
                }
              }}
            >
              <FaTimes />
              <span className="hidden group-hover:block">Disable</span>
            </button>
          </div>
        ) : null}
        <div>
          <h2 className="text-bold text-2xl">{campaign.attributes.name}</h2>
          <h3>{campaign.attributes.creation_name}</h3>
        </div>
        <div className="w-full flex flex-row justify-between items-center gap-2">
          {isActive ? (
            <>
              <div className="flex-1">
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
              </div>
              <div className="flex flow-row flex-nowrap drop-shadow">
                <div className="bg-orange-400 rounded-l-md text-white flex justify-center items-center px-3 gap-2">
                  <SiObsstudio /> {twitchUserName ? 'OBS List Overlay' : 'Connect Twitch Account for overlays'}
                </div>
                {twitchUserName ? (
                  <>
                    <button
                      className="bg-black text-white flex justify-center items-center px-3 rounded-none border-r border-orange-400"
                      style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                      onClick={() => copyList()}
                    >
                      {copiedList ? <FaCheck /> : <FaCopy />}
                    </button>{' '}
                    <button
                      className="bg-black text-white flex justify-center items-center px-3 border-l border-orange-400"
                      style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                      onClick={() => setEditingList((e) => !e)}
                    >
                      <FaCogs />
                    </button>
                  </>
                ) : null}
              </div>
              <div className="flex flow-row flex-nowrap drop-shadow">
                <div className="bg-orange-400 rounded-l-md text-white flex justify-center items-center px-3 gap-2">
                  <SiObsstudio /> {twitchUserName ? 'OBS Sound Overlay' : 'Connect Twitch Account for overlays'}
                </div>
                {twitchUserName ? (
                  <button
                    className="bg-black text-white flex justify-center items-center px-3"
                    style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                    onClick={() => copySound()}
                  >
                    {copiedSound ? <FaCheck /> : <FaCopy />}
                  </button>
                ) : null}
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
                toast.success('Enabled campaign')
              }}
              className="bg-green-600 mx-auto text-xl"
            >
              <FaPlus /> Enable
            </button>
          )}
        </div>

        {editingList ? (
          <ListEditor
            config={listConfig}
            setConfig={setListConfig}
            twitch={twitchUserName}
            patreonCampaignId={campaign.id}
          />
        ) : null}
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
