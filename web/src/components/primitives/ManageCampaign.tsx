import classNames from 'classnames'
import { FaCheckCircle, FaSave, FaTimesCircle } from 'react-icons/fa'
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
    <div className="flex flex-col gap-2 justify-center items-center bg-white border-gray-200 border-l border-r border-b rounded-b-lg mx-5 relative -top-2 px-5 pt-5 pb-4 drop-shadow-lg">
      <div className="flex flex-row gap-1 justify-between items-center w-full">
        <div className="flex flex-row gap-1 justify-center items-center">
          <span className="font-bold">Status:</span>
          {internalCampaign?.isActive ? (
            <FaCheckCircle className="text-green-600" />
          ) : (
            <FaTimesCircle className="text-red-600" />
          )}
        </div>
        <div>
          <span className="font-bold">Starting Tier:</span>
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
        <button className="gap-2">
          <FaSave />
          Save
        </button>
      </div>
      <h2 className="font-bold">
        {membersData?.length || 0} Pledge{membersData?.length === 1 ? '' : 's'}
      </h2>
      <div className="flex flex-col gap-2 w-full">
        {membersData?.map((pledge) => {
          const sound = campaignSounds.get(pledge.user.id) as any
          return (
            <div
              key={pledge.user.id}
              className={classNames('flex flex-col gap-2 items-center w-full pt-4 pl-4 pr-4 pb-2 rounded-lg border', {
                'bg-green-100 border-green-200': sound?.isApproved,
                'bg-red-100 border-red-200': sound?.isRejected,
                'bg-gray-100 border-gray-300': !sound?.isApproved && !sound?.isRejected,
              })}
            >
              <div className="flex flex-row justify-center items-center gap-2 w-full">
                <img src={pledge.user.thumb_url} className="w-8 aspect-square rounded-full" />
                <div className="flex-1 font-bold">{pledge.user.full_name}</div>
                <div>
                  <span className="font-bold">Tier:</span> {pledge.tiers.map((t) => t.title).join(', ')}
                </div>
              </div>
              <div className="flex flex-row justify-between items-center gap-2 w-full">
                <div>
                  <button
                    className={classNames('bg-green-600', { 'bg-opacity-50': sound?.isRejected })}
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
                    className={classNames('bg-red-600', { 'bg-opacity-50': sound?.isApproved })}
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
            </div>
          )
        })}
      </div>
    </div>
  )
}
