import fs from 'node:fs'
import * as ort from 'onnxruntime-web'

const MODEL_FILE = 'E:\\program\\vue\\tectnoic_setting_discrimination_front_V2\\public\\model\\model.onnx'
const FILES = [
  { label: 'BACK-ARC_BASIN', file: 'E:\\program\\CNNtest\\data\\rockType\\basalt\\basalt_combine\\missing_value_imputation\\MissForest\\BACK-ARC_BASIN.csv' },
  { label: 'Continental arc', file: 'E:\\program\\CNNtest\\data\\rockType\\basalt\\basalt_combine\\missing_value_imputation\\MissForest\\Continental_arc.csv' },
  { label: 'CONTINENTAL FLOOD BASALT', file: 'E:\\program\\CNNtest\\data\\rockType\\basalt\\basalt_combine\\missing_value_imputation\\MissForest\\CONTINENTAL_FLOOD_BASALT.csv' },
  { label: 'CONTINENTAL_RIFT', file: 'E:\\program\\CNNtest\\data\\rockType\\basalt\\basalt_combine\\missing_value_imputation\\MissForest\\CONTINENTAL_RIFT.csv' },
  { label: 'Intra-oceanic arc', file: 'E:\\program\\CNNtest\\data\\rockType\\basalt\\basalt_combine\\missing_value_imputation\\MissForest\\Intra-oceanic_arc.csv' },
  { label: 'Island arc', file: 'E:\\program\\CNNtest\\data\\rockType\\basalt\\basalt_combine\\missing_value_imputation\\MissForest\\Island_arc.csv' },
  { label: 'OCEAN ISLAND', file: 'E:\\program\\CNNtest\\data\\rockType\\basalt\\basalt_combine\\missing_value_imputation\\MissForest\\OCEAN_ISLAND.csv' },
  { label: 'OCEANIC PLATEAU', file: 'E:\\program\\CNNtest\\data\\rockType\\basalt\\basalt_combine\\missing_value_imputation\\MissForest\\OCEANIC_PLATEAU.csv' },
  { label: 'SPREADING_CENTER', file: 'E:\\program\\CNNtest\\data\\rockType\\basalt\\basalt_combine\\missing_value_imputation\\MissForest\\SPREADING_CENTER.csv' }
]

const COLUMNS = [
  'NA2O(WT%)', 'MGO(WT%)', 'CR(PPM)', 'AL2O3(WT%)', 'SIO2(WT%)', 'P2O5(WT%)',
  'K2O(WT%)', 'CAO(WT%)', 'TIO2(WT%)', 'V(PPM)', 'MNO(WT%)', 'FEOT(WT%)',
  'RB(PPM)', 'SR(PPM)', 'Y(PPM)', 'NB(PPM)', 'CO(PPM)', 'NI(PPM)',
  'BA(PPM)', 'LA(PPM)', 'CE(PPM)', 'PR(PPM)', 'ND(PPM)', 'ZR(PPM)',
  'SM(PPM)', 'EU(PPM)', 'GD(PPM)', 'TB(PPM)', 'DY(PPM)', 'HO(PPM)',
  'TH(PPM)', 'ER(PPM)', 'YB(PPM)', 'LU(PPM)', 'HF(PPM)', 'TA(PPM)'
]

const SEQUENCE_COLUMNS = [
  'RB(PPM)', 'K2O(WT%)', 'BA(PPM)', 'SR(PPM)', 'CAO(WT%)', 'NA2O(WT%)',
  'LA(PPM)', 'Y(PPM)', 'MGO(WT%)', 'PR(PPM)', 'CE(PPM)', 'ER(PPM)',
  'HO(PPM)', 'ND(PPM)', 'SM(PPM)', 'DY(PPM)', 'LU(PPM)', 'TB(PPM)',
  'GD(PPM)', 'YB(PPM)', 'EU(PPM)', 'TH(PPM)', 'AL2O3(WT%)', 'HF(PPM)',
  'ZR(PPM)', 'TIO2(WT%)', 'MNO(WT%)', 'V(PPM)', 'NB(PPM)', 'CR(PPM)',
  'TA(PPM)', 'FEOT(WT%)', 'CO(PPM)', 'NI(PPM)', 'SIO2(WT%)', 'P2O5(WT%)'
]

const CURRENT_ORDER = [
  'BACK-ARC_BASIN',
  'Continental arc',
  'CONTINENTAL FLOOD BASALT',
  'CONTINENTAL_RIFT',
  'Intra-oceanic arc',
  'Island arc',
  'OCEAN ISLAND',
  'OCEANIC PLATEAU',
  'SPREADING_CENTER'
]

