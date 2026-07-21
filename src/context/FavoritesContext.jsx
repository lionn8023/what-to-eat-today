import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext.jsx'
import { fetchFavorites, addFavorite, removeFavoriteById } from '../services/favorites.js'

const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!user) {
      setFavorites([])
      return
    }
    setLoading(true)
    const data = await fetchFavorites(user.id)
    setFavorites(data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const isFavorite = useCallback(
    (shopId) => favorites.some((f) => f.shop_id === shopId),
    [favorites]
  )

  // 切换收藏：已收藏则取消，未收藏则新增
  const toggleFavorite = useCallback(
    async (shop) => {
      if (!user) return
      const existing = favorites.find((f) => f.shop_id === shop.id)
      if (existing) {
        const ok = await removeFavoriteById(existing.id)
        if (ok) setFavorites((prev) => prev.filter((f) => f.id !== existing.id))
      } else {
        const row = await addFavorite(user.id, shop)
        if (row) setFavorites((prev) => [row, ...prev])
      }
    },
    [favorites, user]
  )

  return (
    <FavoritesContext.Provider
      value={{ favorites, loading, isFavorite, toggleFavorite, reload: load }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites 必须在 FavoritesProvider 内部使用')
  return ctx
}
