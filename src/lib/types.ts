// ===== 型定義 =====

export type ConversionStatus = 'pending' | 'approved' | 'rejected' | 'deleted'

export interface Affiliate {
  id: string
  name: string
  email: string
  password_hash: string
  phone: string | null
  bank_name: string | null
  bank_branch: string | null
  bank_account_type: string | null
  bank_account_number: string | null
  bank_account_holder: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Offer {
  id: string
  name: string
  optin_price: number
  has_backend: boolean
  backend_rate: number | null
  description: string | null
  banner_url: string | null
  lp_url: string | null
  line_add_url: string | null
  appeal_points: string | null
  target_audience: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Conversion {
  id: string
  affiliate_id: string
  offer_id: string
  line_user_id: string
  display_name: string | null
  status: ConversionStatus
  amount: number
  source: string | null
  ip_address: string | null
  user_agent: string | null
  raw_payload: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface AffiliateOfferRate {
  id: string
  affiliate_id: string
  offer_id: string
  custom_optin_price: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ConversionBackend {
  id: string
  affiliate_id: string
  offer_id: string
  amount: number
  count: number
  note: string | null
  status: ConversionStatus
  created_at: string
  created_by: string
}

export interface AffiliateLink {
  id: string
  affiliate_id: string
  offer_id: string
  cid: string
  click_count: number
  created_at: string
}

export interface LinkClick {
  id: string
  cid: string
  affiliate_id: string | null
  offer_id: string | null
  ip_address: string | null
  user_agent: string | null
  cookie_id: string | null
  referer: string | null
  clicked_at: string
  matched_at: string | null
  matched_conversion_id: string | null
}

export interface LineUser {
  id: string
  line_user_id: string
  display_name: string | null
  first_seen_at: string
  last_seen_at: string
}
