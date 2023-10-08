/* eslint-disable @next/next/no-img-element */
import { signOut, useSession } from 'next-auth/react'
import * as React from 'react'
import { useQuery } from 'react-query'
import { FaSpinner, FaCheckCircle, FaTimesCircle, FaCheck, FaTimes } from 'react-icons/fa'
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
      <Banner>
        <h1 className="text-6xl font-bold font-badscript px-4 sm:px-28">Patron</h1>
      </Banner>
      <div className="py-5 max-w-3xl mx-auto flex flex-col gap-2 w-full px-2">
        <Link href="/creator">
          <a className="bg-yellow-200 text-yellow-800 text-center px-3 py-2 text-sm drop-shadow-md rounded-md hover:scale-105 transition-transform">
            Are you a creator? Swap to the creator view here →
          </a>
        </Link>
        <h2 className="text-3xl text-center mt-3 mb-2">Campaigns</h2>
        {!membershipData?.memberships || membershipData?.memberships.length === 0 ? (
          <div className="text-2xl text-center">No campaigns to see here!</div>
        ) : null}
        <div className="flex flex-col gap-5">
          {membershipData?.memberships?.length === 0 ? <div>No campaigns found!</div> : null}
          {membershipData?.memberships?.map((m) => {
            const internalCampaign = internalCampaigns?.campaigns?.get(m.campaign.id) as any
            const userSound = internalCampaign?.sounds[membershipData.user.id]
            const existingSound = userSound ? `https://files.mael-cdn.com${userSound.sound}` : undefined
            return (
              <div
                key={m.id}
                className={cls(
                  'bg-white w-full drop-shadow-lg rounded-lg relative mt-12 border border-grey-300 p-4 flex flex-col gap-2 z-50',
                  {
                    'opacity-60 pointer-events-none': !internalCampaign,
                  }
                )}
              >
                <img
                  src={m.campaign.image_small_url || m.campaign.creator.thumb_url}
                  className="rounded-full border-2 border-grey-300 bg-white w-20 h-20 absolute -top-12 left-1/2 -translate-x-1/2 drop-shadow-lg"
                />
                <div>
                  <h2 className="text-bold text-2xl flex flex-row gap-1 items-center">
                    {m?.campaign?.vanity}
                    {internalCampaigns?.campaigns === undefined ? (
                      <FaSpinner className="animate animate-spin text-sm" />
                    ) : internalCampaigns.campaigns?.has(m.campaign.id) ? (
                      <FaCheckCircle className="text-green-600 text-sm" />
                    ) : (
                      <FaTimesCircle className="text-red-600 text-sm" />
                    )}
                  </h2>
                  <h3>{m.campaign.creation_name}</h3>
                </div>
                <TwitchPrompt />
                {session?.data?.twitch && internalCampaign ? (
                  <div className="flex flex-col justify-center items-center gap-2 mt-2">
                    <SoundUpload
                      campaignId={m.campaign.id}
                      patronId={membershipData.user.id}
                      existingSound={existingSound}
                      refetch={refetchInternal}
                      hideVolume
                    />
                    <div
                      className={cls('flex flex-row gap-1 justify-center items-center', {
                        'text-green-600': userSound?.isApproved,
                        'text-red-600': userSound?.isRejected,
                        'text-gray-600': !userSound?.isApproved && !userSound?.isRejected,
                      })}
                    >
                      {userSound?.isApproved ? (
                        <>
                          <FaCheck /> Approved
                        </>
                      ) : userSound?.isRejected ? (
                        <>
                          <FaTimes /> Rejected
                        </>
                      ) : userSound ? (
                        'Pending Approval'
                      ) : (
                        'Upload your sound file!'
                      )}
                    </div>
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
