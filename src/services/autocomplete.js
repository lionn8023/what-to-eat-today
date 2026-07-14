import { loadAMap } from './amap.js'

export async function searchAddressTips(keyword, city) {
  if (!keyword || keyword.length < 2) return []

  const AMap = await loadAMap()

  return new Promise((resolve) => {
    const auto = new AMap.AutoComplete({
      city: city || '全国',
      citylimit: !!city,
    })

    auto.search(keyword, (status, result) => {
      try {
        const tips = Array.isArray(result?.tips) ? result.tips : []
        resolve(
          tips
            .filter((tip) => tip?.name)
            .map((tip) => ({
              id: tip?.id,
              name: tip?.name,
              district: tip?.district,
              address: tip?.address,
              location: tip?.location
                ? { lng: tip.location.lng, lat: tip.location.lat }
                : null,
            }))
        )
      } catch (err) {
        console.error('[searchAddressTips] parse error', err, status, result)
        resolve([])
      }
    })
  })
}
