import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = cookies()
    const affiliateId = cookieStore.get('affiliate_session')?.value
    if (!affiliateId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from('affiliate_links')
      .select(`*, offers(*)`)
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return Response.json(data)
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const affiliateId = cookieStore.get('affiliate_session')?.value
    if (!affiliateId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { offer_id } = await request.json()
    if (!offer_id) return Response.json({ error: 'offer_id is required' }, { status: 400 })

    // 既存リンクチェック
    const { data: existing } = await supabaseAdmin
      .from('affiliate_links')
      .select('cid')
      .eq('affiliate_id', affiliateId)
      .eq('offer_id', offer_id)
      .maybeSingle()

    if (existing) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
      return Response.json({ cid: existing.cid, url: `${baseUrl}/r/${existing.cid}` })
    }

    // 新規 cid 生成（aff_xxx_offer_yyy 形式 + ランダム）
    const rand = Math.random().toString(36).substring(2, 8)
    const cid = `${affiliateId}_${offer_id}_${rand}`

    const { data, error } = await supabaseAdmin
      .from('affiliate_links')
      .insert({ affiliate_id: affiliateId, offer_id, cid })
      .select()
      .single()
    if (error) throw error

    // 中継ページ URL を返す（旧: CRM直リンク → 新: /r/[cid]）
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    return Response.json({ cid: data.cid, url: `${baseUrl}/r/${data.cid}` }, { status: 201 })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
