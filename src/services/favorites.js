import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

export async function fetchFavorites(userId) {
  if (!isSupabaseConfigured || !userId) return []
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[favorites] fetch failed', error)
    return []
  }
  return data || []
}

export async function addFavorite(userId, shop) {
  if (!isSupabaseConfigured || !userId) return null
  const { data, error } = await supabase
    .from('favorites')
    .insert({
      user_id: userId,
      shop_id: shop.id,
      shop_name: shop.name,
      shop_address: shop.address || '',
      shop_lng: shop.location?.lng ?? null,
      shop_lat: shop.location?.lat ?? null,
      category: shop.type || '',
    })
    .select()
    .single()
  if (error) {
    console.error('[favorites] add failed', error)
    return null
  }
  return data
}

export async function removeFavoriteById(rowId) {
  if (!isSupabaseConfigured || !rowId) return false
  const { error } = await supabase.from('favorites').delete().eq('id', rowId)
  if (error) {
    console.error('[favorites] remove failed', error)
    return false
  }
  return true
}
