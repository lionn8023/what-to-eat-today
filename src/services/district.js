import { loadAMap } from './amap.js'

let provinceList = null
let provincePromise = null

async function loadProvinces() {
  if (provinceList) return provinceList
  if (provincePromise) return provincePromise

  provincePromise = (async () => {
    const AMap = await loadAMap()
    return new Promise((resolve, reject) => {
      const districtSearch = new AMap.DistrictSearch({
        level: 'country',
        subdistrict: 2,
      })
      districtSearch.search('中国', (status, result) => {
        try {
          const districtList = Array.isArray(result?.districtList?.[0]?.districtList)
            ? result.districtList[0].districtList
            : []
          const provinces = districtList
            .filter((d) => d?.name && d?.adcode)
            .map((d) => ({
              name: d.name,
              adcode: d.adcode,
              cities: (Array.isArray(d?.districtList) ? d.districtList : [])
                .filter((c) => c?.name && c?.adcode)
                .map((c) => ({
                  name: c.name,
                  adcode: c.adcode,
                })),
            }))
            .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
          provinceList = provinces
          resolve(provinces)
        } catch (err) {
          console.error('[loadProvinces] parse error', err, status, result)
          reject(new Error('加载城市数据失败'))
        }
      })
    })
  })()

  return provincePromise
}

export async function getProvinces() {
  const provinces = await loadProvinces()
  return provinces.map((p) => ({ name: p.name, adcode: p.adcode }))
}

export async function getCitiesByProvince(provinceName) {
  const provinces = await loadProvinces()
  const province = provinces.find((p) => p.name === provinceName)
  return province?.cities || []
}
