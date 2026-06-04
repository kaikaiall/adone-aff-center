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

  // 特別単価を取得（テーブル未存在・エラー時は空配列でフォールバック）
  let myRates: { offer_id: string; custom_optin_price: number }[] = []
  try {
    const { data: ratesData, error } = await supabaseAdmin
      .from('affiliate_offer_rates')
      .select('offer_id, custom_optin_price')
      .eq('affiliate_id', affiliate.id)
      .eq('is_active', true)
    if (error) {
      console.warn('[links] affiliate_offer_rates lookup error:', error.message)
    } else {
      myRates = ratesData || []
    }
  } catch (err) {
    console.warn('[links] Unexpected error in affiliate_offer_rates lookup:', err)
  }

  // offers に effective_price と is_special_rate を付与
  const offersWithRate = (offers || []).map((offer: any) => {
    const specialRate = myRates.find(r => r.offer_id === offer.id)
    return {
      ...offer,
      effective_price: specialRate ? specialRate.custom_optin_price : offer.optin_price,
      is_special_rate: !!specialRate,
    }
  })

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">リンク取得</h1>
      <LinkGenerator
        offers={offersWithRate}
        myLinks={myLinks || []}
        affiliateId={affiliate.id}
      />
    </div>
  )
}
