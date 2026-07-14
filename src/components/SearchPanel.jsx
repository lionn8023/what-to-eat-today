import React, { useState, useEffect, useRef, useCallback } from 'react'
import { getCurrentPosition } from '../services/amap.js'
import { lngLatToAddress, addressToLngLat } from '../services/geocoder.js'
import { searchAddressTips } from '../services/autocomplete.js'
import { getProvinces, getCitiesByProvince } from '../services/district.js'
import styles from './SearchPanel.module.css'

const RADIUS_OPTIONS = [
  { label: '500米', value: 500 },
  { label: '1公里', value: 1000 },
  { label: '2公里', value: 2000 },
  { label: '5公里', value: 5000 },
]

const CATEGORIES = [
  { label: '全部', value: '餐饮' },
  { label: '火锅', value: '火锅' },
  { label: '烧烤', value: '烧烤' },
  { label: '快餐', value: '快餐' },
  { label: '咖啡', value: '咖啡' },
  { label: '甜点', value: '甜品' },
  { label: '日料', value: '日本料理' },
  { label: '西餐', value: '西餐厅' },
]

const LIMIT_OPTIONS = [
  { label: '10家', value: 10 },
  { label: '20家', value: 20 },
  { label: '30家', value: 30 },
  { label: '50家', value: 50 },
]

const NATIONAL = { name: '全国', adcode: '' }

// 直辖市：AMap 逆地理编码的 city 常与 province 同名或为空，无独立下级"城市"
const MUNICIPALITY_NAMES = ['北京市', '天津市', '上海市', '重庆市']

function isMunicipality(name) {
  return MUNICIPALITY_NAMES.includes(name)
}

