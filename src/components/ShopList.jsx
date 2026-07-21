import React from 'react'
import styles from './ShopList.module.css'
import { useAuth } from '../context/AuthContext.jsx'
import { useFavorites } from '../context/FavoritesContext.jsx'

export default function ShopList({ shops, onSpin, onSelectShop }) {
  const { user } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  if (shops.length === 0) {
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>附近美食</h2>
        <span className={styles.count}>共 {shops.length} 家</span>
      </div>

      <ul className={styles.list}>
        {shops.map((shop, index) => (
          <li
            key={shop.id || index}
            className={styles.item}
            onClick={() => onSelectShop(shop)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelectShop(shop)
              }
            }}
            role="button"
            tabIndex={0}
          >
            {user && (
              <button
                className={styles.favIcon}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(shop)
                }}
                title={isFavorite(shop.id) ? '取消收藏' : '收藏'}
                style={{ color: isFavorite(shop.id) ? 'var(--pink)' : 'var(--black)' }}
              >
                {isFavorite(shop.id) ? '♥' : '♡'}
              </button>
            )}
            <div className={styles.index}>{index + 1}</div>
            <div className={styles.info}>
              <h3 className={styles.name}>{shop.name}</h3>
              <p className={styles.address}>{shop.address || '暂无地址'}</p>
              <div className={styles.meta}>
                {shop.distance && (
                  <span className={styles.distance}>{shop.distance}米</span>
                )}
                {shop.rating && (
                  <span className={styles.rating}>★ {shop.rating}</span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <button className={styles.spinBtn} onClick={onSpin}>
        🎰 开始大转盘
      </button>
    </div>
  )
}
