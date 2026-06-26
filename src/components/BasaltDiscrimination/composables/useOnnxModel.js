import * as ort from 'onnxruntime-web'
import { ref } from 'vue'
import { COLUMNS_TO_EXTRACT1, MODEL_SEQUENCE_COLUMNS, TECTONIC_SETTINGS } from '../constants'

const MODEL_CLASS_NAMES = TECTONIC_SETTINGS
const MODEL_FILE_NAME = 'model/model.onnx'
const DEFAULT_BATCH_SIZE = 96

const modelStatus = ref('idle')
const modelError = ref('')

let sessionPromise = null
let session = null

function getPublicAssetUrl(relativePath) {
  // 中文注释：通过当前页面地址解析 public 资源，兼容本地预览和 GitHub Pages
  if (typeof window === 'undefined') {
    return relativePath
  }

  return new URL(relativePath, window.location.href).href
}

function configureOrtEnvironment() {
  // 中文注释：GitHub Pages 不是 cross-origin isolated，这里固定单线程 wasm
  ort.env.wasm.numThreads = 1
  ort.env.wasm.proxy = false
  ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/'
}

function softmax(logits) {
  const maxValue = Math.max(...logits)
  const expValues = logits.map(value => Math.exp(value - maxValue))
  const sum = expValues.reduce((acc, value) => acc + value, 0) || 1
  return expValues.map(value => value / sum)
}

function buildInputTensors(rows, masks, columns, sequenceColumns) {
  // 中文注释：GeoDAN 显式缺失编码——矩阵分支和序列分支都用“值 + 缺失mask”两路输入。
  // masks 与 rows 同序（COLUMNS_TO_EXTRACT1 列序），元素 1=原始缺失，0=实测。
  const columnIndexMap = new Map(columns.map((name, index) => [name, index]))
  const batchSize = rows.length
  const featureCount = COLUMNS_TO_EXTRACT1.length
  const seqLen = sequenceColumns.length

  // 矩阵分支：2 通道 [B,2,6,6]——通道0=分位数值/255，通道1=缺失mask
  const imageBuffer = new Float32Array(batchSize * 2 * featureCount)
  // 序列分支：每元素 2 特征 [B,36,2]——特征0=值/255，特征1=mask
  const sequenceBuffer = new Float32Array(batchSize * seqLen * 2)

  rows.forEach((row, rowIndex) => {
    const maskRow = masks?.[rowIndex]
    const imgBase = rowIndex * 2 * featureCount
    for (let columnIndex = 0; columnIndex < featureCount; columnIndex += 1) {
      const value = Number(row[columnIndex]) || 0
      const mask = maskRow && Number(maskRow[columnIndex]) ? 1 : 0
      imageBuffer[imgBase + columnIndex] = value / 255              // 通道0：值
      imageBuffer[imgBase + featureCount + columnIndex] = mask      // 通道1：mask
    }

    const seqBase = rowIndex * seqLen * 2
    sequenceColumns.forEach((columnName, sequenceIndex) => {
      const sourceIndex = columnIndexMap.get(columnName)
      const value = sourceIndex === undefined ? 0 : Number(row[sourceIndex]) || 0
      const mask = sourceIndex !== undefined && maskRow && Number(maskRow[sourceIndex]) ? 1 : 0
      sequenceBuffer[seqBase + sequenceIndex * 2] = value / 255     // 特征0：值
      sequenceBuffer[seqBase + sequenceIndex * 2 + 1] = mask        // 特征1：mask
    })
  })

  return {
    imageTensor: new ort.Tensor('float32', imageBuffer, [batchSize, 2, 6, 6]),
    sequenceTensor: new ort.Tensor('float32', sequenceBuffer, [batchSize, seqLen, 2])
  }
}

function yieldToBrowser() {
  // 中文注释：分批预测之间释放一次事件循环，让进度条和按钮状态能及时刷新。
  return new Promise(resolve => {
    window.setTimeout(resolve, 0)
  })
}

async function loadModel() {
  if (session) {
    return session
  }

  if (!sessionPromise) {
    configureOrtEnvironment()
    modelStatus.value = 'loading'
    modelError.value = ''

    const modelUrl = getPublicAssetUrl(MODEL_FILE_NAME)

    sessionPromise = ort.InferenceSession.create(modelUrl, {
      executionProviders: ['wasm']
    }).then(result => {
      session = result
      modelStatus.value = 'ready'
      return result
    }).catch(error => {
      sessionPromise = null
      session = null
      modelStatus.value = 'error'
      modelError.value = error?.message || String(error)
      throw error
    })
  }

  return sessionPromise
}

async function predictRows(rows, columns = COLUMNS_TO_EXTRACT1, sequenceColumns = MODEL_SEQUENCE_COLUMNS, options = {}) {
  const currentSession = await loadModel()

  if (!Array.isArray(rows) || !rows.length) {
    throw new Error('没有可用于判别的数据')
  }

  const batchSize = options.batchSize || DEFAULT_BATCH_SIZE
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null
  // 中文注释：masks 与 rows 一一对应（同为 COLUMNS_TO_EXTRACT1 列序）；缺省则全部按实测处理。
  const masks = Array.isArray(options.masks) ? options.masks : null
  const inputNames = currentSession.inputNames || []

  if (inputNames.length < 2) {
    throw new Error('判别所需输入不完整')
  }

  const predictions = []

  for (let batchStart = 0; batchStart < rows.length; batchStart += batchSize) {
    const batchRows = rows.slice(batchStart, batchStart + batchSize)
    const batchMasks = masks ? masks.slice(batchStart, batchStart + batchSize) : null
    const { imageTensor, sequenceTensor } = buildInputTensors(batchRows, batchMasks, columns, sequenceColumns)
    const feeds = {}
    feeds[inputNames[0]] = imageTensor
    feeds[inputNames[1]] = sequenceTensor

    const outputs = await currentSession.run(feeds)
    const outputName = currentSession.outputNames?.[0] || Object.keys(outputs)[0]
    const outputTensor = outputs[outputName]

    if (!outputTensor) {
      throw new Error('判别引擎没有返回预测结果')
    }

    const classCount = outputTensor.dims?.[1] || MODEL_CLASS_NAMES.length
    const logits = Array.from(outputTensor.data)

    for (let index = 0; index < batchRows.length; index += 1) {
      const start = index * classCount
      const rowLogits = logits.slice(start, start + classCount)
      const probabilities = softmax(rowLogits)
      let bestIndex = 0
      let bestValue = probabilities[0] || 0

      probabilities.forEach((value, classIndex) => {
        if (value > bestValue) {
          bestValue = value
          bestIndex = classIndex
        }
      })

      predictions.push({
        index: batchStart + index,
        label: MODEL_CLASS_NAMES[bestIndex] || MODEL_CLASS_NAMES[0] || '',
        confidence: bestValue
      })
    }

    onProgress?.({
      completed: Math.min(batchStart + batchRows.length, rows.length),
      total: rows.length
    })

    await yieldToBrowser()
  }

  return predictions
}

export {
  loadModel,
  predictRows,
  modelError,
  modelStatus
}
