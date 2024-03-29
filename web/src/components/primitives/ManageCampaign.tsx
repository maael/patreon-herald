import classNames from 'classnames'
import { useEffect, useMemo, useState } from 'react'
import { FaCheck, FaCheckCircle, FaSave, FaSpinner, FaTimes, FaTimesCircle, FaTrash } from 'react-icons/fa'
import { useMutation, useQuery } from 'react-query'
import { toast } from 'react-hot-toast'
import { v4 as uuid } from 'uuid'
import SoundUpload from './SoundUpload'
import { PatreonUserLabel } from './PlatformUserLabel'
import TwitchUserSearch from './TwitchUserSearch'
import useScrollToIdOnLoad from '../hooks/useScrollToIdOnLoad'
import { useRouter } from 'next/router'

export default function ManageCampaign({
  campaign,
  accessToken,
  campaignData,
  internalCampaign,
  refetch,
}: {
  internalCampaign: any
  campaign: any
  campaignData: any
  accessToken?: string
  refetch: () => void
}) {
  const [tier, setTier] = useState(() => internalCampaign?.entitledCriteria?.tierId)
  useEffect(() => {
    setTier(internalCampaign?.entitledCriteria?.tierId)
  }, [internalCampaign?.entitledCriteria?.tierId])

  const { data: membersData } = useQuery(['patreon', 'creator', 'members', campaign?.id], {
    enabled: !!accessToken && !!campaign?.id,
    queryFn: async () => {
      try {
        const result = await fetch(`/api/patreon/members/${campaign?.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then((r) => r.json())
        return result
      } catch (e) {
        return { error: e.toString(), accessToken }
      }
    },
  })
  const [isSaving, setIsSaving] = useState(false)
  const rewardIds = new Set(campaign?.relationships?.rewards?.data?.map((r) => r.id))
  const rewards = campaignData?.included?.filter(
    (i) => i.type === 'reward' && rewardIds.has(i.id) && i.attributes.published
  )

  const filteredMembersData = useMemo<any[]>(() => {
    const tierReward = rewards?.find((r) => r.id === tier)
    return (internalCampaign?.customUsers || [])
      .filter((u) => !u.user.twitch)
      .concat(
        (internalCampaign?.customUsers || [])
          .filter((u) => u.user.twitch)
          .sort((a, b) =>
            a.user.twitch.displayName.toLowerCase().localeCompare(b.user.twitch.displayName.toLowerCase())
          )
      )
      .concat(
        membersData
          ?.filter((m) => m.tiers.some((t) => t.amount_cents >= tierReward?.attributes?.amount_cents))
          .sort((a, b) => a.user.full_name.toLowerCase().localeCompare(b.user.full_name.toLowerCase()))
      )
      .filter(Boolean)
  }, [membersData, rewards, tier, internalCampaign?.customUsers])

  const campaignSounds = useMemo(() => {
    return new Map(Object.entries(internalCampaign?.sounds || {}))
  }, [internalCampaign?.sounds])

  const { mutate: addUser, isLoading: isAddingUser } = useMutation({
    mutationKey: ['new-custom-user', internalCampaign?._id],
    mutationFn: async () => {
      const newId = `custom-${uuid()}`
      try {
        const result = await fetch(`/api/internal/campaign/${internalCampaign?._id}/user/${newId}`, {
          method: 'POST',
        }).then((r) => r.json())
        await refetch()
        return result
      } catch (e) {
        return { error: e.toString(), accessToken }
      }
    },
    onError: () => {
      toast.error('Something went wrong, please try again')
    },
    onSuccess: () => {
      toast.success('Added custom user!')
    },
  })

  const { mutate: deleteUser, isLoading: isDeletingUser } = useMutation<unknown, unknown, string>({
    mutationKey: ['delete-custom-user', internalCampaign?._id],
    mutationFn: async (userId) => {
      try {
        const result = await fetch(`/api/internal/campaign/${internalCampaign?._id}/user/${userId}`, {
          method: 'DELETE',
        }).then((r) => r.json())
        await refetch()
        return result
      } catch (e) {
        return { error: e.toString(), accessToken }
      }
    },
    onError: () => {
      toast.error('Something went wrong, please try again')
    },
    onSuccess: () => {
      toast.success('Deleted custom user!')
    },
  })

  const { membersForReview, otherMembers } = useMemo(() => {
    return filteredMembersData.reduce(
      (acc, member) => {
        const sound = campaignSounds.get(member.user.id) as any
        const isForReview = sound !== undefined && !sound.isApproved && !sound.isRejected
        acc[isForReview ? 'membersForReview' : 'otherMembers'].push(member)
        return acc
      },
      {
        membersForReview: [],
        otherMembers: [],
      }
    )
  }, [campaignSounds, filteredMembersData])

  useScrollToIdOnLoad(otherMembers.length > 0)

  return (
    <div className="flex flex-col gap-2 justify-center items-center bg-white border-gray-200 border-l border-r border-b rounded-b-lg mx-2 md:mx-5 relative -top-2 px-5 pt-5 pb-4 drop-shadow-lg">
      <div className="flex flex-row gap-1 justify-between items-center w-full">
        <div className="flex flex-row gap-1 justify-center items-center">
          <span className="font-bold">Status:</span>
          {internalCampaign?.isActive ? (
            <FaCheckCircle className="text-green-600" />
          ) : (
            <FaTimesCircle className="text-red-600" />
          )}
        </div>
        <form
          className="flex flex-row gap-2 justify-between items-center"
          onSubmit={async (e) => {
            e.preventDefault()
            try {
              setIsSaving(true)
              const selected = e.currentTarget.querySelector('select')?.value
              const selectedReward = rewards.find((r) => r.id === selected)
              console.info({ selectedReward })
              const payload = {
                entitledCriteria: {
                  criteriaType: 'currently_entitled',
                  amountCents: selectedReward.attributes.amount_cents,
                  tierId: selected,
                },
              }
              await fetch(`/api/internal/campaign/${internalCampaign._id}`, {
                headers: {
                  'Content-Type': 'application/json',
                },
                method: 'PATCH',
                body: JSON.stringify(payload),
              })
              toast.success('Saved')
            } catch (e) {
              toast.error('Error, please try again')
              console.error('[error]', e)
            } finally {
              setIsSaving(false)
            }
          }}
        >
          <div>
            <span className="font-bold">Starting Tier:</span>
            <select value={tier} onChange={(e) => setTier(e.target.value)}>
              {rewards.map((reward) => {
                return (
                  <option key={reward.id} value={reward.id}>
                    {[
                      reward.attributes.title,
                      new Intl.NumberFormat('en-GB', {
                        style: 'currency',
                        currency: reward.attributes.patron_currency,
                      }).format(reward.attributes.patron_amount_cents / 100),
                    ]
                      .filter(Boolean)
                      .join(' - ')}
                  </option>
                )
              })}
            </select>
          </div>
          <button type="submit" className="gap-2">
            {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />}
            Save
          </button>
        </form>
      </div>
      <div>
        <button onClick={() => addUser()} disabled={isAddingUser}>
          {isAddingUser ? <FaSpinner className="animate animate-spin" /> : 'Add custom user'}
        </button>
      </div>
      <h2 className="font-bold">
        {filteredMembersData?.length || 0} Pledge{filteredMembersData?.length === 1 ? '' : 's'}
      </h2>
      <div className="flex flex-col gap-2 w-full">
        {membersForReview?.length > 0 ? (
          <>
            <h3 className="font-bold text-center">
              {membersForReview?.length || 0} pledge{membersForReview?.length === 1 ? '' : 's'} for review
            </h3>
            {membersForReview?.map((pledge) => {
              return (
                <MemberItem
                  key={pledge.user.id}
                  campaignSounds={campaignSounds}
                  pledge={pledge}
                  deleteUser={deleteUser}
                  isDeletingUser={isDeletingUser}
                  internalCampaign={internalCampaign}
                  refetch={refetch}
                />
              )
            })}
            <h3 className="font-bold text-center">
              {otherMembers?.length || 0} {membersForReview?.length > 0 ? 'other' : ''} pledge
              {otherMembers?.length === 1 ? '' : 's'}
            </h3>
          </>
        ) : null}
        {otherMembers?.map((pledge) => {
          return (
            <MemberItem
              key={pledge.user.id}
              campaignSounds={campaignSounds}
              pledge={pledge}
              deleteUser={deleteUser}
              isDeletingUser={isDeletingUser}
              internalCampaign={internalCampaign}
              refetch={refetch}
            />
          )
        })}
      </div>
    </div>
  )
}

function MemberItem({
  campaignSounds,
  pledge,
  deleteUser,
  isDeletingUser,
  internalCampaign,
  refetch,
}: {
  campaignSounds: Map<string, any>
  pledge: any
  deleteUser: (id: string) => void
  isDeletingUser: boolean
  internalCampaign?: any
  refetch: () => void
}) {
  const { query } = useRouter()
  const sound = campaignSounds.get(pledge.user.id) as any
  const entitledTiers = (pledge?.tiers || []).map((t) => t.title).join(', ')
  const highlighted = query?.p === pledge?.user?.id
  return (
    <div
      id={`pledge-${pledge?.user.id}`}
      className={classNames('flex flex-col gap-2 items-center w-full pt-4 pl-4 pr-4 pb-2 rounded-lg border', {
        'bg-green-100 border-green-200': sound?.isApproved,
        'bg-red-100 border-red-200': sound?.isRejected,
        'bg-gray-100 border-gray-300': !sound?.isApproved && !sound?.isRejected,
        'ring-2 ring-offset-2 ring-yellow-400': highlighted,
      })}
    >
      <div className="flex md:flex-row flex-col justify-center items-center gap-2 w-full">
        <div className="flex-1 flex items-center gap-3 md:gap-2 mb-2 flex-col md:flex-row w-full md:w-auto relative">
          <PatreonUserLabel image={pledge.user.thumb_url} name={pledge.user.full_name} />
          <TwitchUserSearch
            patreonId={pledge.user.id}
            existing={
              pledge.user.twitch
                ? {
                    username: pledge.user.twitch.username,
                    image: pledge.user.twitch.image,
                    label: pledge.user.twitch.displayName,
                    value: pledge.user.twitch.id,
                  }
                : undefined
            }
          />
          <div className="flex-1"></div>
          {pledge.user.id.startsWith('custom-') ? (
            <button
              className="py-2 px-3 text-xs bg-red-600 absolute top-0 right-0"
              title="Delete custom user"
              onClick={() => deleteUser(pledge.user.id)}
              disabled={isDeletingUser}
            >
              {isDeletingUser ? <FaSpinner className="animate animate-spin" /> : <FaTrash />}
            </button>
          ) : null}
        </div>
        {entitledTiers ? (
          <div>
            <span className="font-bold">Entitled Tiers:</span> {entitledTiers}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center gap-2 w-full">
        <div className="flex flex-row justify-center md:justify-start items-center gap-2 w-full">
          {sound ? (
            <>
              <div>
                <button
                  className={classNames('bg-green-600', { 'bg-opacity-50': sound?.isRejected })}
                  onClick={async () => {
                    try {
                      await fetch(
                        `/api/internal/campaign/${internalCampaign?.patreonCampaignId}/${pledge?.user?.id}/approve`,
                        {
                          method: 'PATCH',
                        }
                      )
                      toast.success('Approved')
                      refetch()
                    } catch (e) {
                      console.error('[approve:error]', e)
                      toast.error('Error, please try again')
                    }
                  }}
                >
                  <FaCheck />
                  {sound?.isApproved ? 'Approved' : 'Approve'}
                </button>
              </div>
              <div>
                <button
                  className={classNames('bg-red-600', { 'bg-opacity-50': sound?.isApproved })}
                  onClick={async () => {
                    try {
                      await fetch(
                        `/api/internal/campaign/${internalCampaign?.patreonCampaignId}/${pledge?.user?.id}/approve`,
                        {
                          method: 'DELETE',
                        }
                      )
                      refetch()
                      toast.success('Rejected')
                    } catch (e) {
                      console.error('[reject:error]', e)
                      toast.error('Error, please try again')
                    }
                  }}
                >
                  <FaTimes />
                  {sound?.isRejected ? 'Rejected' : 'Reject'}
                </button>
              </div>
            </>
          ) : null}
        </div>
        <SoundUpload
          campaignId={internalCampaign?.patreonCampaignId}
          patronId={pledge?.user?.id}
          existingSound={sound?.sound ? `https://files.mael-cdn.com${sound.sound}` : undefined}
          existingVolume={sound?.volume}
          autoApprove
          refetch={refetch}
        />
      </div>
    </div>
  )
}
