function getPublicAssetUrl(relativePath) {
  // 中文注释：静态资源地址跟随当前页面，兼容 Vite 本地预览和静态部署。
  if (typeof window === 'undefined') {
    return relativePath
  }

  return new URL(relativePath, window.location.href).href
}

let imputationStatsPromise = null
let knnReferencePromise = null

function isMissingChemicalValue(value) {
  if (value === null || value === undefined || value === '') return true

  const numericValue = Number(value)
  // 中文注释：地球化学表格里 0 常被当作未测或空值占位，预处理阶段统一按缺失处理。
  return !Number.isFinite(numericValue) || numericValue === 0
}

async function loadImputationStats() {
  if (!imputationStatsPromise) {
    imputationStatsPromise = fetch(getPublicAssetUrl('model/imputation_stats.json'))
      .then(response => {
        if (!response.ok) {
          throw new Error('imputation_stats.json 加载失败')
        }

        return response.json()
      })
  }

  return imputationStatsPromise
}

async function loadKnnReference() {
  if (!knnReferencePromise) {
    knnReferencePromise = fetch(getPublicAssetUrl('model/knn_reference.json'))
      .then(response => {
        if (!response.ok) {
          throw new Error('knn_reference.json 加载失败')
        }

        return response.json()
      })
  }

  return knnReferencePromise
}

async function imputeRowsByTrainingMedian(rows, columns) {
  const imputationStats = await loadImputationStats()
  const stats = imputationStats.stats || {}

  return rows.map(row => row.map((value, index) => {
    const columnName = columns[index]
    const columnStats = stats[columnName]
    const fallbackValue = Number(columnStats?.median ?? 0)

    if (isMissingChemicalValue(value)) {
      return Number.isFinite(fallbackValue) ? fallbackValue : 0
    }

    return Number(value)
  }))
}

function buildColumnIndexMap(columns) {
  return columns.reduce((map, column, index) => {
    map[column] = index
    return map
  }, {})
}

function getColumnMedian(stats, columnName) {
  const median = Number(stats[columnName]?.median ?? 0)
  return Number.isFinite(median) ? median : 0
}

function normalizeForDistance(value, stats, columnName) {
  const columnStats = stats[columnName]
  const median = Number(columnStats?.median ?? 0)
  const iqrScale = Number(columnStats?.q75 ?? 0) - Number(columnStats?.q25 ?? 0)
  const scale = Number(columnStats?.scale ?? iqrScale ?? 1)
  const safeScale = Number.isFinite(scale) && Math.abs(scale) > 1e-12 ? scale : 1

  return (Number(value) - median) / safeScale
}

function collectNearestNeighbors(row, columns, reference) {
  const referenceColumns = reference.columns || []
  const referenceColumnIndexMap = buildColumnIndexMap(referenceColumns)
  const stats = reference.stats || {}
  const k = Number(reference.k || 7)
  const availableColumns = columns
    .map((columnName, index) => ({ columnName, index, referenceIndex: referenceColumnIndexMap[columnName] }))
    .filter(item => item.referenceIndex !== undefined && !isMissingChemicalValue(row[item.index]))

  if (!availableColumns.length) {
    return []
  }

  const neighbors = []
  for (const referenceRow of reference.rows || []) {
    let distance = 0

    for (const item of availableColumns) {
      const queryValue = normalizeForDistance(row[item.index], stats, item.columnName)
      const referenceValue = normalizeForDistance(referenceRow[item.referenceIndex], stats, item.columnName)
      const diff = queryValue - referenceValue
      distance += diff * diff
    }

    distance /= availableColumns.length

    if (neighbors.length < k) {
      neighbors.push({ distance, row: referenceRow })
      continue
    }

    let farthestIndex = 0
    for (let index = 1; index < neighbors.length; index += 1) {
      if (neighbors[index].distance > neighbors[farthestIndex].distance) {
        farthestIndex = index
      }
    }

    if (distance < neighbors[farthestIndex].distance) {
      neighbors[farthestIndex] = { distance, row: referenceRow }
    }
  }

  return neighbors
}

async function imputeRowsByKnn(rows, columns) {
  const reference = await loadKnnReference()
  const referenceColumnIndexMap = buildColumnIndexMap(reference.columns || [])
  const stats = reference.stats || {}
  const output = []

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex]
    const neighbors = collectNearestNeighbors(row, columns, reference)

    const nextRow = row.map((value, columnIndex) => {
      const columnName = columns[columnIndex]
      const referenceIndex = referenceColumnIndexMap[columnName]

      if (!isMissingChemicalValue(value)) {
        return Number(value)
      }

      if (referenceIndex === undefined || !neighbors.length) {
        return getColumnMedian(stats, columnName)
      }

      // 中文注释：距离越近权重越高，避免单个较远参考样本主导缺失值。
      let weightedSum = 0
      let weightSum = 0
      for (const neighbor of neighbors) {
        const neighborValue = Number(neighbor.row[referenceIndex])
        if (!Number.isFinite(neighborValue)) continue

        const weight = 1 / (Math.sqrt(neighbor.distance) + 1e-6)
        weightedSum += neighborValue * weight
        weightSum += weight
      }

      return weightSum > 0 ? weightedSum / weightSum : getColumnMedian(stats, columnName)
    })

    output.push(nextRow)

    // 中文注释：大表插补时主动让出主线程，减少“页面卡死”的感觉。
    if (rowIndex > 0 && rowIndex % 50 === 0) {
      await new Promise(resolve => window.setTimeout(resolve, 0))
    }
  }

  return output
}

