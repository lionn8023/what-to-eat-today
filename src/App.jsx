import React, { useState, useRef, useEffect, useCallback } from 'react'
import SearchPanel from './components/SearchPanel.jsx'
import ShopList from './components/ShopList.jsx'
import Wheel from './components/Wheel.jsx'
import MapView from './components/MapView.jsx'
import ShopDetail from './components/ShopDetail.jsx'
import { searchNearby } from './services/amap.js'
import styles from './App.module.css'

const STORAGE_KEY = 'wte:lastSearch'

function loadSavedSearch() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

const savedSearch = loadSavedSearch()

function App() {
  const [location, setLocation] = useState(
    savedSearch?.location || { lng: null, lat: null, address: '' }
  )
  // 美食分类 / 搜索范围每次进入页面都从默认起（全部 + 500m），
  // 不被 localStorage 覆盖；省份/城市/定位点仍按需求恢复。
  const [radius, setRadius] = useState(500)
  const [limit, setLimit] = useState(savedSearch?.limit || 20)
  const [category, setCategory] = useState('餐饮')
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [showWheel, setShowWheel] = useState(false)
  const [selectedShop, setSelectedShop] = useState(null)
  // 地图聚焦目标：转盘揭晓赢家时立刻设置（让地图飞过去），与详情弹窗独立
  const [mapFocusShop, setMapFocusShop] = useState(null)

  const didRestore = useRef(false)

  // 统一入口：选中店铺时同时更新「详情弹窗目标」和「地图聚焦目标」
  const handleSelectShop = useCallback((shop) => {
    setSelectedShop(shop)
    setMapFocusShop(shop)
  }, [])

  // 转盘揭晓回调：只让地图飞过去，不弹详情
  const handleHighlight = useCallback((shop) => {
    setMapFocusShop(shop)
  }, [])

  async function handleSearch(
    lng,
    lat,
    address,
    searchRadius,
    searchLimit,
    searchKeyword,
    searchProvince,
    searchCity
  ) {
    setLoading(true)
    setSearchError('')
    try {
      const keyword = searchKeyword || category
      const results = await searchNearby(lng, lat, searchRadius, keyword, searchLimit)
      setShops(results)
      // 搜索新结果时清空旧的聚焦状态
      setMapFocusShop(null)
      setSelectedShop(null)
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            location: { lng, lat, address },
            radius: searchRadius,
            limit: searchLimit,
            category: keyword,
            province: searchProvince,
            city: searchCity,
          })
        )
      } catch {
        // localStorage 不可用时静默忽略，不影响主流程
      }
      if (results.length === 0) {
        setSearchError('附近未找到相关店铺，请尝试扩大搜索范围或更换地址')
      }
    } catch (err) {
      console.error(err)
      setShops([])
      setSearchError(err.message || '搜索失败，请检查网络或高德 Key 配置')
    } finally {
      setLoading(false)
    }
  }

  // 挂载时若上次有有效搜索结果，自动恢复：
  // 保留省份/城市选择，但具体地点地址置空，让用户重新输入；结果仍按上次坐标恢复展示。
  useEffect(() => {
    if (didRestore.current) return
    didRestore.current = true
    if (savedSearch?.location?.lng && savedSearch?.location?.lat) {
      handleSearch(
        savedSearch.location.lng,
        savedSearch.location.lat,
        '', // 具体地点置空，引导用户重新输入
        500, // 距离默认 500m
        savedSearch.limit,
        '餐饮', // 美食分类默认 全部
        savedSearch.province,
        savedSearch.city
      )
    }
  }, [])

  return (
    <div className={styles.app}>
      <div className={styles.container}>
        <div className={styles.leftCol}>
          <SearchPanel
            location={location}
            setLocation={setLocation}
            radius={radius}
            setRadius={setRadius}
            limit={limit}
            setLimit={setLimit}
            category={category}
            setCategory={setCategory}
            initialProvince={savedSearch?.province}
            initialCity={savedSearch?.city}
            onSearch={handleSearch}
            loading={loading}
            searchError={searchError}
            onClearSearchError={() => setSearchError('')}
          />
        </div>

        <div className={styles.rightCol}>
          {/* 地图响应两种触发：转盘揭晓(mapFocusShop) + 列表/Marker 点击(selectedShop) */}
          <MapView
            shops={shops}
            activeShop={mapFocusShop || selectedShop}
            onSelectShop={handleSelectShop}
          />

          <ShopList
            shops={shops}
            onSpin={() => setShowWheel(true)}
            onSelectShop={handleSelectShop}
          />

          {shops.length === 0 && !loading && (
            <div className={styles.empty}>
              <p>输入位置或点击定位，开始探索附近美食吧 🍜</p>
            </div>
          )}
        </div>
      </div>

      {showWheel && (
        <Wheel
          shops={shops}
          onClose={() => setShowWheel(false)}
          onSelectShop={handleSelectShop}
          onHighlight={handleHighlight}
        />
      )}

      {selectedShop && (
        <ShopDetail shop={selectedShop} onClose={() => setSelectedShop(null)} />
      )}
    </div>
  )
}

export default App
