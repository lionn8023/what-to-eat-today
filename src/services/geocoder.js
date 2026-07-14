import { loadAMap } from './amap.js'

export async function lngLatToAddress(lng, lat) {
  const AMap = await loadAMap()

  return new Promise((resolve, reject) => {
    const geocoder = new AMap.Geocoder({
      radius: 1000,
      extensions: 'all',
    })

    geocoder.getAddress([lng, lat], (status, result) => {
      if (status === 'complete' && result.regeocode) {
        const ac = result.regeocode.addressComponent || {}
        const province = ac.province || ''
        // 直辖市的 city 常为 province 本身或空数组，统一规整为字符串
        let city = ac.city || ''
        if (Array.isArray(city)) city = city[0] || ''
        resolve({
          formattedAddress: result.regeocode.formattedAddress,
          province,
          city,
        })
      } else {
        reject(new Error('逆地理编码失败'))
      }
    })
  })
}

export async function addressToLngLat(address) {
  const AMap = await loadAMap()

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('地址解析超时，请尝试输入更详细的地址'))
    }, 10000)

    const geocoder = new AMap.Geocoder({})

    geocoder.getLocation(address, (status, result) => {
      clearTimeout(timeout)
      if (status === 'complete' && result.geocodes?.length) {
        const loc = result.geocodes[0].location
        resolve({ lng: loc.lng, lat: loc.lat })
      } else {
        reject(new Error('地址解析失败，请尝试输入更详细的地址'))
      }
    })
  })
}
