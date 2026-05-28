<template>
  <el-dialog
    :model-value="visible"
    :title="t('upload.title')"
    width="32%"
    @close="handleClose"
  >
    <el-upload
      class="upload-box"
      drag
      :auto-upload="false"
      :show-file-list="false"
      accept=".csv,.xlsx,.xls"
      :on-change="handleUpload"
    >
      <el-icon class="upload-icon">
        <upload-filled />
      </el-icon>
      <div class="upload-text">
        {{ t('upload.drag') }}
        <em>{{ t('upload.click') }}</em>
      </div>
      <template #tip>
        <div class="upload-tip">{{ t('upload.tip') }}</div>
      </template>
    </el-upload>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import * as XLSX from 'xlsx'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { COLUMNS_TO_EXTRACT } from '../constants'

defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:visible', 'file-processed'])
const { t } = useI18n()
const processing = ref(false)

const handleClose = () => {
  emit('update:visible', false)
}

const readFileAsText = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = event => resolve(event.target.result)
  reader.onerror = error => reject(error)
  reader.readAsText(file)
})

const readFileAsArrayBuffer = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = event => resolve(event.target.result)
  reader.onerror = error => reject(error)
  reader.readAsArrayBuffer(file)
})

const sheetToRows = (workbook) => {
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils
    .sheet_to_json(sheet, { header: 1, defval: '', raw: true })
    // 中文注释：过滤完全空白的行，同时保留单元格中的合法 0 值。
    .filter(row => Array.isArray(row) && row.some(cell => String(cell).trim() !== ''))
}

const parseRows = async (file) => {
  const fileExt = file.name.toLowerCase().split('.').pop()

  if (fileExt === 'csv') {
    const text = await readFileAsText(file)
    // 中文注释：用标准 CSV 解析处理带引号逗号的字段，避免 REFERENCE 等文本列把经纬度列挤错位。
    const workbook = XLSX.read(text, { type: 'string', raw: true })
    return sheetToRows(workbook)
  }

  const buffer = await readFileAsArrayBuffer(file)
  const workbook = XLSX.read(buffer, { type: 'array' })
  return sheetToRows(workbook)
}

const parseChemicalValue = (cellValue, columnName) => {
  // 中文注释：LOI 允许缺省；其它元素空值先保留为 null，交给后续训练集统计量插补。
  if (cellValue === null || cellValue === undefined || String(cellValue).trim() === '') {
    return columnName === 'LOI(WT%)' ? 0 : null
  }

  const value = Number.parseFloat(cellValue)
  return Number.isNaN(value) ? null : value
}

// 识别经度列：支持 LONGITUDE / LON / LONG / X / 经度 等写法（不区分大小写）
const findCoordIndex = (headers, type) => {
  const patterns = type === 'lat'
    ? [/^latitude$/i, /^lat$/i, /^纬度$/, /^y$/i]
    : [/^longitude$/i, /^lon$/i, /^long$/i, /^经度$/, /^x$/i]
  for (const pat of patterns) {
    const idx = headers.findIndex(h => pat.test(h.trim()))
    if (idx !== -1) return idx
  }
  return -1
}

const handleUpload = async (uploadFile) => {
  if (processing.value) return false
  processing.value = true

  try {
    const rawFile = uploadFile.raw
    const rawData = await parseRows(rawFile)

    if (!rawData.length || !Array.isArray(rawData[0])) {
      throw new Error(t('upload.emptyFile'))
    }

    const headers = rawData[0].map(item => String(item).trim())
    // 列名归一化：去 (WT%) / (PPM) / 空格 / 下划线 / 连字符后转大写，
    // 这样 'SIO2'、'Sio2'、'SiO2'、'SIO2 (wt%)' 都能匹配 'SIO2(WT%)'
    const normalizeCol = s => String(s)
      .toUpperCase()
      .replace(/\(\s*WT\s*%?\s*\)|\(\s*PPM\s*\)|WT\s*%|PPM/gi, '')
      .replace(/[\s_\-]/g, '')
    const headerKeys = headers.map(normalizeCol)
    const columnIndices = COLUMNS_TO_EXTRACT.map(col => headerKeys.indexOf(normalizeCol(col)))

    const missingColumns = columnIndices
      .map((index, indexInList) => ({ index, indexInList }))
      .filter(item => item.index === -1 && COLUMNS_TO_EXTRACT[item.indexInList] !== 'LOI(WT%)')

    if (missingColumns.length > 0) {
      throw new Error(t('upload.missingColumns'))
    }

    const latIndex = findCoordIndex(headers, 'lat')
    const lonIndex = findCoordIndex(headers, 'lon')

    const data = []
    const coordinates = []
    for (let rowIndex = 1; rowIndex < rawData.length; rowIndex += 1) {
      const row = rawData[rowIndex]
      if (!row || !row.length) continue

      const values = columnIndices.map((index, indexInList) => {
        const columnName = COLUMNS_TO_EXTRACT[indexInList]
        if (columnName === 'LOI(WT%)' && index === -1) {
          return 0
        }

        return parseChemicalValue(row[index], columnName)
      })

      data.push(values)

      const lat = latIndex !== -1 ? parseFloat(row[latIndex]) : null
      const lon = lonIndex !== -1 ? parseFloat(row[lonIndex]) : null
      coordinates.push({
        lat: (lat !== null && !isNaN(lat)) ? lat : null,
        lon: (lon !== null && !isNaN(lon)) ? lon : null
      })
    }

    if (!data.length) {
      throw new Error(t('upload.noUsable'))
    }

    emit('file-processed', data, rawFile.name, coordinates)
    emit('update:visible', false)
    ElMessage.success(t('message.uploadSuccess'))
  } catch (error) {
    console.error('文件处理失败:', error)
    ElMessage.error(t('message.uploadError'))
  } finally {
    processing.value = false
  }

  return false
}
</script>

<style scoped>
.upload-box {
  padding: 8px 4px;
  /* 中文注释：上传弹窗内文本强制继承全局阿里巴巴普惠体。 */
  font-family: var(--app-font-family) !important;
}

.upload-icon {
  font-size: 42px;
  color: #409eff;
  margin-bottom: 10px;
}

.upload-text {
  font-family: var(--app-font-family) !important;
  font-size: 15px;
  color: #475569;
}

.upload-text em {
  font-family: var(--app-font-family) !important;
  color: #409eff;
  font-style: normal;
  margin-left: 4px;
}

.upload-tip {
  font-family: var(--app-font-family) !important;
  margin-top: 10px;
  color: #94a3b8;
  font-size: 13px;
}

:deep(.el-dialog__title),
:deep(.el-dialog__body),
:deep(.el-upload),
:deep(.el-upload *) {
  font-family: var(--app-font-family) !important;
}
</style>
