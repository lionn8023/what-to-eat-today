import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

export async function fetchHistory(userId, limit = 50) {
  if (!isSupabaseConfigured || !userId) return []
  const { data, error } = await supabase
    .from('draw_history')
    .select('*')
    .eq('user_id', userId)
    .order('drawn_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('[history] fetch failed', error)
    return []
  }
  return data || []
}

export async function addHistory(userId, shop) {
  if (!isSupabaseConfigured || !userId) return null
  const { data, error } = await supabase
    .from('draw_history')
    .insert({
      user_id: userId,
      shop_id: shop.id,
      shop_name: shop.name,
      category: shop.type || '',
    })
    .select()
    .single()
  if (error) {
    console.error('[history] add failed', error)
    return null
  }
  return data
}
