import { readFileSync, writeFileSync } from 'node:fs'

const SOURCE_CSV = 'E:\\program\\CNNtest\\data_interpolation\\models\\global_train_missforest_imputed_major_normalized.csv'
const OUTPUT_JSON = 'e:\\program\\vue\\tectnoic_setting_discrimination_front_V2\\public\\model\\imputation_stats.json'

// 中文注释：这里读取的是全局 MissForest 插补后的训练集分布，前端只需要轻量统计量即可。
const csvText = readFileSync(SOURCE_CSV, 'utf8').replace(/^\uFEFF/, '')
const [headerLine, ...dataLines] = csvText.split(/\r?\n/).filter(Boolean)
const columns = headerLine.split(',').map(item => item.trim())

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

const columnValues = Object.fromEntries(columns.map(column => [column, []]))

for (const line of dataLines) {
  const cells = line.split(',')
  columns.forEach((column, index) => {
    const value = Number.parseFloat(cells[index])
    if (Number.isFinite(value)) {
      columnValues[column].push(value)
    }
  })
}

const stats = {}
for (const column of columns) {
  const values = columnValues[column].sort((a, b) => a - b)
  stats[column] = {
    count: values.length,
    min: values[0] ?? null,
    q25: quantile(values, 0.25),
    median: quantile(values, 0.5),
    q75: quantile(values, 0.75),
    max: values[values.length - 1] ?? null
  }
}

const output = {
  version: 1,
  method: 'global_missforest_training_median',
  source: SOURCE_CSV,
  generatedAt: new Date().toISOString(),
  maxMissingFeaturesExclusive: 20,
  columns,
  stats
}

writeFileSync(OUTPUT_JSON, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
console.log(`imputation stats exported: ${OUTPUT_JSON}`)
