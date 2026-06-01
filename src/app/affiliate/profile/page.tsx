import { getAffiliateSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ProfileForm from './_components/ProfileForm'

export const dynamic = 'force-dynamic'

export default async function AffiliateProfilePage() {
  const affiliate = await getAffiliateSession()
  if (!affiliate) redirect('/affiliate/login')

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">プロフィール・口座情報</h1>
      <ProfileForm affiliate={affiliate} />
    </div>
  )
}