// ─── MissForest inference ────────────────────────────────────────────────────

import { ARCHEAN_CRATON_PATTERNS, MISSFOREST_LABEL_TO_FILE } from '../constants'

const missforestModelCache = {}

async function loadMissforestModel(settingKey) {
  if (missforestModelCache[settingKey]) {
    return missforestModelCache[settingKey]
  }

  const fileName = MISSFOREST_LABEL_TO_FILE[settingKey]
  if (!fileName) {
    throw new Error(`没有对应的 MissForest 模型：${settingKey}`)
  }

  const url = getPublicAssetUrl(`model/missforest/${fileName}.json`)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`MissForest 模型加载失败：${fileName}.json`)
  }

  const model = await response.json()
  missforestModelCache[settingKey] = model
  return model
}

function predictTree(tree, x) {
  let node = 0
  while (tree.l[node] !== -1) {
    if (x[tree.f[node]] <= tree.t[node]) {
      node = tree.l[node]
    } else {
      node = tree.r[node]
    }
  }
  return tree.v[node]
}

function predictRF(imputer, x) {
  let sum = 0
  for (const tree of imputer.trees) {
    sum += predictTree(tree, x)
  }
  return sum / imputer.trees.length
}

function imputeOneRowWithModel(row, columns, model, nIter = 3) {
  const { column_order, scaler_mean, scaler_scale, imputers } = model
  const n = column_order.length

  // Build input→model index map
  const inputToModel = new Array(columns.length).fill(-1)
  columns.forEach((col, inputIdx) => {
    const modelIdx = column_order.indexOf(col)
    if (modelIdx !== -1) inputToModel[inputIdx] = modelIdx
  })

  // Scale data into model space; missing → 0 (= scaled mean)
  const scaled = new Float64Array(n)
  const missing = new Uint8Array(n)
  missing.fill(1)

  columns.forEach((col, inputIdx) => {
    const modelIdx = inputToModel[inputIdx]
    if (modelIdx === -1) return
    const val = row[inputIdx]
    if (!isMissingChemicalValue(val)) {
      scaled[modelIdx] = (Number(val) - scaler_mean[modelIdx]) / scaler_scale[modelIdx]
      missing[modelIdx] = 0
    }
  })

  // Iterative imputation in scaled space
  for (let iter = 0; iter < nIter; iter++) {
    for (let j = 0; j < n; j++) {
      if (!missing[j]) continue

      // Build feature vector: all columns except j, in column_order order
      const x = new Float64Array(n - 1)
      let xi = 0
      for (let k = 0; k < n; k++) {
        if (k !== j) x[xi++] = scaled[k]
      }

      scaled[j] = predictRF(imputers[j], x)
    }
  }

  // Inverse-scale and write back only the missing values
  const result = row.map(Number)
  columns.forEach((col, inputIdx) => {
    const modelIdx = inputToModel[inputIdx]
    if (modelIdx === -1) return
    if (missing[modelIdx]) {
      result[inputIdx] = scaled[modelIdx] * scaler_scale[modelIdx] + scaler_mean[modelIdx]
    }
  })

  return result
}

async function imputeRowsByMissForest(rows, columns, settingLabels) {
  // settingLabels: array of per-row CNN label strings (from KNN-pass prediction)
  // Rows that map to an unknown label fall back to KNN values (passed in as-is).
  const uniqueSettings = [...new Set(settingLabels.filter(l => l && MISSFOREST_LABEL_TO_FILE[l]))]

  // Preload all needed models in parallel
  const modelMap = {}
  await Promise.all(
    uniqueSettings.map(async (label) => {
      modelMap[label] = await loadMissforestModel(label)
    })
  )

  const output = []
  for (let i = 0; i < rows.length; i++) {
    const label = settingLabels[i]
    if (label && modelMap[label]) {
      output.push(imputeOneRowWithModel(rows[i], columns, modelMap[label]))
    } else {
      output.push(rows[i].map(Number))
    }

    // Yield to main thread every 50 rows to avoid jank
    if (i > 0 && i % 50 === 0) {
      await new Promise(resolve => window.setTimeout(resolve, 0))
    }
  }

  return output
}

function isArcheanFilename(filename) {
  if (!filename) return false
  return ARCHEAN_CRATON_PATTERNS.some(re => re.test(filename))
}

export {
  imputeRowsByKnn,
  imputeRowsByMissForest,
  imputeRowsByTrainingMedian,
  isArcheanFilename,
  isMissingChemicalValue
}
