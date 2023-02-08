import { useQuery } from 'react-query'

export default function ManageCampaign({
  campaign,
  accessToken,
  campaignData,
  internalCampaign,
}: {
  internalCampaign: any
  campaign: any
  campaignData: any
  accessToken?: string
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
  const campaignSounds = new Map(internalCampaign?.sounds.map((s) => [s.patreonId, s]))
  return (
    <div className="flex flex-col gap-2 justify-center items-center">
      <h1>Management</h1>
      <div className="flex flex-col gap-1 justify-center items-center">
        <div>Status: {internalCampaign?.isActive ? 'Y' : 'N'}</div>
        <button>Disable</button>
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
      <pre>{JSON.stringify(internalCampaign, undefined, 2)}</pre>
      {membersData?.map((pledge) => {
        const sound = campaignSounds.get(pledge.user.id)
        return (
          <div key={pledge.user.id} className="flex flex-row gap-2 items-center">
            <img src={pledge.user.thumb_url} className="w-8 aspect-square rounded-full" />
            <div>{pledge.user.full_name}</div>
            <div>{pledge.tiers.map((t) => t.title).join(', ')}</div>
            <div>{sound ? 'Has sound!' : 'No sound yet!'}</div>
            <div>
              <button>Approve</button>
            </div>
            <div>
              <button>Reject</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
