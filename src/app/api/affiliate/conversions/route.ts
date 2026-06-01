import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = cookies()
    const affiliateId = cookieStore.get('affiliate_session')?.value
    if (!affiliateId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from('conversions')
      .select(`*, offers(id, name, optin_price)`)
      .eq('affiliate_id', affiliateId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    if (error) throw error
    return Response.json(data)
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