export default function SearchPanel({
  location,
  setLocation,
  radius,
  setRadius,
  limit,
  setLimit,
  category,
  setCategory,
  initialProvince,
  initialCity,
  onSearch,
  loading,
  searchError = '',
  onClearSearchError,
}) {
  const [provinces, setProvinces] = useState([NATIONAL])
  const [province, setProvince] = useState(initialProvince || NATIONAL.name)
  const [cities, setCities] = useState([])
  const [city, setCity] = useState(initialCity || '')
  // 刷新后具体地点地址置空，只保留省份/城市选择，引导用户重新输入
  const [inputValue, setInputValue] = useState('')
  const [customLimit, setCustomLimit] = useState('')
  const [isCustomLimit, setIsCustomLimit] = useState(false)
  const [tips, setTips] = useState([])
  const [showTips, setShowTips] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const tipsRef = useRef(null)
  const inputRef = useRef(null)
  const searchTimer = useRef(null)

  useEffect(() => {
    getProvinces()
      .then((list) => {
        let merged = [NATIONAL, ...list]
        // 兜底：即使 AMap 城市数据不全，也确保已保存的省份可选中显示
        if (initialProvince && !merged.some((p) => p.name === initialProvince)) {
          merged = [{ name: initialProvince, adcode: '' }, ...merged]
        }
        setProvinces(merged)
      })
      .catch(() => {
        const fallback = [NATIONAL]
        if (initialProvince) fallback.push({ name: initialProvince, adcode: '' })
        setProvinces(fallback)
      })
  }, [])

  useEffect(() => {
    if (province === NATIONAL.name) {
      setCities([])
      setCity('')
      return
    }

    // 直辖市无独立下级城市，直接置空，不做自动选择
    if (isMunicipality(province)) {
      setCities([])
      setCity('')
      return
    }

    getCitiesByProvince(province)
      .then((list) => {
        setCities(list)
        // 若当前城市仍在该省城市列表中（如刷新恢复场景），保持不变；
        // 否则（手动切换省份）重置为列表中第一个城市
        if (list.some((c) => c.name === city)) return
        setCity(list.length > 0 ? list[0].name : '')
      })
      .catch(() => {
        setCities([])
        setCity('')
      })
  }, [province])

  useEffect(() => {
    function handleClickOutside(event) {
      if (tipsRef.current && !tipsRef.current.contains(event.target)) {
        setShowTips(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentCity = province === NATIONAL.name ? '' : city

  const fetchTips = useCallback(async (keyword) => {
    if (!keyword || keyword.length < 2) {
      setTips([])
      return
    }
    try {
      const results = await searchAddressTips(keyword, currentCity)
      setTips(results)
      setShowTips(results.length > 0)
      setActiveIndex(-1)
    } catch {
      setTips([])
    }
  }, [currentCity])

  function handleInputChange(e) {
    const value = e.target.value
    setInputValue(value)
    setLocation({ lng: null, lat: null, address: value })
    setShowTips(false)
    onClearSearchError?.()

    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      fetchTips(value)
    }, 300)
  }

  function handleProvinceChange(e) {
    const newProvince = e.target.value
    setProvince(newProvince)
    setInputValue('')
    setLocation({ lng: null, lat: null, address: '' })
    setTips([])
    setShowTips(false)
    setError('')
    onClearSearchError?.()
    inputRef.current?.focus()
  }

  function handleCityChange(e) {
    const newCity = e.target.value
    setCity(newCity)
    setInputValue('')
    setLocation({ lng: null, lat: null, address: '' })
    setTips([])
    setShowTips(false)
    setError('')
    onClearSearchError?.()
    inputRef.current?.focus()
  }

  function handleSelectTip(tip) {
    setInputValue(tip.name)
    setShowTips(false)
    setTips([])

    if (tip.location?.lng && tip.location?.lat) {
      setLocation({
        lng: tip.location.lng,
        lat: tip.location.lat,
        address: tip.name,
      })
    } else {
      setLocation({ lng: null, lat: null, address: tip.name })
    }
  }

  function handleKeyDown(e) {
    if (!showTips || tips.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % tips.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev - 1 + tips.length) % tips.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0) {
        handleSelectTip(tips[activeIndex])
      }
    } else if (e.key === 'Escape') {
      setShowTips(false)
    }
  }

  function handleLimitSelect(value) {
    setLimit(value)
    setCustomLimit('')
    setIsCustomLimit(false)
  }

  function handleCustomLimitChange(e) {
    const value = e.target.value
    if (value === '') {
      setCustomLimit('')
      setIsCustomLimit(false)
      setLimit(20)
      return
    }

    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 1) {
      setCustomLimit(String(num))
      setIsCustomLimit(true)
      setLimit(num)
    }
  }

  async function handleLocate() {
    setLocating(true)
    setError('')
    try {
      const { lng, lat } = await getCurrentPosition()
      const detail = await lngLatToAddress(lng, lat)
      const foundProvince = detail.province || NATIONAL.name
      // 直辖市：city 与 province 同名，统一视为无下级城市
      let foundCity = detail.city
      if (!foundCity || foundCity === foundProvince) foundCity = ''

      const newLocation = { lng, lat, address: detail.formattedAddress }
      setLocation(newLocation)
      setInputValue(detail.formattedAddress)
      setProvince(foundProvince)
      setCity(foundCity)
      setTips([])
      setShowTips(false)
    } catch (err) {
      setError(err.message || '定位失败')
    } finally {
      setLocating(false)
    }
  }

  async function handleSearch() {
    setError('')
    setShowTips(false)
    try {
      let target = { ...location }

      if (inputValue && (!location.lng || !location.lat || inputValue !== location.address)) {
        const { lng, lat } = await addressToLngLat(inputValue)
        target = { lng, lat, address: inputValue }
        setLocation(target)
      }

      if (!target.lng || !target.lat) {
        setError('请先选择城市、输入具体地址或点击定位')
        return
      }

      await onSearch(target.lng, target.lat, target.address, radius, limit, undefined, province, city)
    } catch (err) {
      setError(err.message || '搜索失败')
    }
  }

  return (
    <div className={styles.panel}>
      <h1 className={styles.title}>今天吃什么？</h1>
      <p className={styles.subtitle}>让命运来决定你的下一顿饭</p>

      <div className={styles.regionGroup}>
        <div className={styles.regionField}>
          <label className={styles.regionLabel}>省份</label>
          <select
            className={styles.regionSelect}
            value={province}
            onChange={handleProvinceChange}
          >
            {provinces.map((p) => (
              <option key={p.adcode || 'national'} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.regionField}>
          <label className={styles.regionLabel}>城市</label>
          <select
            className={styles.regionSelect}
            value={city}
            onChange={handleCityChange}
            disabled={
              province === NATIONAL.name ||
              isMunicipality(province) ||
              (province !== NATIONAL.name && cities.length === 0)
            }
          >
            {province === NATIONAL.name ? (
              <option value="">全国</option>
            ) : isMunicipality(province) ? (
              <option value="">{province}</option>
            ) : cities.length === 0 ? (
              <option value="">加载中…</option>
            ) : (
              cities.map((c) => (
                <option key={c.adcode} value={c.name}>
                  {c.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className={styles.inputGroup} ref={tipsRef}>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder={`输入${currentCity ? currentCity + '市内' : ''}具体地址，如：三里屯`}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.length >= 2 && tips.length > 0 && setShowTips(true)}
          autoComplete="off"
        />
        <button
          className={styles.locateBtn}
          onClick={handleLocate}
          disabled={locating}
        >
          {locating ? '定位中…' : '定位'}
        </button>

        {showTips && tips.length > 0 && (
          <ul className={styles.tipsList}>
            {tips.map((tip, index) => (
              <li
                key={tip.id || index}
                className={`${styles.tipItem} ${
                  index === activeIndex ? styles.tipItemActive : ''
                }`}
                onClick={() => handleSelectTip(tip)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <div className={styles.tipName}>{tip.name}</div>
                <div className={styles.tipAddress}>
                  {tip.district} {tip.address}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.options}>
        <div className={styles.optionRow}>
          <span className={styles.optionLabel}>美食分类</span>
          <div className={styles.optionBtns}>
            {CATEGORIES.map((option) => (
              <button
                key={option.value}
                className={`${styles.optionBtn} ${
                  category === option.value ? styles.optionBtnActive : ''
                }`}
                onClick={() => setCategory(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.optionRow}>
          <span className={styles.optionLabel}>搜索范围</span>
          <div className={styles.optionBtns}>
            {RADIUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`${styles.optionBtn} ${
                  radius === option.value ? styles.optionBtnActive : ''
                }`}
                onClick={() => setRadius(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.optionRow}>
          <span className={styles.optionLabel}>店铺数量</span>
          <div className={styles.optionBtns}>
            {LIMIT_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`${styles.optionBtn} ${
                  limit === option.value && !isCustomLimit ? styles.optionBtnActive : ''
                }`}
                onClick={() => handleLimitSelect(option.value)}
              >
                {option.label}
              </button>
            ))}
            <input
              type="text"
              inputMode="numeric"
              className={`${styles.customLimitInput} ${
                isCustomLimit ? styles.customLimitInputActive : ''
              }`}
              placeholder="自定义"
              value={customLimit}
              onChange={handleCustomLimitChange}
            />
          </div>
        </div>
      </div>

      <button
        className={styles.searchBtn}
        onClick={handleSearch}
        disabled={loading}
      >
        {loading ? '搜索中…' : '搜索附近店铺'}
      </button>

      {(error || searchError) && (
        <p className={styles.error}>{error || searchError}</p>
      )}
    </div>
  )
}
