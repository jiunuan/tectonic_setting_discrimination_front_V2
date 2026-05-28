import { readFileSync, writeFileSync } from 'node:fs'

const SOURCE_CSV = 'E:\\program\\CNNtest\\data\\rockType\\basalt\\basalt_combine\\dataset_split_correct\\02_basalt_train_correct_imputed.csv'
const OUTPUT_JSON = 'e:\\program\\vue\\tectnoic_setting_discrimination_front_V2\\public\\model\\knn_reference.json'
const REFERENCE_SIZE = 6000

const MODEL_COLUMNS = [
  'NA2O(WT%)', 'MGO(WT%)', 'CR(PPM)', 'AL2O3(WT%)', 'SIO2(WT%)', 'P2O5(WT%)',
  'K2O(WT%)', 'CAO(WT%)', 'TIO2(WT%)', 'V(PPM)', 'MNO(WT%)', 'FEOT(WT%)',
  'RB(PPM)', 'SR(PPM)', 'Y(PPM)', 'NB(PPM)', 'CO(PPM)', 'NI(PPM)',
  'BA(PPM)', 'LA(PPM)', 'CE(PPM)', 'PR(PPM)', 'ND(PPM)', 'ZR(PPM)',
  'SM(PPM)', 'EU(PPM)', 'GD(PPM)', 'TB(PPM)', 'DY(PPM)', 'HO(PPM)',
  'TH(PPM)', 'ER(PPM)', 'YB(PPM)', 'LU(PPM)', 'HF(PPM)', 'TA(PPM)'
]

// 中文注释：从最终训练集插补结果抽样，作为前端 KNN 缺失值插补的轻量参考库。
const csvText = readFileSync(SOURCE_CSV, 'utf8').replace(/^\uFEFF/, '')
const [headerLine, ...dataLines] = csvText.split(/\r?\n/).filter(Boolean)
const headers = headerLine.split(',').map(item => item.trim())
const columnIndexes = MODEL_COLUMNS.map(columnName => {
  const index = headers.indexOf(columnName)
  if (index === -1) {
    throw new Error(`训练集缺少必要列: ${columnName}`)
  }
  return index
})

function quantile(sortedValues, q) {
  if (!sortedValues.length) return null

  const position = (sortedValues.length - 1) * q
  const base = Math.floor(position)
  const rest = position - base
  const next = sortedValues[base + 1]

  if (next === undefined) {
    return sortedValues[base]
  }

  return sortedValues[base] + rest * (next - sortedValues[base])
}

function roundValue(value) {
  return Number(value.toFixed(6))
}

const allRows = dataLines
  .map(line => {
    const cells = line.split(',')
    return columnIndexes.map(index => Number.parseFloat(cells[index]))
  })
  .filter(row => row.length === MODEL_COLUMNS.length && row.every(Number.isFinite))

const stride = Math.max(1, Math.floor(allRows.length / REFERENCE_SIZE))
const sampledRows = []
for (let index = 0; index < allRows.length && sampledRows.length < REFERENCE_SIZE; index += stride) {
  sampledRows.push(allRows[index].map(roundValue))
}

const stats = {}
MODEL_COLUMNS.forEach((column, columnIndex) => {
  const values = sampledRows
    .map(row => row[columnIndex])
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
  const q25 = quantile(values, 0.25)
  const q75 = quantile(values, 0.75)
  const iqr = q75 - q25

  stats[column] = {
    median: roundValue(quantile(values, 0.5)),
    q25: roundValue(q25),
    q75: roundValue(q75),
    scale: roundValue(Math.abs(iqr) > 1e-12 ? iqr : 1)
  }
})

const output = {
  version: 2,
  method: 'sampled_final_train_imputed_knn_reference',
  source: SOURCE_CSV,
  generatedAt: new Date().toISOString(),
  referenceSize: sampledRows.length,
  columns: MODEL_COLUMNS,
  k: 7,
  stats,
  rows: sampledRows
}

writeFileSync(OUTPUT_JSON, `${JSON.stringify(output)}\n`, 'utf8')
console.log(`knn reference exported: ${OUTPUT_JSON}`)
console.log(`rows: ${sampledRows.length}, columns: ${MODEL_COLUMNS.length}`)
