import { signOut, useSession } from 'next-auth/react'
import * as React from 'react'
import { useQuery } from 'react-query'
import { FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import cls from 'classnames'
import { TwitchPrompt } from '~/components/primitives/Twitch'
import Link from 'next/link'
import SoundUpload from '~/components/primitives/SoundUpload'
import Banner from '~/components/primitives/Banner'
import useRestrictedRoute from '~/components/hooks/useRestrictRoute'

export default function Index() {
  useRestrictedRoute()
  const session = useSession() as any
  const accessToken = (session?.data as any)?.accessToken
  const { data: membershipData, isFetched } = useQuery(['patreon', 'memberships'], {
    enabled: !!accessToken,
    queryFn: async () => {
      try {
        const result = await fetch(`/api/patreon/memberships`, {
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
  const { data: internalCampaigns, refetch: refetchInternal } = useQuery(['internal', 'campaigns'], {
    enabled: isFetched,
    queryFn: async () => {
      try {
        const result = await fetch(
          `/api/internal/campaigns?ids=${membershipData?.memberships?.map((m) => m.campaign.id).join(',')}`
        )
          .then((r) => r.json())
          .then((d) => ({ campaigns: new Map(d.campaigns.map((c) => [c.patreonCampaignId, c])) }))
        return result
      } catch (e) {
        return { error: e.toString(), campaigns: undefined }
      }
    },
  })
  return (
    <>
      <Banner iconCount={8} className="grid-cols-8 md:grid-cols-8 h-36">
        <h1 className="text-6xl font-bold font-badscript px-4 sm:px-28">Patron</h1>
      </Banner>
      <div className="py-5 max-w-3xl mx-auto flex flex-col gap-2 w-full">
        <Link href="/creator">
          <a className="bg-yellow-200 text-yellow-700 text-center px-3 py-2 text-sm">
            Are you a creator? Swap to the creator view here →
          </a>
        </Link>
        <TwitchPrompt />
        <h2 className="text-3xl text-center mb-5">Campaigns</h2>
        <div className="flex flex-col gap-5">
          {membershipData?.memberships?.length === 0 ? <div>No campaigns found!</div> : null}
          {membershipData?.memberships?.map((m) => {
            const internalCampaign = internalCampaigns?.campaigns?.get(m.campaign.id) as any
            const userSound = internalCampaign?.sounds[membershipData.user.id]
            const existingSound = userSound ? `https://files.mael-cdn.com${userSound.sound}` : undefined
            return (
              <div
                key={m.id}
                className={cls('flex flex-col gap-2 items-center bg-gray-200 py-5 px-2 rounded-md shadow-md', {
                  'opacity-60 pointer-events-none': !internalCampaign,
                })}
              >
                <div key={m.id} className="flex flex-row gap-2 items-center">
                  <img
                    src={m.campaign.image_small_url || m.campaign.creator.thumb_url}
                    className="w-10 aspect-square rounded-full"
                  />
                  <div className="font-bold">{m.campaign.creator.full_name}</div>
                  <div>{m.campaign.creation_name}</div>
                  <div>
                    {internalCampaigns?.campaigns === undefined ? (
                      <FaSpinner className="animate animate-spin" />
                    ) : internalCampaigns.campaigns?.has(m.campaign.id) ? (
                      <FaCheckCircle className="text-green-600" />
                    ) : (
                      <FaTimesCircle className="text-red-600" />
                    )}
                  </div>
                </div>
                {internalCampaign ? (
                  <div>
                    <SoundUpload
                      campaignId={m.campaign.id}
                      patronId={membershipData.user.id}
                      existingSound={existingSound}
                      refetch={refetchInternal}
                    />
                    {userSound?.isApproved ? 'Approved' : userSound?.isRejected ? 'Rejected' : 'Pending'}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
