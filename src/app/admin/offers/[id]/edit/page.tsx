import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import OfferForm from '../../_components/OfferForm'

export const dynamic = 'force-dynamic'

export default async function EditOfferPage({ params }: { params: { id: string } }) {
  console.log('[EditOfferPage] Loading offer id:', params.id)

  // ① 修正: maybeSingle() で安全に取得（single()はエラーをthrowするため回避）
  const { data: offer, error } = await supabaseAdmin
    .from('offers')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  console.log('[EditOfferPage] Result:', { offer: offer?.id, error: error?.message })

  if (error) {
    console.error('[EditOfferPage] DB Error:', error)
    notFound()
  }
  if (!offer) {
    console.log('[EditOfferPage] Offer not found:', params.id)
    notFound()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">案件編集</h1>
      <p className="text-sm text-gray-400 mb-6">ID: {offer.id}</p>
      <OfferForm
        initialData={offer}
        offerId={offer.id}
        webhookSecret={process.env.WEBHOOK_SECRET}
      />
    </div>
  )
}
