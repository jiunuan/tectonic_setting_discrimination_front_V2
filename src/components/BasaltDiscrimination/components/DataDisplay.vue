<template>
  <div class="data-display">
    <div class="table-header">
      <div class="header-left">
        <h3>{{ t('preview.title') }}</h3>
        <span v-if="filename" class="filename">
          {{ t('preview.currentFile') }}: {{ filename }}
        </span>
      </div>

      <div class="header-actions">
        <el-button
          type="primary"
          :loading="processing"
          :disabled="predictions.length > 0 || processedData.length > 0"
          :icon="Histogram"
          @click="$emit('process')"
        >
          {{ processing ? t('message.processing') : t('preview.process') }}
        </el-button>
        <el-button
          type="success"
          :loading="predicting"
          :disabled="(!processedData.length && !tableData.length) || predictions.length > 0"
          :icon="DataAnalysis"
          @click="$emit('predict')"
        >
          {{ predicting ? t('preview.predicting') : t('preview.predict') }}
        </el-button>
        <el-button
          type="warning"
          :disabled="!predictions.length"
          :icon="Download"
          @click="$emit('download')"
        >
          {{ t('preview.download') }}
        </el-button>
      </div>
    </div>

    <div v-if="predicting" class="predict-progress">
      <div class="predict-progress-head">
        <span>{{ t('preview.progressLabel') }}</span>
        <strong>{{ progressPercentage }}%</strong>
      </div>
      <el-progress
        :percentage="progressPercentage"
        :stroke-width="8"
        :show-text="false"
      />
    </div>

    <el-table
      :data="paginatedData"
      border
      max-height="270"
      v-loading="processing || predicting"
      class="result-table"
    >
      <el-table-column
        v-for="(col, index) in COLUMNS_TO_EXTRACT"
        :key="col"
        :prop="'col' + index"
        :label="col"
        width="150"
        show-overflow-tooltip
      />
      <el-table-column
        v-if="predictions.length"
        prop="prediction"
        :label="t('preview.prediction')"
        width="180"
        fixed="right"
        show-overflow-tooltip
      />
      <el-table-column
        v-if="predictions.length"
        prop="confidence"
        :label="t('preview.confidence')"
        width="120"
        fixed="right"
      />
    </el-table>

    <div class="pagination-row">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="props.tableData.length"
        layout="total, sizes, prev, pager, next, jumper"
        background
      />
    </div>

    <div v-if="predictions.length" class="charts-row">
      <div class="chart-card">
        <div ref="pieChartRef" class="chart"></div>
      </div>
      <div class="chart-card">
        <div ref="barChartRef" class="chart"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { DataAnalysis, Download, Histogram } from '@element-plus/icons-vue'
import { COLUMNS_TO_EXTRACT } from '../constants'
import { useCharts } from '../composables/useCharts'

const { t } = useI18n()

const props = defineProps({
  tableData: {
    type: Array,
    default: () => []
  },
  predictions: {
    type: Array,
    default: () => []
  },
  predicting: {
    type: Boolean,
    default: false
  },
  processing: {
    type: Boolean,
    default: false
  },
  processedData: {
    type: Array,
    default: () => []
  },
  progressPercentage: {
    type: Number,
    default: 0
  },
  filename: {
    type: String,
    default: ''
  }
})

defineEmits(['download', 'predict', 'process'])

const currentPage = ref(1)
const pageSize = ref(10)

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return props.tableData.slice(start, start + pageSize.value)
})

const { pieChartRef, barChartRef, initCharts, updateCharts } = useCharts(() => props.predictions)

const renderCharts = async (chartPredictions) => {
  if (!chartPredictions.length) return

  // 中文注释：预测结果出现后，先等待 v-if 下的图表容器渲染完成，再初始化 ECharts。
  await nextTick()
  initCharts()
  updateCharts(chartPredictions)
}

watch(
  () => props.predictions,
  newValue => {
    renderCharts(newValue)
  },
  { deep: true, flush: 'post' }
)

onMounted(() => {
  renderCharts(props.predictions)
})
</script>

<style scoped>
.data-display {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid #e3edf9;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.header-left h3 {
  margin: 0;
  font-size: 22px;
  color: #08235a;
  font-weight: 900;
}

.filename {
  font-size: 14px;
  color: #526f94;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.header-actions :deep(.el-button) {
  min-height: 44px;
  padding-inline: 18px;
  border-radius: 7px;
  font-size: 15px;
  font-weight: 800;
}

.predict-progress {
  padding: 14px 16px;
  border: 1px solid #cfe0f5;
  border-radius: 8px;
  background: linear-gradient(180deg, #f7fbff, #eef6ff);
}

.predict-progress-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #12366b;
  font-size: 15px;
  font-weight: 800;
}

.predict-progress-head strong {
  color: #0b66ff;
  font-size: 16px;
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.chart-card {
  min-height: 300px;
  padding: 10px;
  background: linear-gradient(180deg, #fff, #f8fbff);
  border: 1px solid #d8e6f7;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(28, 83, 149, 0.06);
}

.chart {
  width: 100%;
  height: 280px;
}

.result-table {
  width: 100%;
}

.result-table :deep(.el-table__header th) {
  background: #f1f6fd;
  color: #173a72;
  font-size: 14px;
  font-weight: 900;
}

.result-table :deep(.el-table__row td) {
  color: #163966;
  font-size: 14px;
}

.result-table :deep(.el-table__cell) {
  padding: 10px 0;
}
</style>
