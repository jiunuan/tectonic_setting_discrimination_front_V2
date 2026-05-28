import { COLUMNS_TO_EXTRACT1 } from '../constants'

function getPublicAssetUrl(relativePath) {
  // 中文注释：GitHub Pages 和本地预览都走同一套相对路径
  if (typeof window === 'undefined') {
    return relativePath
  }

  return new URL(relativePath, window.location.href).href
}

function normalizeValue(val, quantiles) {
  if (Number.isNaN(val)) return 0
  if (!Array.isArray(quantiles) || !quantiles.length) return val
  if (val <= quantiles[0]) return 1
  if (val > quantiles[quantiles.length - 1]) return 255

  for (let index = 1; index < 254; index++) {
    if (quantiles[index - 1] < val && val <= quantiles[index]) {
      return index + 1
    }
  }

  return 254
}

async function normalizeData(data, columns = COLUMNS_TO_EXTRACT1) {
  // 中文注释：从 public/model/saved_quantiles.json 读取每个特征的分位数映射
  const response = await fetch(getPublicAssetUrl('model/quantile_params.json'))
  if (!response.ok) {
    throw new Error('saved_quantiles.json 加载失败')
  }

  const quantiles = await response.json()

  return data.map(row => row.map((value, index) => {
    const columnName = columns[index]
    const columnQuantiles = quantiles[columnName]

    if (!columnQuantiles) {
      return value
    }

    return normalizeValue(Number(value), columnQuantiles)
  }))
}

export {
  normalizeData,
  normalizeValue
}
