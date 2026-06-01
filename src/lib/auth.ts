import { cookies } from 'next/headers'
import { supabaseAdmin } from './supabase'
import type { Affiliate } from './types'

// 管理者認証チェック
export async function getAdminSession(): Promise<boolean> {
  const cookieStore = cookies()
  return cookieStore.get('admin_auth')?.value === 'true'
}

// アフィリエイターセッション取得
export async function getAffiliateSession(): Promise<Affiliate | null> {
  const cookieStore = cookies()
  const affiliateId = cookieStore.get('affiliate_session')?.value
  if (!affiliateId) return null

  const { data, error } = await supabaseAdmin
    .from('affiliates')
    .select('*')
    .eq('id', affiliateId)
    .single()

  if (error || !data) return null
  return data as Affiliate
}
