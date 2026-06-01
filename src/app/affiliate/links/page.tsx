import { supabaseAdmin } from '@/lib/supabase'
import { getAffiliateSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LinkGenerator from './_components/LinkGenerator'

export const dynamic = 'force-dynamic'

export default async function AffiliateLinksPage() {
  const affiliate = await getAffiliateSession()
  if (!affiliate) redirect('/affiliate/login')

  const [{ data: offers }, { data: myLinks }] = await Promise.all([
    supabaseAdmin.from('offers').select('*').eq('is_active', true).order('created_at', { ascending: false }),
    supabaseAdmin.from('affiliate_links').select('*').eq('affiliate_id', affiliate.id),
  ])

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">リンク取得</h1>
      <LinkGenerator
        offers={offers || []}
        myLinks={myLinks || []}
        affiliateId={affiliate.id}
      />
    </div>
  )
}
