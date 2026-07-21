import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useFavorites } from '../context/FavoritesContext.jsx'
import { fetchHistory } from '../services/history.js'
import styles from './FavoritesDrawer.module.css'

export default function FavoritesDrawer({ open, onClose, onSelectShop }) {
  const { user } = useAuth()
  const { favorites, toggleFavorite } = useFavorites()
  const [history, setHistory] = useState([])
  const [tab, setTab] = useState('favorites')

  useEffect(() => {
    if (open && user) {
      fetchHistory(user.id).then(setHistory)
    }
  }, [open, user])

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          ×
        </button>
        <h2 className={styles.title}>我的美食库</h2>

        <div className={styles.tabs}>
          <button
            className={tab === 'favorites' ? styles.tabActive : styles.tab}
            onClick={() => setTab('favorites')}
          >
            收藏 {favorites.length}
          </button>
          <button
            className={tab === 'history' ? styles.tabActive : styles.tab}
            onClick={() => setTab('history')}
          >
            抽签历史 {history.length}
          </button>
        </div>

        {!user && <p className={styles.hint}>登录后可查看收藏与抽签历史</p>}

        {user && tab === 'favorites' && (
          favorites.length === 0 ? (
            <p className={styles.empty}>还没有收藏，去店铺详情点 ♥ 收藏吧</p>
          ) : (
            <ul className={styles.list}>
              {favorites.map((f) => (
                <li key={f.id} className={styles.item}>
                  <div
                    className={styles.itemInfo}
                    onClick={() =>
                      onSelectShop({
                        id: f.shop_id,
                        name: f.shop_name,
                        address: f.shop_address,
                        location: { lng: f.shop_lng, lat: f.shop_lat },
                      })
                    }
                  >
                    <h3 className={styles.itemName}>{f.shop_name}</h3>
                    <p className={styles.itemAddr}>{f.shop_address || '暂无地址'}</p>
                  </div>
                  <button
                    className={styles.unfav}
                    onClick={() => toggleFavorite({ id: f.shop_id })}
                    title="取消收藏"
                  >
                    ♥
                  </button>
                </li>
              ))}
            </ul>
          )
        )}

        {user && tab === 'history' && (
          history.length === 0 ? (
            <p className={styles.empty}>还没有抽签记录，去转一下大转盘吧</p>
          ) : (
            <ul className={styles.list}>
              {history.map((h) => (
                <li
                  key={h.id}
                  className={styles.item}
                  onClick={() =>
                    onSelectShop({
                      id: h.shop_id,
                      name: h.shop_name,
                      address: h.shop_address,
                      location: { lng: h.shop_lng, lat: h.shop_lat },
                    })
                  }
                >
                  <div className={styles.itemInfo}>
                    <h3 className={styles.itemName}>{h.shop_name}</h3>
                    <p className={styles.itemTime}>
                      {new Date(h.drawn_at).toLocaleString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  )
}
