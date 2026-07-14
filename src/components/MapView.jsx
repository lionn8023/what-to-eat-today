import React, { useEffect, useRef, useState, useCallback } from 'react'
import { loadAMap } from '../services/amap.js'
import styles from './MapView.module.css'

const DEFAULT_CENTER = [116.397428, 39.90923] // 北京天安门，仅作初始占位
const DEFAULT_ZOOM = 11
const FLY_ZOOM = 16

function escapeHtml(str = '') {
  return String(str).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  )
}

export default function MapView({ shops = [], activeShop, onSelectShop }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const amapRef = useRef(null)
  const markersRef = useRef([])
  const infoWindowRef = useRef(null)
  const onSelectShopRef = useRef(onSelectShop)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    onSelectShopRef.current = onSelectShop
  }, [onSelectShop])

  // 初始化地图（AMap 已通过 searchNearby 间接预加载，这里再 ensure 一次）
  useEffect(() => {
    let cancelled = false
    loadAMap()
      .then((AMap) => {
        if (cancelled || !containerRef.current) return
        amapRef.current = AMap
        const map = new AMap.Map(containerRef.current, {
          zoom: DEFAULT_ZOOM,
          center: DEFAULT_CENTER,
          viewMode: '2D',
        })
        mapRef.current = map
        infoWindowRef.current = new AMap.InfoWindow({
          offset: new AMap.Pixel(0, -28),
          isCustom: false,
        })
        setReady(true)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || '地图加载失败，请检查 .env.local 中的高德 Key 配置')
      })

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
      }
    }
  }, [])

  // 根据 shops 重绘 Marker
  const renderMarkers = useCallback(() => {
    const map = mapRef.current
    const AMap = amapRef.current
    if (!map || !AMap) return

    if (markersRef.current.length) {
      map.remove(markersRef.current)
      markersRef.current = []
    }

    const valid = (Array.isArray(shops) ? shops : []).filter(
      (s) => s?.location?.lng && s?.location?.lat
    )

    const markers = valid.map((shop) => {
      const marker = new AMap.Marker({
        position: [shop.location.lng, shop.location.lat],
        title: shop.name,
        anchor: 'bottom-center',
        zIndex: 100,
      })
      marker.on('click', () => onSelectShopRef.current?.(shop))
      return marker
    })

    markersRef.current = markers
    if (markers.length) {
      map.add(markers)
      map.setFitView(markers, false, [40, 40, 40, 40])
    }
  }, [shops])

  useEffect(() => {
    if (ready) renderMarkers()
  }, [ready, renderMarkers])

  // 选中某家店时：镜头平滑飞过去 + 弹信息窗
  useEffect(() => {
    const map = mapRef.current
    const AMap = amapRef.current
    const info = infoWindowRef.current
    if (!ready || !map || !AMap || !activeShop?.location?.lng) return

    const pos = [activeShop.location.lng, activeShop.location.lat]
    // 2.0 的 setZoomAndCenter 默认带过渡动画，实现「飞过去」效果
    map.setZoomAndCenter(FLY_ZOOM, pos)

    if (info) {
      const meta = [
        activeShop.rating && `★ ${activeShop.rating}`,
        activeShop.cost && `¥ ${activeShop.cost}`,
      ]
        .filter(Boolean)
        .join('　')
      info.setContent(
        `<div class="${styles.infoWin}">
          <div class="${styles.infoName}">${escapeHtml(activeShop.name)}</div>
          <div class="${styles.infoAddr}">${escapeHtml(activeShop.address || '暂无地址')}</div>
          ${meta ? `<div class="${styles.infoMeta}">${meta}</div>` : ''}
        </div>`
      )
      info.open(map, pos)
    }
  }, [ready, activeShop])

  if (error) {
    return <div className={styles.mapError}>🗺️ {error}</div>
  }

  return <div ref={containerRef} className={styles.map} />
}
