import React from 'react'
import styles from './ShopDetail.module.css'
import { useAuth } from '../context/AuthContext.jsx'
import { useFavorites } from '../context/FavoritesContext.jsx'

export default function ShopDetail({ shop, onClose }) {
  const { user, isConfigured } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  if (!shop) return null

  const photos = Array.isArray(shop.photos) ? shop.photos : []
  const hasPhotos = photos.length > 0
  const fav = isFavorite(shop.id)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          ×
        </button>

        <h2 className={styles.title}>{shop.name}</h2>

        {isConfigured && (
          <button
            className={styles.favBtn}
            onClick={() => user && toggleFavorite(shop)}
            disabled={!user}
            title={user ? (fav ? '取消收藏' : '收藏这家') : '登录后可收藏'}
            style={{
              background: fav ? 'var(--pink)' : 'var(--white)',
              color: fav ? 'var(--white)' : 'var(--black)',
            }}
          >
            {fav ? '♥ 已收藏' : '♡ 收藏这家'}
          </button>
        )}

        {hasPhotos && (
          <div className={styles.photos}>
            {photos.slice(0, 3).map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`${shop.name} 图片 ${index + 1}`}
                className={styles.photo}
              />
            ))}
          </div>
        )}

        <div className={styles.infoList}>
          {shop.type && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>分类</span>
              <span className={styles.infoValue}>{shop.type}</span>
            </div>
          )}

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>地址</span>
            <span className={styles.infoValue}>{shop.address || '暂无地址'}</span>
          </div>

          {shop.tel && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>电话</span>
              <a className={styles.infoValue} href={`tel:${shop.tel}`}>
                {shop.tel}
              </a>
            </div>
          )}

          {typeof shop.distance === 'number' && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>距离</span>
              <span className={styles.infoValue}>{shop.distance} 米</span>
            </div>
          )}

          {shop.rating && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>评分</span>
              <span className={styles.infoValue}>★ {shop.rating}</span>
            </div>
          )}

          {shop.cost && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>人均</span>
              <span className={styles.infoValue}>¥{shop.cost}</span>
            </div>
          )}

          {shop.opentime && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>营业时间</span>
              <span className={styles.infoValue}>{shop.opentime}</span>
            </div>
          )}
        </div>

        {shop.location?.lng && shop.location?.lat && (
          <>
            {/* 操作按钮组 */}
            <div className={styles.actionRow}>
              <a
                className={styles.actionBtn}
                style={{ background: 'var(--blue)' }}
                href={`https://uri.amap.com/navigation?to=${shop.location.lng},${shop.location.lat}&toName=${encodeURIComponent(
                  shop.name
                )}&mode=car&src=what-to-eat-today&callnative=1`}
                target="_blank"
                rel="noreferrer"
              >
                🚗 导航到店
              </a>
              <a
                className={styles.actionBtn}
                style={{ background: 'var(--pink)' }}
                href={`https://uri.amap.com/streetview?position=${shop.location.lng},${shop.location.lat}&name=${encodeURIComponent(
                  shop.name
                )}&src=what-to-eat-today&coordinate=gaode&callnative=0`}
                target="_blank"
                rel="noreferrer"
              >
                📷 查看街景
              </a>
            </div>

            <a
              className={styles.mapBtn}
              href={`https://uri.amap.com/marker?position=${shop.location.lng},${shop.location.lat}&name=${encodeURIComponent(
                shop.name
              )}&src=what-to-eat-today&coordinate=gaode&callnative=0`}
              target="_blank"
              rel="noreferrer"
            >
              在高德地图中打开
            </a>
          </>
        )}
      </div>
    </div>
  )
}
