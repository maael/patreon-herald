import { useSession } from 'next-auth/react'
import { useQuery } from 'react-query'

export default function CreatorManage() {
  const patreons = []
  const session = useSession()
  const accessToken = (session?.data as any)?.accessToken
  const { data: campaignData } = useQuery(['creator', 'campaigns'], {
    enabled: !!accessToken,
    queryFn: async () => {
      try {
        const result = await fetch(`/api/patreon/campaigns`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then((r) => r.json())
        return result
      } catch (e) {
        return { error: e.toString(), accessToken }
      }
    },
  })
  const campaignId = (campaignData?.data || [])[0]?.id
  const { data: membersData } = useQuery(['members', campaignId], {
    enabled: !!accessToken && !!campaignId,
    queryFn: async () => {
      try {
        const result = await fetch(`/api/patreon/members/${campaignId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then((r) => r.json())
        return result
      } catch (e) {
        return { error: e.toString(), accessToken }
      }
    },
  })
  return (
    <div>
      <h1>Creator Manage</h1>
      <h2>Campaign</h2>
      <h3>{patreons.length} Patreons</h3>
      <p>{JSON.stringify({ campaignData, membersData })}</p>
    </div>
  )
}
