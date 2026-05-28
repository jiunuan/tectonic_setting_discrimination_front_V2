import { MAJOR_ELEMENTS } from '../constants'

function isEmptyMajorValue(value) {
  return value === null || value === undefined || value === '' || Number.isNaN(Number(value))
}

export function calculateAnhydrousValues(rowData, columnNames) {
  // 中文注释：只对已有主量元素做无水归一化，缺失主量元素继续保留为 null，后续再用训练集统计量插补。
  let total = 0
  MAJOR_ELEMENTS.forEach(element => {
    const columnIndex = columnNames.indexOf(element)
    const value = rowData['col' + columnIndex]
    if (columnIndex !== -1 && !isEmptyMajorValue(value)) {
      total += Number(value) || 0
    }
  })

  const result = { ...rowData }
  MAJOR_ELEMENTS.forEach(element => {
    const columnIndex = columnNames.indexOf(element)
    if (columnIndex !== -1 && total > 0) {
      const originalValue = rowData['col' + columnIndex]
      if (isEmptyMajorValue(originalValue)) {
        result['col' + columnIndex] = null
        return
      }

      result['col' + columnIndex] = Number(((Number(originalValue) / total) * 100).toFixed(2))
    }
  })

  return result
}

export function addAnhydrousNormalizedData(tableData, columnNames) {
  return tableData.map(row => calculateAnhydrousValues(row, columnNames))
}
