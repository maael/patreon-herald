import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import { useQuery } from 'react-query'
import SoundUpload from './SoundUpload'

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
  const rewardIds = new Set(campaign?.relationships?.rewards?.data?.map((r) => r.id))
  const campaignSounds = new Map(Object.entries(internalCampaign?.sounds || {}))
  return (
    <div className="flex flex-col gap-2 justify-center items-center">
      <div className="flex flex-col gap-1 justify-center items-center">
        <div className="flex flex-row gap-1 justify-center items-center">
          Status:{' '}
          {internalCampaign?.isActive ? (
            <FaCheckCircle className="text-green-600" />
          ) : (
            <FaTimesCircle className="text-red-600" />
          )}
        </div>
        <div>
          Starting Tier:
          <select>
            {campaignData?.included
              ?.filter((i) => i.type === 'reward' && rewardIds.has(i.id) && i.attributes.published)
              .map((reward) => {
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
        <button>Save</button>
      </div>
      <h2>
        {membersData?.length || 0} Pledge{membersData?.length === 1 ? '' : 's'}
      </h2>
      {membersData?.map((pledge) => {
        const sound = campaignSounds.get(pledge.user.id) as any
        return (
          <div key={pledge.user.id} className="flex flex-row gap-2 items-center">
            <img src={pledge.user.thumb_url} className="w-8 aspect-square rounded-full" />
            <div>{pledge.user.full_name}</div>
            <div>{pledge.tiers.map((t) => t.title).join(', ')}</div>
            <div>
              <button
                onClick={async () => {
                  await fetch(
                    `/api/internal/campaign/${internalCampaign?.patreonCampaignId}/${pledge?.user?.id}/approve`,
                    {
                      method: 'PATCH',
                    }
                  )
                  refetch()
                }}
              >
                {sound?.isApproved ? 'Approved' : 'Approve'}
              </button>
            </div>
            <div>
              <button
                onClick={async () => {
                  await fetch(
                    `/api/internal/campaign/${internalCampaign?.patreonCampaignId}/${pledge?.user?.id}/approve`,
                    {
                      method: 'DELETE',
                    }
                  )
                  refetch()
                }}
              >
                {sound?.isRejected ? 'Rejected' : 'Reject'}
              </button>
            </div>
            <SoundUpload
              campaignId={internalCampaign?.patreonCampaignId}
              patronId={pledge?.user?.id}
              existingSound={sound?.sound ? `https://files.mael-cdn.com${sound.sound}` : undefined}
              autoApprove
              refetch={refetch}
            />
          </div>
        )
      })}
    </div>
  )
}
