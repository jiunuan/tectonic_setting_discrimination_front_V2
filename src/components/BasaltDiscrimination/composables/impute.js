import { ARCHEAN_CRATON_PATTERNS } from '../constants'

function getPublicAssetUrl(relativePath) {
  // 中文注释：静态资源地址跟随当前页面，兼容 Vite 本地预览和静态部署。
  if (typeof window === 'undefined') {
    return relativePath
  }

  return new URL(relativePath, window.location.href).href
}

let knnReferencePromise = null
let globalMissforestPromise = null

function isMissingChemicalValue(value) {
  if (value === null || value === undefined || value === '') return true

  const numericValue = Number(value)
  // 中文注释：地球化学表格里 0 常被当作未测或空值占位，预处理阶段统一按缺失处理。
  return !Number.isFinite(numericValue) || numericValue === 0
}

// ─── 全局轻量 MissForest 插补（现代玄武岩主路径）─────────────────────────────
// 模型来自 data_interpolation/export_global_light_missforest_json.py，结构：
//   { column_order:[36], scaler_mean:[36], scaler_scale:[36],
//     imputers:[ {trees:[{l,r,f,t,v}]}, ...36... ] }
// imputers[j] 对应 column_order[j]；其树的 f 索引指向“除 j 外其余 35 列”（column_order 去掉第 j 列）。

async function loadGlobalMissforest() {
  if (!globalMissforestPromise) {
    globalMissforestPromise = fetch(getPublicAssetUrl('model/missforest_global.json'))
      .then(response => {
        if (!response.ok) {
          throw new Error('missforest_global.json 加载失败')
        }

        return response.json()
      })
  }

  return globalMissforestPromise
}

function predictTree(tree, x) {
  let node = 0
  // 叶节点的 left == -1；内部节点按 x[f] <= t 走左，否则走右（与 sklearn 一致）。
  while (tree.l[node] !== -1) {
    node = x[tree.f[node]] <= tree.t[node] ? tree.l[node] : tree.r[node]
  }
  return tree.v[node]
}

function predictRF(imputer, x) {
  const trees = imputer.trees || []
  if (!trees.length) return 0

  let sum = 0
  for (const tree of trees) {
    sum += predictTree(tree, x)
  }
  return sum / trees.length
}

function imputeOneRowWithGlobalModel(row, columns, model) {
  const { column_order, scaler_mean, scaler_scale, imputers } = model
  const n = column_order.length

  // 输入列 -> 模型列下标
  const inputToModel = columns.map(col => column_order.indexOf(col))

  // 标准化到模型空间；缺失 -> 0（= 标准化均值），并记录缺失位置（模型列序）。
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

  // 与导出脚本评估口径一致：每个缺失列独立用“原始(缺失=0)特征向量”预测，不互相传播。
  const imputedScaled = Float64Array.from(scaled)
  for (let j = 0; j < n; j += 1) {
    if (!missing[j]) continue
    const imputer = imputers[j]
    if (!imputer || !(imputer.trees && imputer.trees.length)) continue

    // 特征向量：除 j 外，按 column_order 顺序（与训练 feature_cols 对齐）。
    const x = new Float64Array(n - 1)
    let xi = 0
    for (let k = 0; k < n; k += 1) {
      if (k !== j) x[xi++] = scaled[k]
    }
    imputedScaled[j] = predictRF(imputer, x)
  }

  // 反标准化，仅写回缺失位置；地化含量不为负（与训练 clip(lower=0) 一致）。
  const result = row.map(Number)
  columns.forEach((col, inputIdx) => {
    const modelIdx = inputToModel[inputIdx]
    if (modelIdx === -1) return
    if (missing[modelIdx]) {
      const value = imputedScaled[modelIdx] * scaler_scale[modelIdx] + scaler_mean[modelIdx]
      result[inputIdx] = value < 0 ? 0 : value
    }
  })

  return result
}

async function imputeRowsByMissForest(rows, columns) {
  let model
  try {
    model = await loadGlobalMissforest()
  } catch (error) {
    // 中文注释：全局 MissForest 加载失败时回退 KNN，保证功能可用。
    console.warn('全局 MissForest 加载失败，回退 KNN：', error)
    globalMissforestPromise = null
    return imputeRowsByKnn(rows, columns)
  }

  const output = []
  for (let i = 0; i < rows.length; i += 1) {
    output.push(imputeOneRowWithGlobalModel(rows[i], columns, model))

    // 中文注释：大表插补时主动让出主线程，减少“页面卡死”的感觉。
    if (i > 0 && i % 50 === 0) {
      await new Promise(resolve => window.setTimeout(resolve, 0))
    }
  }

  return output
}

// ─── KNN 插补（全局 MissForest 加载失败时的兜底）─────────────────────────────

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

    if (rowIndex > 0 && rowIndex % 50 === 0) {
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
  imputeRowsByMissForest,
  imputeRowsByKnn,
  isArcheanFilename,
  isMissingChemicalValue
}
