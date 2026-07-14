import AMapLoader from '@amap/amap-jsapi-loader'

const AMAP_KEY = import.meta.env.VITE_AMAP_KEY
const AMAP_SCODE = import.meta.env.VITE_AMAP_SCODE

let AMapInstance = null
let loadPromise = null

const LOAD_TIMEOUT = 15000

export function loadAMap() {
  if (!AMAP_KEY || AMAP_KEY === '你的高德Key') {
    return Promise.reject(new Error('请先在 .env.local 中配置 VITE_AMAP_KEY'))
  }
  if (!AMAP_SCODE) {
    return Promise.reject(new Error('请先在 .env.local 中配置 VITE_AMAP_SCODE'))
  }

  if (AMapInstance) return Promise.resolve(AMapInstance)
  if (loadPromise) return loadPromise

  window._AMapSecurityConfig = {
    securityJsCode: AMAP_SCODE,
  }

  loadPromise = Promise.race([
    AMapLoader.load({
      key: AMAP_KEY,
      version: '2.0',
      securityConfig: {
        securityJsCode: AMAP_SCODE,
      },
      plugins: ['AMap.PlaceSearch', 'AMap.Geocoder', 'AMap.AutoComplete', 'AMap.DistrictSearch'],
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('高德地图 SDK 加载超时，请检查网络或 Key 配置')), LOAD_TIMEOUT)
    ),
  ])
    .then((AMap) => {
      AMapInstance = AMap
      return AMap
    })
    .catch((err) => {
      loadPromise = null
      throw err
    })

  return loadPromise
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('当前浏览器不支持定位，请手动输入地址'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => {
        let message = '定位失败'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = '定位权限被拒绝，请在浏览器设置中允许定位，或手动输入地址'
            break
          case error.POSITION_UNAVAILABLE:
            message = '无法获取位置信息，请检查网络或手动输入地址'
            break
          case error.TIMEOUT:
            message = '定位超时，请检查浏览器定位权限或手动输入地址'
            break
          default:
            message = `定位失败：${error.message}`
        }
        reject(new Error(message))
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    )
  })
}

const MAX_PAGE_SIZE = 50

function runPlaceSearch(AMap, keyword, center, radius, pageIndex, pageSize) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve([])
    }, 10000)

    // 重要：type 只能传高德 POI 分类（如 6 位编码或 20 个大类中文串），
    // 不能传搜索词，否则会静默把结果过滤成空。这里固定锁在「餐饮服务」大类，
    // 具体品类（火锅/烧烤/西餐…）交给 searchNearBy 的 keyword 去做文本检索。
    const placeSearch = new AMap.PlaceSearch({
      type: '餐饮服务',
      pageSize,
      pageIndex,
      extensions: 'all',
    })

    placeSearch.searchNearBy(keyword, center, radius, (status, result) => {
      clearTimeout(timeout)
      try {
        const ok = status === 'complete' && (result?.info === 'OK' || result?.info === 'ok')
        if (!ok) {
          resolve([])
          return
        }

        let rawPois = result?.poiList?.pois
        if (!rawPois && Array.isArray(result?.poiList)) {
          rawPois = result.poiList
        }
        if (!rawPois && Array.isArray(result?.pois)) {
          rawPois = result.pois
        }
        const pois = Array.isArray(rawPois) ? rawPois : rawPois ? [rawPois] : []

        resolve(
          pois.map((poi) => ({
            id: poi?.id,
            name: poi?.name,
            address: poi?.address,
            distance: poi?.distance,
            rating: poi?.biz_ext?.rating || '',
            cost: poi?.biz_ext?.cost || '',
            opentime: poi?.biz_ext?.opentime || '',
            tel: poi?.tel,
            type: poi?.type || '',
            photos: (Array.isArray(poi?.photos) ? poi.photos : [])
              .map((p) => p?.url)
              .filter(Boolean),
            location: {
              lng: poi?.location?.lng,
              lat: poi?.location?.lat,
            },
          }))
        )
      } catch (err) {
        console.error('[runPlaceSearch] parse error', err, status, result)
        resolve([])
      }
    })
  })
}

export async function searchNearby(lng, lat, radius = 1000, keyword = '餐饮', limit = 20) {
  const AMap = await loadAMap()
  const center = [lng, lat]
  const targetCount = Math.max(1, Math.min(100, Number(limit) || 20))

  const firstPage = await runPlaceSearch(
    AMap,
    keyword,
    center,
    radius,
    1,
    Math.min(MAX_PAGE_SIZE, targetCount)
  )

  if (targetCount <= MAX_PAGE_SIZE || firstPage.length < MAX_PAGE_SIZE) {
    return firstPage.slice(0, targetCount)
  }

  const secondPage = await runPlaceSearch(
    AMap,
    keyword,
    center,
    radius,
    2,
    Math.min(MAX_PAGE_SIZE, targetCount - MAX_PAGE_SIZE)
  )

  return [...firstPage, ...secondPage].slice(0, targetCount)
}