const LEGACY_ORDER = [
  'BACK-ARC_BASIN',
  'CONTINENTAL FLOOD BASALT',
  'CONTINENTAL_RIFT',
  'Continental arc',
  'Intra-oceanic arc',
  'Island arc',
  'OCEAN ISLAND',
  'OCEANIC PLATEAU',
  'SPREADING_CENTER'
]

function parseCsv(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')
  const lines = text.split(/\r?\n/).filter(Boolean)
  const headers = lines[0].split(',').map(item => item.trim())
  const indexes = COLUMNS.map(column => headers.indexOf(column))

  return lines.slice(1).map(line => {
    const cells = line.split(',').map(item => item.trim())
    return indexes.map(index => Number(cells[index]) || 0)
  })
}

function buildInputs(rows) {
  const columnIndexMap = new Map(COLUMNS.map((name, index) => [name, index]))
  const imageBuffer = new Float32Array(rows.length * COLUMNS.length)
  const sequenceBuffer = new Float32Array(rows.length * SEQUENCE_COLUMNS.length)

  rows.forEach((row, rowIndex) => {
    for (let columnIndex = 0; columnIndex < COLUMNS.length; columnIndex += 1) {
      imageBuffer[rowIndex * COLUMNS.length + columnIndex] = (Number(row[columnIndex]) || 0) / 255
    }

    SEQUENCE_COLUMNS.forEach((columnName, sequenceIndex) => {
      const sourceIndex = columnIndexMap.get(columnName)
      sequenceBuffer[rowIndex * SEQUENCE_COLUMNS.length + sequenceIndex] = (Number(row[sourceIndex]) || 0) / 255
    })
  })

  return {
    imageTensor: new ort.Tensor('float32', imageBuffer, [rows.length, 1, 6, 6]),
    sequenceTensor: new ort.Tensor('float32', sequenceBuffer, [rows.length, SEQUENCE_COLUMNS.length, 1])
  }
}

function argmax(values, offset, length) {
  let bestIndex = 0
  let bestValue = values[offset]

  for (let index = 1; index < length; index += 1) {
    const value = values[offset + index]
    if (value > bestValue) {
      bestValue = value
      bestIndex = index
    }
  }

  return bestIndex
}

function summarize(rows, orders) {
  for (const { name, order } of orders) {
    let correct = 0
    const perClass = new Map()

    rows.forEach(row => {
      const predictedLabel = order[row.predictedIndex] || `class_${row.predictedIndex}`
      const item = perClass.get(row.trueLabel) || { total: 0, correct: 0, predicted: new Map() }
      item.total += 1
      item.predicted.set(predictedLabel, (item.predicted.get(predictedLabel) || 0) + 1)
      if (predictedLabel === row.trueLabel) {
        correct += 1
        item.correct += 1
      }
      perClass.set(row.trueLabel, item)
    })

    console.log(`\n=== ${name} ===`)
    console.log(`Overall: ${correct}/${rows.length} = ${(correct / rows.length * 100).toFixed(2)}%`)
    for (const [label, item] of perClass.entries()) {
      const topPredicted = [...item.predicted.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
      console.log(`${label}: ${item.correct}/${item.total} = ${(item.correct / item.total * 100).toFixed(2)}% | top: ${topPredicted.map(([key, value]) => `${key}:${value}`).join(', ')}`)
    }
  }
}

async function main() {
  // 中文注释：Node 环境使用 onnxruntime-web 的 wasm 后端，直接读取项目内模型文件。
  ort.env.wasm.numThreads = 1
  ort.env.wasm.proxy = false
  ort.env.wasm.wasmPaths = 'file:///E:/program/vue/tectnoic_setting_discrimination_front_V2/node_modules/onnxruntime-web/dist/'

  const session = await ort.InferenceSession.create(MODEL_FILE, { executionProviders: ['wasm'] })
  console.log('Inputs:', session.inputNames)
  console.log('Outputs:', session.outputNames)

  const inputNames = session.inputNames
  const outputName = session.outputNames[0]
  const results = []

  for (const item of FILES) {
    const rows = parseCsv(item.file)
    const batchSize = 1024

    for (let start = 0; start < rows.length; start += batchSize) {
      const batchRows = rows.slice(start, start + batchSize)
      const { imageTensor, sequenceTensor } = buildInputs(batchRows)
      const outputs = await session.run({
        [inputNames[0]]: imageTensor,
        [inputNames[1]]: sequenceTensor
      })
      const output = outputs[outputName]
      const classCount = output.dims[1]
      const values = Array.from(output.data)

      for (let index = 0; index < batchRows.length; index += 1) {
        results.push({
          trueLabel: item.label,
          predictedIndex: argmax(values, index * classCount, classCount)
        })
      }
    }

    console.log(`Done ${item.label}: ${rows.length}`)
  }

  summarize(results, [
    { name: 'Current frontend order', order: CURRENT_ORDER },
    { name: 'Legacy training order', order: LEGACY_ORDER }
  ])
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
