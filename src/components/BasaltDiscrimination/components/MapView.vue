<template>
  <div class="mv-root">
      <!-- 地图主体区域 -->
    <div class="mv-map-wrap" ref="mapWrap">
      <div ref="mapEl" class="mv-ol-map"></div>

      <!-- 额外控制按钮（叠加在 OL 缩放控件下方） -->
      <div class="mv-ctrl-extra">
        <button class="mv-ctrl-btn" :title="t('mapView.btnFit')" @click="fitToPoints">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 7V3h4M17 3h4v4M21 17v4h-4M7 21H3v-4"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button class="mv-ctrl-btn" :title="t('mapView.btnFullscreen')" @click="toggleFullscreen">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
        </button>
        <button class="mv-ctrl-btn" :title="t('mapView.btnExportImg')" @click="exportMapImage">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
        </button>
        <!-- <button class="mv-ctrl-btn" :title="t('mapView.btnExportGlobal', { zoom: globalExportZoom, w: 512 * 2 ** globalExportZoom, h: Math.round(512 * 2 ** globalExportZoom * 170.1022576 / 360) })" :disabled="globalExporting" @click="exportGlobalBasemap()">
          <svg v-if="!globalExporting" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="mv-spin"><path d="M21 12a9 9 0 1 1-6.2-8.55"/></svg>
        </button>
        <select v-model.number="globalExportZoom" class="mv-zoom-select" :title="t('mapView.zoomSelectTitle')">
          <option :value="3">z3</option>
          <option :value="4">z4</option>
        </select> -->
        <!-- <label class="mv-ctrl-check" title="导出时叠加样品点">
          <input type="checkbox" v-model="globalExportWithSamples" />
          <span>样品</span>
        </label> -->
      </div>

      <!-- 右上角：底图切换 -->
      <div class="mv-overlay-tr">
        <div v-if="showBasemapPanel" v-draggable class="mv-ol-card mv-basemap-card">
          <div class="mv-card-head drag-handle">
            <div class="mv-card-title">{{ t('mapView.basemapTitle') }}</div>
            <button class="mv-card-action" type="button" :title="t('mapView.collapse')" @click="showBasemapPanel = false">−</button>
          </div>
          <label v-for="bm in basemapDefs" :key="bm.key" class="mv-radio-row">
            <input type="radio" :value="bm.key" v-model="activeBasemap" @change="switchBasemap(bm.key)" />
            <span>{{ bm.label }}</span>
          </label>
          <div class="mv-proj-divider"></div>
          <div class="mv-card-title mv-proj-label">{{ t('mapView.projectionLabel') }}</div>
          <label class="mv-radio-row">
            <input type="radio" value="EPSG:3857" v-model="mapProjection" />
            <span>{{ t('mapView.projection3857') }}</span>
          </label>
          <label class="mv-radio-row">
            <input type="radio" value="EPSG:4326" v-model="mapProjection" />
            <span>{{ t('mapView.projection4326') }}</span>
          </label>
          <p class="mv-proj-hint" :title="t('mapView.projectionHint')">{{ t('mapView.projectionHint') }}</p>
        </div>
        <button v-else class="mv-panel-chip" type="button" @click="showBasemapPanel = true">{{ t('mapView.basemapChip') }}</button>
      </div>

      <!-- 左下角：预测构造环境图例 -->
      <div class="mv-overlay-bl">
        <div v-draggable class="mv-ol-card mv-legend-card">
          <div class="mv-card-head drag-handle">
            <div class="mv-card-title">{{ t('mapView.legendTitle') }}</div>
          </div>
          <div v-for="item in legendItems" :key="item.label" class="mv-leg-row">
            <span class="mv-leg-dot" :style="{ background: item.color }"></span>
            <span class="mv-leg-label">{{ item.zhLabel }}</span>
          </div>
          <!-- <div v-if="hasUnpredicted" class="mv-leg-row">
            <span class="mv-leg-dot" style="background:#94a3b8"></span>
            <span class="mv-leg-label">{{ t('mapView.legendOther') }}</span>
          </div> -->
        </div>
      </div>

      <!-- 底部状态栏 -->
      <div class="mv-statusbar">
        <span>{{ t('mapView.statusLon') }}: {{ coord.lon }}°E</span>
        <span class="mv-sep">·</span>
        <span>{{ t('mapView.statusLat') }}: {{ coord.lat }}°N</span>
        <span class="mv-sep">·</span>
        <span>{{ t('mapView.statusZoom') }}: {{ zoom }}</span>
        <span class="mv-sep">·</span>
        <span>{{ t('mapView.statusBasemap') }}: {{ activeBasemapLabel }}</span>
      </div>

      <!-- 样品弹窗 -->
      <div ref="popupEl" v-draggable class="mv-popup" :class="{ show: popup.show }">
        <button class="mv-popup-close" @click="closePopup">×</button>
        <div class="mv-popup-title drag-handle">{{ t('mapView.popupSample') }}: {{ popup.sampleId }}</div>
        <div class="mv-popup-body">
          <div class="mv-popup-row">
            <span>{{ t('mapView.popupType') }}:</span>
            <strong :style="{ color: popup.color }">{{ popup.zhLabel }}</strong>
          </div>
          <div v-if="popup.confidence !== null" class="mv-popup-row">
            <span>{{ t('mapView.popupConf') }}:</span>
            <strong>{{ popup.confidence }}%</strong>
          </div>
          <div class="mv-popup-row">
            <span>{{ t('mapView.popupSource') }}:</span>
            <strong>{{ popup.source }}</strong>
          </div>
          <template v-if="popup.elements.length">
            <div class="mv-els-title">{{ t('mapView.popupElements') }}</div>
            <div class="mv-els-grid">
              <div v-for="el in popup.elements" :key="el.name" class="mv-el-col">
                <span>{{ el.name }}</span>
                <strong>{{ el.val }}</strong>
              </div>
            </div>
          </template>
          <!-- <button class="mv-popup-detail" type="button">{{ t('mapView.popupDetail') }}</button> -->
        </div>
      </div>

      <!-- 无坐标提示 -->
      <div v-if="mappedCount === 0" class="mv-no-coords">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        <p>{{ t('mapView.noCoordTitle') }}</p>
        <span>{{ t('mapView.noCoordHint') }}</span>
      </div>

      <!-- 底部：悬浮统计卡片 -->
      <div class="mv-floating-stats" :class="{ collapsed: !showStatsPanel }">
        <button
          v-if="!showStatsPanel"
          class="mv-panel-chip mv-stats-chip"
          type="button"
          @click="showStatsPanel = true"
        >
          {{ t('mapView.statsChip') }}
        </button>
        <template v-else>
          <!-- 构造环境占比 -->
          <div v-draggable class="mv-chart-card mv-glass-card">
            <div class="mv-card-head drag-handle">
              <div class="mv-chart-title">{{ t('mapView.chartPie') }}</div>
              <button class="mv-card-action" type="button" :title="t('mapView.collapseStats')" @click="showStatsPanel = false">−</button>
            </div>
            <div class="mv-pie-layout">
              <div class="mv-pie-left">
                <div ref="pieEl" class="mv-pie-dom"></div>
                <div class="mv-pie-center-text">
                  <div>{{ t('mapView.totalSamples') }}</div>
                  <strong>{{ validCount.toLocaleString() }}</strong>
                  <div v-if="mappedCount !== validCount" class="mv-pie-mapped">
                    {{ t('mapView.mappedHint', { n: mappedCount.toLocaleString() }) }}
                  </div>
                </div>
              </div>
              <div class="mv-pie-right">
                <div v-for="item in sortedChartData" :key="item.label" class="mv-pie-row">
                  <span class="mv-leg-dot" :style="{ background: item.color }"></span>
                  <span class="mv-pie-name">{{ item.zhLabel }}</span>
                  <span class="mv-pie-pct">{{ item.percent }}%</span>
                  <span class="mv-pie-cnt">({{ item.count.toLocaleString() }})</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 样品数量统计 -->
          <div v-draggable class="mv-chart-card mv-glass-card">
            <div class="mv-card-head drag-handle">
              <div class="mv-chart-title">{{ t('mapView.chartBar') }}</div>
              <button class="mv-card-action" type="button" :title="t('mapView.collapseStats')" @click="showStatsPanel = false">−</button>
            </div>
            <div ref="barEl" class="mv-bar-dom"></div>
          </div>

          <!-- 区域分布概览 -->
          <div v-draggable class="mv-chart-card mv-region-card mv-glass-card">
            <div class="mv-card-head drag-handle">
              <div class="mv-chart-title">{{ t('mapView.chartRegion') }}</div>
              <button class="mv-card-action" type="button" :title="t('mapView.collapseStats')" @click="showStatsPanel = false">−</button>
            </div>
            <div class="mv-region-wrap">
              <div class="mv-region-geo">
                <!-- 中文注释：按设计稿使用浅灰真实世界底图，突出上层区域统计气泡。 -->
                <img class="mv-region-design-map" :src="REGION_OVERVIEW_MAP_URL" alt="" aria-hidden="true" />
                <div
                  v-for="r in regionItems"
                  :key="r.name"
                  class="mv-region-item"
                  :class="{ zero: r.count === 0 }"
                  :style="[r.pos, { '--region-color': r.color }]"
                >
                  <strong>{{ r.name }}</strong>
                  <span>{{ r.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Cluster from 'ol/source/Cluster'
import XYZ from 'ol/source/XYZ'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style'
import { fromLonLat, toLonLat, get as getProjection } from 'ol/proj'
import { defaults as defaultControls } from 'ol/control'
import Overlay from 'ol/Overlay'
import 'ol/ol.css'
import { TECTONIC_COLORS, TECTONIC_SETTINGS } from '../constants'

const props = defineProps({
  fileData: { type: Array, default: () => [] },
  predictions: { type: Array, default: () => [] },
  coordinates: { type: Array, default: () => [] },
  tectonicFilter: { type: String, default: '' },
  confidenceThreshold: { type: Number, default: 0 },
  displayCluster: { type: Boolean, default: false },
  colorByType: { type: Boolean, default: true },
  showPopupEnabled: { type: Boolean, default: true },
  showSampleLayer: { type: Boolean, default: true },
  filename: { type: String, default: '' }
})

const { t, tm } = useI18n()

// settings 的 key 含空格/连字符，走 t() 的 keypath 解析不可靠，统一用 tm() + 索引
const localizeSetting = (label) => {
  const dict = tm('settings')
  return (dict && dict[label]) || label
}

// 中文注释：地图浮层通用拖拽指令。
// 使用 transform:translate 累积位移：元素始终保持在文档流中的原位置，
// 仅做视觉位移，因此 (a) 不会脱流导致原位置镂空 (b) 不会让兄弟节点重排。
// 5px 阈值避免单纯点击就触发拖动。
const vDraggable = {
  mounted(el) {
    const interactiveSelector = 'button,input,select,textarea,a,label'
    const THRESHOLD = 5
    let startX = 0, startY = 0
    let accumX = 0, accumY = 0           // 上次拖动结束后的累计偏移
    let dragging = false
    let baseTransform = ''                // 元素已有的非 translate transform，需要保留

    const applyTransform = (tx, ty) => {
      const t = `translate(${tx}px, ${ty}px)`
      el.style.transform = baseTransform ? `${baseTransform} ${t}` : t
    }

    const onPointerMove = (event) => {
      const dx = event.clientX - startX
      const dy = event.clientY - startY

      if (!dragging) {
        if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) return
        dragging = true
        el.style.willChange = 'transform'
        el.style.zIndex = '999'
        el.classList.add('mv-dragging')
      }
      applyTransform(accumX + dx, accumY + dy)
    }

    const stopDrag = (event) => {
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', stopDrag)
      if (dragging) {
        accumX += event.clientX - startX
        accumY += event.clientY - startY
        el.classList.remove('mv-dragging')
        el.style.willChange = ''
      }
      dragging = false
    }

    const startDrag = (event) => {
      const handle = event.target.closest('.drag-handle')
      if (event.button !== 0 || !handle || !el.contains(handle) || event.target.closest(interactiveSelector)) return

      startX = event.clientX
      startY = event.clientY
      // 第一次拖动时记录元素已有的 transform（如 translate(-50%,-50%) 之类的居中变换）
      if (!baseTransform) {
        const inline = el.style.transform
        if (inline && !inline.includes('translate(')) {
          baseTransform = inline
        } else if (!inline) {
          const computed = getComputedStyle(el).transform
          if (computed && computed !== 'none') baseTransform = computed
        }
      }

      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', stopDrag)
      event.stopPropagation()
      event.preventDefault()
    }

    el.__dragStart__ = startDrag
    el.addEventListener('pointerdown', startDrag)
  },
  unmounted(el) {
    if (el.__dragStart__) {
      el.removeEventListener('pointerdown', el.__dragStart__)
      delete el.__dragStart__
    }
  }
}

// ─── DOM refs ────────────────────────────────────────────────────────────────
const mapEl = ref(null)
const mapWrap = ref(null)
const popupEl = ref(null)
const pieEl = ref(null)
const barEl = ref(null)

// ─── OL instances ────────────────────────────────────────────────────────────
let map = null
let vectorSource = null
let clusterSource = null
let vectorLayer = null
let popupOverlay = null
let baseLayers = {}
let pieChart = null
let barChart = null
let resizeObserver = null

// ─── Reactive state ──────────────────────────────────────────────────────────
const activeBasemap = ref('ocean')
const coord = reactive({ lon: '0.000', lat: '0.000' })
const zoom = ref(2)
const showBasemapPanel = ref(true)
const showStatsPanel = ref(true)
// 'EPSG:4326' = 等距矩形扁长但前端实时重投影；'EPSG:3857' = 原生瓦片投影，流畅但世界正方形
const mapProjection = ref('EPSG:4326')
const globalExportZoom = ref(3)
const globalExporting = ref(false)
const globalExportWithSamples = ref(false)

// 仅 Esri ArcGIS MapServer 提供 export 端点，可让服务端直接输出 EPSG:4326 PNG。
// CartoDB 等 XYZ 源没有此能力（仅有 3857 瓦片），暂不支持 4326 导出。
const ARCGIS_EXPORT_ENDPOINT = {
  ocean: 'https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/export',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export'
}
const popup = reactive({
  show: false, sampleId: '', zhLabel: '', confidence: null,
  color: '#94a3b8', source: 'GEOROC', elements: []
})

// ─── Basemap definitions ─────────────────────────────────────────────────────
const BASEMAP_KEYS = ['ocean', 'satellite', 'voyager', 'positron', 'dark']
const basemapDefs = computed(() => BASEMAP_KEYS.map(key => ({ key, label: t(`basemap.${key}`) })))

const activeBasemapLabel = computed(() => t(`basemap.${activeBasemap.value}`))

// 中文注释：区域分布概览使用 public/Mapamundi.png 作为浅色世界底图。
const REGION_OVERVIEW_MAP_URL = `${import.meta.env.BASE_URL || '/'}Mapamundi.png`.replace(/\/+/g, '/')

// ─── Continent detection ──────────────────────────────────────────────────────
// 用稳定 key 作为 continent 内部标识，UI 渲染时再走 t()
function getContinent(lat, lon) {
  if (lat >= 35 && lat <= 72 && lon >= -25 && lon <= 45) return 'europe'
  if (lat >= -35 && lat <= 37 && lon >= -20 && lon <= 55) return 'africa'
  if (lat >= 15 && lat <= 84 && lon >= -170 && lon <= -52) return 'northAmerica'
  if (lat >= -60 && lat <= 15 && lon >= -82 && lon <= -34) return 'southAmerica'
  if (lat >= -50 && lat <= 10 && lon >= 112 && lon <= 180) return 'oceania'
  if (lat >= -10 && lat <= 77 && lon >= 25 && lon <= 180) return 'asia'
  return 'other'
}

// ─── Filtered data ────────────────────────────────────────────────────────────
// filteredAll：按构造类型 + 置信度阈值 + label 合法性过滤，不要求坐标。
//   → 给统计图表（饼图、柱状图、区域分布）使用，反映"全部预测"的分布。
// filteredData：filteredAll 再叠加"坐标必须有效"，只给地图层使用。
// 这样太古代等坐标缺失普遍的数据集，图表不会被坐标缺失"稀释"。
const filteredAll = computed(() => {
  const total = Math.max(props.predictions.length, props.coordinates.length, props.fileData.length)
  const list = []
  for (let i = 0; i < total; i++) {
    list.push({
      coord: props.coordinates[i],
      index: i,
      row: props.fileData[i],
      pred: props.predictions[i] || null
    })
  }
  return list.filter(({ pred }) => {
    if (props.tectonicFilter && pred?.label !== props.tectonicFilter) return false
    if (props.predictions.length && pred && pred.confidence !== undefined) {
      if (pred.confidence * 100 < props.confidenceThreshold) return false
    }
    if (props.predictions.length) {
      if (!pred?.label || !TECTONIC_COLORS[pred.label]) return false
    }
    return true
  })
})

const filteredData = computed(() =>
  filteredAll.value.filter(({ coord }) =>
    coord && coord.lat !== null && coord.lon !== null && !isNaN(coord.lat) && !isNaN(coord.lon)
  )
)

const validCount = computed(() => filteredAll.value.length)
const mappedCount = computed(() => filteredData.value.length)

// ─── Legend items ─────────────────────────────────────────────────────────────
const tectonicCounts = computed(() => {
  const counts = {}
  filteredAll.value.forEach(({ pred }) => {
    const label = pred?.label || '__none__'
    counts[label] = (counts[label] || 0) + 1
  })
  return counts
})

const legendItems = computed(() =>
  TECTONIC_SETTINGS
    .filter(label => TECTONIC_COLORS[label])
    .map(label => ({
      label,
      count: tectonicCounts.value[label] || 0,
      zhLabel: localizeSetting(label),
      color: TECTONIC_COLORS[label]
    }))
)

const hasUnpredicted = computed(() =>
  filteredAll.value.some(({ pred }) => !pred?.label)
)

// ─── Chart data ───────────────────────────────────────────────────────────────
const sortedChartData = computed(() => {
  const total = validCount.value || 1
  return legendItems.value
    .filter(item => item.count > 0)
    .map(item => ({
      ...item,
      percent: ((item.count / total) * 100).toFixed(1)
    }))
    .sort((a, b) => b.count - a.count)
})

// ─── Region items ─────────────────────────────────────────────────────────────
const regionItems = computed(() => {
  const counts = { asia: 0, europe: 0, northAmerica: 0, southAmerica: 0, africa: 0, oceania: 0 }
  filteredData.value.forEach(({ coord }) => {
    const c = getContinent(coord.lat, coord.lon)
    if (counts[c] !== undefined) counts[c]++
  })
  return [
    { name: t('continent.europe'),       count: counts.europe,       color: '#8fbdf4', pos: { top: '20%', left: '56%' } },
    { name: t('continent.asia'),         count: counts.asia,         color: '#a9e2b6', pos: { top: '27%', left: '76%' } },
    { name: t('continent.northAmerica'), count: counts.northAmerica, color: '#9ec9f6', pos: { top: '28%', left: '20%' } },
    { name: t('continent.southAmerica'), count: counts.southAmerica, color: '#e7c4f0', pos: { top: '70%', left: '28%' } },
    { name: t('continent.africa'),       count: counts.africa,       color: '#f7df8c', pos: { top: '58%', left: '54%' } },
    { name: t('continent.oceania'),      count: counts.oceania,      color: '#99bef6', pos: { top: '72%', left: '86%' } }
  ]
})

// ─── OL feature building ──────────────────────────────────────────────────────
function buildFeatures() {
  return filteredData.value.map(({ coord, index, pred }) => {
    const color = pred?.label && props.colorByType
      ? (TECTONIC_COLORS[pred.label] || '#94a3b8')
      : '#94a3b8'
    // 几何坐标按当前 view 投影选取：4326 直接 [lon, lat]；3857 需 fromLonLat
    const xy = mapProjection.value === 'EPSG:4326'
      ? [coord.lon, coord.lat]
      : fromLonLat([coord.lon, coord.lat])
    const f = new Feature({ geometry: new Point(xy), index, color, pred })
    return f
  })
}

function getDominantClusterColor(features) {
  if (!props.colorByType) return '#94a3b8'

  const counts = {}
  features.forEach(f => {
    const label = f.get('pred')?.label
    if (label && TECTONIC_COLORS[label]) {
      counts[label] = (counts[label] || 0) + 1
    }
  })

  const dominantLabel = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
  return dominantLabel ? TECTONIC_COLORS[dominantLabel] : '#94a3b8'
}

function getClusterStyle(feature) {
  const features = feature.get('features')
  const size = features.length

  if (size === 1) {
    const color = features[0].get('color') || '#94a3b8'
    return new Style({
      image: new CircleStyle({
        radius: 7,
        fill: new Fill({ color: color + 'cc' }),
        stroke: new Stroke({ color: '#fff', width: 1.8 })
      })
    })
  }

  const clusterColor = getDominantClusterColor(features)
  const radius = Math.min(10 + Math.log2(size) * 4, 28)

  return new Style({
    image: new CircleStyle({
      radius,
      fill: new Fill({ color: clusterColor + 'dd' }),
      stroke: new Stroke({ color: '#fff', width: 2 })
    }),
    text: new Text({
      text: size.toString(),
      fill: new Fill({ color: '#fff' }),
      font: `bold ${radius > 18 ? 13 : 11}px "PingFang SC", "Microsoft YaHei", sans-serif`
    })
  })
}

// ─── Map initialization ───────────────────────────────────────────────────────
function initMap() {
  if (!mapEl.value) return

  // 中文注释：默认使用 Esri World Ocean Base。
  // wrapX:false 禁止瓦片在水平方向上无限重复，缩到比世界宽更小的级别时两侧显示空白，
  // 而不是把世界图拷贝多份拼接。
  const oceanBaseLayer = new TileLayer({
    source: new XYZ({
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
      attributions: 'Esri, GEBCO, Garmin',
      crossOrigin: 'anonymous',
      wrapX: false
    }),
    visible: true
  })

  // Tile layers
  baseLayers = {
    ocean: oceanBaseLayer,
    voyager: new TileLayer({
      source: new XYZ({ url: 'https://{a-c}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', attributions: '© CartoDB', crossOrigin: 'anonymous', wrapX: false }),
      visible: false
    }),
    satellite: new TileLayer({
      source: new XYZ({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attributions: '© Esri', crossOrigin: 'anonymous', wrapX: false }),
      visible: false
    }),
    positron: new TileLayer({
      source: new XYZ({ url: 'https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', attributions: '© CartoDB', crossOrigin: 'anonymous', wrapX: false }),
      visible: false
    }),
    dark: new TileLayer({
      source: new XYZ({ url: 'https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', attributions: '© CartoDB', crossOrigin: 'anonymous', wrapX: false }),
      visible: false
    })
  }

  // wrapX:false 让样品点只渲染一份，避免随底图世界拷贝在两侧重复
  vectorSource = new VectorSource({ features: buildFeatures(), wrapX: false })
  clusterSource = new Cluster({ source: vectorSource, distance: 40, wrapX: false })

  vectorLayer = new VectorLayer({
    source: props.displayCluster ? clusterSource : vectorSource,
    style: props.displayCluster ? getClusterStyle : singleStyle,
    visible: props.showSampleLayer,
    zIndex: 10
  })

  popupOverlay = new Overlay({
    element: popupEl.value,
    positioning: 'bottom-left',
    stopEvent: true,
    // 不自动平移地图，避免点击样品点时弹窗触发地图下移
    autoPan: false,
    offset: [12, -12]
  })

  map = new Map({
    target: mapEl.value,
    controls: defaultControls({ attribution: false, rotate: false }),
    layers: [...Object.values(baseLayers), vectorLayer],
    overlays: [popupOverlay],
    // 投影按当前 mapProjection 选取：
    //   - 'EPSG:4326'：等距矩形，世界扁长 2:1，但底图需要前端重投影（卡）
    //   - 'EPSG:3857'：原生 Web Mercator，瓦片直出，流畅但世界正方形
    view: (() => {
      const proj = mapProjection.value
      const useGeo = proj === 'EPSG:4326'
      return new View({
        projection: proj,
        center: useGeo ? [20, 20] : fromLonLat([20, 20]),
        zoom: 2,
        minZoom: useGeo ? 1 : 0,
        maxZoom: 18,
        constrainResolution: false,
        multiWorld: true,
        constrainOnlyCenter: true
      })
    })()
  })

  // Events
  map.on('click', handleMapClick)
  map.on('pointermove', handlePointerMove)
  map.getView().on('change:resolution', () => {
    zoom.value = Math.round(map.getView().getZoom())
  })

  if (vectorSource.getFeatures().length > 0) {
    setTimeout(fitToPoints, 150)
  }
}

// 切换投影时整个 map / view / layers 都要重建（OL View 投影不可热修改）
function rebuildMap() {
  if (!map) { initMap(); return }
  // 记录当前可视范围（统一以经纬度为媒介），重建后还原
  const view = map.getView()
  const prevCenter = view.getCenter()
  const wasGeo = view.getProjection().getCode() === 'EPSG:4326'
  const centerLonLat = wasGeo ? prevCenter : toLonLat(prevCenter)
  const prevZoom = view.getZoom()

  // 关弹窗 + 释放资源
  closePopup()
  map.setTarget(null)
  map = null
  vectorSource = null
  clusterSource = null
  vectorLayer = null
  popupOverlay = null
  baseLayers = {}

  initMap()
  // initMap 内部会按 mapProjection.value 配置 view；现在覆盖回上一次的 center/zoom
  if (map) {
    const v = map.getView()
    const useGeo = mapProjection.value === 'EPSG:4326'
    v.setCenter(useGeo ? centerLonLat : fromLonLat(centerLonLat))
    v.setZoom(prevZoom)
    setTimeout(() => map?.updateSize(), 80)
  }
}

function singleStyle(feature) {
  const color = feature.get('color') || '#94a3b8'
  return new Style({
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({ color: color + 'cc' }),
      stroke: new Stroke({ color: '#fff', width: 1.8 })
    })
  })
}

function handleMapClick(evt) {
  if (!props.showPopupEnabled) { closePopup(); return }
  const feature = map.forEachFeatureAtPixel(evt.pixel, f => f, { hitTolerance: 8 })
  if (!feature) { closePopup(); return }

  const features = feature.get('features') || [feature]
  const f = features[0]
  const idx = f.get('index')
  const pred = f.get('pred')
  const row = props.fileData[idx]

  const baseName = props.filename ? props.filename.replace(/\.\w+$/, '').toUpperCase() : 'SAMPLE'
  popup.sampleId = `${baseName}_${String(idx + 1).padStart(4, '0')}`
  popup.zhLabel = pred?.label ? localizeSetting(pred.label) : t('mapView.unknown')
  popup.color = TECTONIC_COLORS[pred?.label] || '#94a3b8'
  popup.confidence = pred?.confidence != null ? (pred.confidence * 100).toFixed(2) : null
  popup.source = row?.source || row?.SOURCE || row?.Source || 'GEOROC'
  popup.elements = row ? [
    { name: 'SiO₂',  val: row.col3  != null ? Number(row.col3).toFixed(2)  : '--' },
    { name: 'TiO₂',  val: row.col7  != null ? Number(row.col7).toFixed(2)  : '--' },
    { name: 'Al₂O₃', val: row.col2  != null ? Number(row.col2).toFixed(2)  : '--' },
    { name: 'FeO*',   val: row.col9  != null ? Number(row.col9).toFixed(2)  : '--' },
    { name: 'MgO',    val: row.col1  != null ? Number(row.col1).toFixed(2)  : '--' },
    { name: 'CaO',    val: row.col6  != null ? Number(row.col6).toFixed(2)  : '--' },
    { name: 'Na₂O',   val: row.col0  != null ? Number(row.col0).toFixed(2)  : '--' },
    { name: 'K₂O',    val: row.col5  != null ? Number(row.col5).toFixed(2)  : '--' }
  ] : []

  const geom = features.length === 1
    ? f.getGeometry().getCoordinates()
    : feature.getGeometry().getCoordinates()
  popupOverlay.setPosition(geom)
  popup.show = true
}

function handlePointerMove(evt) {
  // 3857 view 下 coordinate 是米单位，需要 toLonLat
  const lonLat = mapProjection.value === 'EPSG:4326'
    ? evt.coordinate
    : toLonLat(evt.coordinate)
  coord.lon = lonLat[0].toFixed(3)
  coord.lat = lonLat[1].toFixed(3)
  const hit = map.hasFeatureAtPixel(evt.pixel, { hitTolerance: 8 })
  mapEl.value.style.cursor = hit ? 'pointer' : ''
}

function closePopup() {
  popup.show = false
  popupOverlay.setPosition(undefined)
}

function fitToPoints() {
  if (!map) return
  // 没有有效样品点时退化为 fit 到全球范围，方便用户查看世界全图
  if (!vectorSource || vectorSource.getFeatures().length === 0) {
    const view = map.getView()
    view.setCenter(mapProjection.value === 'EPSG:4326' ? [0, 20] : fromLonLat([0, 20]))
    view.setZoom(1)
    return
  }
  const extent = vectorSource.getExtent()
  map.getView().fit(extent, { padding: [80, 80, 80, 80], maxZoom: 10, duration: 500 })
}

function switchBasemap(key) {
  Object.keys(baseLayers).forEach(k => baseLayers[k].setVisible(k === key))
}

function toggleFullscreen() {
  const el = mapWrap.value
  if (!document.fullscreenElement) {
    el.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

function exportMapImage() {
  return new Promise((resolve, reject) => {
    if (!map) {
      reject(new Error(t('message.mapNotReady')))
      return
    }

    closePopup()
    map.once('rendercomplete', () => {
      try {
        const size = map.getSize()
        const mapCanvas = document.createElement('canvas')
        mapCanvas.width = size[0]
        mapCanvas.height = size[1]
        const mapContext = mapCanvas.getContext('2d')

        // 中文注释：按 OpenLayers 官方方式合成当前各图层 canvas，保留底图与样品点。
        mapEl.value.querySelectorAll('.ol-layer canvas, canvas.ol-layer').forEach(canvas => {
          if (canvas.width <= 0 || canvas.height <= 0) return

          const opacity = canvas.parentNode?.style.opacity || canvas.style.opacity
          mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity)

          const transform = canvas.style.transform
          const matrix = transform
            ? transform.match(/^matrix\(([^)]*)\)$/)?.[1].split(',').map(Number)
            : null
          if (matrix) {
            mapContext.setTransform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5])
          } else {
            mapContext.setTransform(1, 0, 0, 1, 0, 0)
          }

          const backgroundColor = canvas.parentNode?.style.backgroundColor
          if (backgroundColor) {
            mapContext.fillStyle = backgroundColor
            mapContext.fillRect(0, 0, canvas.width, canvas.height)
          }
          mapContext.drawImage(canvas, 0, 0)
        })

        mapContext.setTransform(1, 0, 0, 1, 0, 0)
        mapContext.globalAlpha = 1
        mapCanvas.toBlob(blob => {
          if (!blob) {
            reject(new Error(t('message.mapImgGenFail')))
            return
          }
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          const baseName = props.filename ? props.filename.replace(/\.\w+$/, '') : 'spatial'
          link.href = url
          link.download = `${baseName}_map_${new Date().toISOString().slice(0, 10)}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          resolve(true)
        }, 'image/png')
      } catch (error) {
        reject(error)
      }
    })
    map.renderSync()
  })
}

// Esri World Ocean / Imagery 瓦片源原生范围只到 ±85.0511°（Web Mercator 极限），
// 导出时用这个纬度上下界，避免两极出现拉伸空白。
const WORLD_LAT_LIMIT = 85.05112878

// EPSG:4326 等距矩形下，经纬度到画布像素是线性映射：
//   x = (lon + 180) / 360 * width
//   y = (LAT_LIMIT - lat) / (2 * LAT_LIMIT) * height
// 半径按图像宽度按比例缩放，保证 z3/z4 输出都清晰可辨。
function drawSamplesOnCanvas(ctx, width, height) {
  const radius = Math.max(3, Math.round(width / 600))
  const stroke = Math.max(1, Math.round(width / 1800))
  ctx.save()
  ctx.lineWidth = stroke
  ctx.strokeStyle = '#ffffff'
  filteredData.value.forEach(({ coord, pred }) => {
    if (coord.lat > WORLD_LAT_LIMIT || coord.lat < -WORLD_LAT_LIMIT) return
    const color = pred?.label && props.colorByType
      ? (TECTONIC_COLORS[pred.label] || '#94a3b8')
      : '#94a3b8'
    const x = (coord.lon + 180) / 360 * width
    const y = (WORLD_LAT_LIMIT - coord.lat) / (2 * WORLD_LAT_LIMIT) * height
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = color + 'cc'
    ctx.fill()
    ctx.stroke()
  })
  ctx.restore()
}

// ─── Export full-world basemap as EPSG:4326 PNG ───────────────────────────────
// 思路：请求 ArcGIS MapServer 的 export 端点，bboxSR/imageSR 同时设为 4326，
// 服务器端完成 3857→4326 重投影并返回 PNG；前端只负责（必要时）分块和拼接。
// 输出图像尺寸：4326 全球是 360°×180° = 2:1 比例。
//   z=3 → 4096×2048（单次请求即可）
//   z=4 → 8192×4096（超 ArcGIS 单次 4096 上限，分 2×2 块请求后拼接）
async function exportGlobalBasemap(zoomLevel = globalExportZoom.value) {
  const endpoint = ARCGIS_EXPORT_ENDPOINT[activeBasemap.value]
  if (!endpoint) {
    ElMessage.error(t('message.globalExportUnsupported'))
    return
  }
  if (globalExporting.value) return
  globalExporting.value = true

  // 总宽度：z=3 → 4096；z=4 → 8192
  // 总高度：按真实纬度跨度 2*WORLD_LAT_LIMIT 与经度 360 的比例，
  // 而不是强制 2:1，否则两极会出现 Esri 瓦片源没覆盖的空白带。
  const fullWidth = 256 * (2 ** zoomLevel) * 2
  const fullHeight = Math.round(fullWidth * (2 * WORLD_LAT_LIMIT) / 360)
  // ArcGIS export 单次最大 4096px，超出就分块
  const maxSide = 4096
  const cols = Math.ceil(fullWidth / maxSide)
  const rows = Math.ceil(fullHeight / maxSide)
  const tileW = fullWidth / cols
  const tileH = fullHeight / rows
  const lonStep = 360 / cols
  const latStep = (2 * WORLD_LAT_LIMIT) / rows

  const canvas = document.createElement('canvas')
  canvas.width = fullWidth
  canvas.height = fullHeight
  const ctx = canvas.getContext('2d')

  const loadBlock = (c, r) => new Promise((resolve, reject) => {
    const minLon = -180 + c * lonStep
    const maxLon = minLon + lonStep
    // 图像 y=0 在顶（北纬最大），第 r 行对应 maxLat = WORLD_LAT_LIMIT - r*latStep
    const maxLat = WORLD_LAT_LIMIT - r * latStep
    const minLat = maxLat - latStep
    const params = new URLSearchParams({
      bbox: `${minLon},${minLat},${maxLon},${maxLat}`,
      bboxSR: '4326',
      imageSR: '4326',
      size: `${tileW},${tileH}`,
      format: 'png32',
      transparent: 'false',
      f: 'image'
    })
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      ctx.drawImage(img, c * tileW, r * tileH, tileW, tileH)
      resolve()
    }
    img.onerror = () => reject(new Error(`${t('message.tileLoadFail')} (bbox ${minLon},${minLat},${maxLon},${maxLat})`))
    img.src = `${endpoint}?${params.toString()}`
  })

  try {
    const tasks = []
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        tasks.push(loadBlock(c, r))
      }
    }
    ElMessage.info(t('message.globalExportFetching', { count: tasks.length }))
    await Promise.all(tasks)

    // 可选：把当前筛选后的样品点按 4326 经纬度→像素直接叠加在底图上
    if (globalExportWithSamples.value) {
      drawSamplesOnCanvas(ctx, fullWidth, fullHeight)
    }

    const suffix = globalExportWithSamples.value ? '_with-samples' : ''
    await new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error(t('message.pngFail'))); return }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${activeBasemap.value}_world_4326_z${zoomLevel}_${fullWidth}x${fullHeight}${suffix}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        resolve()
      }, 'image/png')
    })

    ElMessage.success(t('message.globalExportSuccess', { w: fullWidth, h: fullHeight }))
  } catch (error) {
    console.error('Global basemap export failed:', error)
    ElMessage.error(error?.message || t('message.globalExportFail'))
  } finally {
    globalExporting.value = false
  }
}

// ─── Refresh features (when filters/data change) ──────────────────────────────
function refreshFeatures() {
  if (!vectorSource) return
  closePopup()
  vectorSource.clear()
  vectorSource.addFeatures(buildFeatures())
  // 中文注释：筛选、聚合和样品图层开关变化时，同步刷新 OpenLayers 图层。
  vectorLayer.setSource(props.displayCluster ? clusterSource : vectorSource)
  vectorLayer.setStyle(props.displayCluster ? getClusterStyle : singleStyle)
  vectorLayer.setVisible(props.showSampleLayer)
  updateCharts()
}

// ─── ECharts ──────────────────────────────────────────────────────────────────
function initCharts() {
  if (pieEl.value) {
    pieChart = echarts.init(pieEl.value)
  }
  if (barEl.value) {
    barChart = echarts.init(barEl.value)
  }
  updateCharts()
}

function updateCharts() {
  const data = sortedChartData.value
  if (pieChart) {
    pieChart.setOption({
      animation: true,
      tooltip: { trigger: 'item', formatter: t('mapView.pieFormatter') },
      series: [{
        type: 'pie', radius: ['52%', '76%'], center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: { label: { show: false }, scale: true, scaleSize: 6 },
        data: data.map(d => ({ value: d.count, name: d.zhLabel, itemStyle: { color: d.color } }))
      }]
    }, true)
  }
  if (barChart) {
    const reversed = [...data].reverse()
    barChart.setOption({
      animation: true,
      grid: { left: 0, right: 48, top: 4, bottom: 4, containLabel: true },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: '#eef3fb' } }, axisLabel: { fontSize: 13, color: '#8ca0be' } },
      yAxis: { type: 'category', data: reversed.map(d => d.zhLabel), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontSize: 13, color: '#315177', width: 88, overflow: 'truncate' } },
      series: [{
        type: 'bar', barMaxWidth: 20,
        data: reversed.map(d => ({
          value: d.count,
          itemStyle: { color: d.color, borderRadius: [0, 4, 4, 0] }
        })),
        label: { show: true, position: 'right', fontSize: 13, fontWeight: 700, color: '#315177' }
      }]
    }, true)
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  initMap()
  await nextTick()
  // 延迟 updateSize 确保父容器已完成布局，OL 以实际尺寸重算 resolution 约束
  setTimeout(() => map?.updateSize(), 120)
  initCharts()
  resizeObserver = new ResizeObserver(handleResize)
  if (mapWrap.value) resizeObserver.observe(mapWrap.value)
  window.addEventListener('resize', handleResize)
})

  onUnmounted(() => {
  document.querySelectorAll('.mv-dragging').forEach(el => el.classList.remove('mv-dragging'))
  if (map) { map.setTarget(null); map = null }
  if (pieChart) { pieChart.dispose(); pieChart = null }
  if (barChart) { barChart.dispose(); barChart = null }
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('resize', handleResize)
})

function handleResize() {
  pieChart?.resize()
  barChart?.resize()
  map?.updateSize()
}

watch([() => props.coordinates, () => props.predictions, () => props.tectonicFilter,
  () => props.confidenceThreshold, () => props.displayCluster, () => props.colorByType, () => props.showSampleLayer],
  refreshFeatures, { deep: false }
)

watch(sortedChartData, updateCharts)

watch(mapProjection, () => {
  rebuildMap()
})

watch(showStatsPanel, async (visible) => {
  if (!visible) return
  await nextTick()
  // 中文注释：统计卡片重新展开后，ECharts 需要绑定新的 DOM 容器并刷新尺寸。
  pieChart?.dispose()
  barChart?.dispose()
  pieChart = null
  barChart = null
  initCharts()
  handleResize()
})

defineExpose({
  exportMapImage,
  updateMapSize: handleResize
})
</script>

<style scoped>
/* ── Root ── */
.mv-root {
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
  min-height: 0;
  border-radius: 0;
  overflow: hidden;
  border: 0;
}

/* ── Map area ── */
.mv-map-wrap {
  position: relative;
  height: 100%;
  min-height: 720px;
  background: #e8f4ff;
}

.mv-ol-map {
  width: 100%;
  height: 100%;
}

/* OL zoom controls styling */
:deep(.ol-zoom) {
  top: 30px;
  left: 24px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

:deep(.ol-zoom button) {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(184, 213, 255, 0.78);
  border-radius: 8px;
  color: #315177;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(20, 61, 112, 0.16);
  backdrop-filter: blur(12px);
  transition: background 0.15s;
}

:deep(.ol-zoom button:hover) {
  background: #f0f7ff;
}

/* Extra control buttons */
.mv-ctrl-extra {
  position: absolute;
  top: 118px;
  left: 24px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 10;
}

.mv-ctrl-btn {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(184, 213, 255, 0.78);
  border-radius: 8px;
  color: #315177;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(20, 61, 112, 0.16);
  backdrop-filter: blur(12px);
  transition: background 0.15s;
}

.mv-ctrl-btn:hover {
  background: #f0f7ff;
}

.mv-ctrl-btn:disabled {
  cursor: wait;
  opacity: 0.7;
}

.mv-zoom-select {
  width: 40px;
  height: 28px;
  padding: 0 4px;
  border: 1px solid rgba(184, 213, 255, 0.55);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.25);
  color: #315177;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  backdrop-filter: blur(12px);
  text-align: center;
  text-align-last: center;
}

.mv-ctrl-check {
  width: 40px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border: 1px solid rgba(184, 213, 255, 0.55);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.25);
  color: #315177;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  backdrop-filter: blur(12px);
}

.mv-ctrl-check input {
  width: 11px;
  height: 11px;
  margin: 0;
  accent-color: #0b66ff;
  cursor: pointer;
}

.mv-spin {
  animation: mv-spin 1s linear infinite;
}

@keyframes mv-spin {
  to { transform: rotate(360deg); }
}

/* ── Top-right overlay ── */
.mv-overlay-tr {
  position: absolute;
  top: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
}

.mv-ol-card {
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(184, 213, 255, 0.55);
  border-radius: 10px;
  box-shadow: 0 14px 34px rgba(20, 61, 112, 0.16);
  backdrop-filter: blur(14px);
  min-width: 110px;
}

.mv-glass-card {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(184, 213, 255, 0.55);
  box-shadow: 0 16px 38px rgba(20, 61, 112, 0.18);
  backdrop-filter: blur(14px);
}

.mv-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.mv-card-title {
  font-size: 11px;
  font-weight: 800;
  color: #315177;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 0;
}

.mv-card-action {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: rgba(236, 246, 255, 0.72);
  color: #315177;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
}

.mv-card-action:hover {
  background: #dfeeff;
}

.mv-panel-chip {
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid rgba(184, 213, 255, 0.55);
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.25);
  color: #0b66ff;
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 12px 26px rgba(20, 61, 112, 0.16);
  backdrop-filter: blur(12px);
  cursor: pointer;
}

.mv-dragging {
  cursor: grabbing !important;
  user-select: none;
}

.drag-handle {
  cursor: grab;
}

.mv-radio-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #1e3a5f;
  padding: 2px 0;
  cursor: pointer;
}

.mv-radio-row input { accent-color: #0b66ff; cursor: pointer; }

.mv-proj-divider {
  margin: 8px 0 6px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(184, 213, 255, 0.6), transparent);
}

.mv-proj-label {
  margin-bottom: 4px;
}

.mv-proj-hint {
  margin: 6px 0 0;
  font-size: 10.5px;
  color: #7e93b2;
  line-height: 1.45;
  max-width: 200px;
}

.mv-legend-card {
  min-width: 138px;
  max-height: none;
  overflow: visible;
}

.mv-basemap-card {
  min-width: 156px;
}

.mv-overlay-bl {
  position: absolute;
  left: 24px;
  bottom: 80px;
  z-index: 12;
}

.mv-leg-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
}

.mv-leg-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}

.mv-leg-label {
  font-size: 12px;
  color: #1e3a5f;
  white-space: nowrap;
}

/* ── Status bar ── */
.mv-statusbar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 28px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  background: rgba(8, 35, 90, 0.72);
  color: rgba(210, 230, 255, 0.92);
  font-size: 11.5px;
  z-index: 10;
  backdrop-filter: blur(4px);
}

.mv-sep { opacity: 0.45; margin: 0 2px; }

/* ── Popup ── */
.mv-popup {
  display: none;
  position: absolute;
  z-index: 100;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(184, 213, 255, 0.55);
  border-radius: 10px;
  box-shadow: 0 18px 42px rgba(20, 61, 112, 0.22);
  min-width: 250px;
  max-width: 290px;
  padding: 16px 18px 14px;
  backdrop-filter: blur(12px);
  pointer-events: auto;
}

.mv-popup.show {
  display: block;
}

.mv-popup-close {
  position: absolute;
  top: 7px;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 17px;
  color: #94a3b8;
  line-height: 1;
  padding: 0;
}

.mv-popup-title {
  font-size: 13px;
  font-weight: 900;
  color: #08235a;
  margin-bottom: 9px;
  padding-right: 18px;
}

.mv-popup-body {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.mv-popup-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 12.5px;
}

.mv-popup-row span { color: #657b9c; }
.mv-popup-row strong { color: #12366b; font-weight: 700; }

.mv-els-title {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  margin-top: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.mv-els-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.mv-el-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-width: 38px;
  background: #f5f9ff;
  border-radius: 5px;
  padding: 4px 4px;
}

.mv-el-col span {
  font-size: 10px;
  color: #94a3b8;
}

.mv-el-col strong {
  font-size: 11px;
  color: #12366b;
  font-weight: 700;
}

.mv-popup-detail {
  margin-top: 8px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: #0b66ff;
  font-weight: 700;
  padding: 0;
  text-align: left;
}

/* ── No coords overlay ── */
.mv-no-coords {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(248, 251, 255, 0.9);
  z-index: 20;
  color: #94a3b8;
}

.mv-no-coords p { margin: 0; font-size: 15px; font-weight: 700; color: #657b9c; }
.mv-no-coords span { font-size: 13px; }

.mv-floating-stats {
  position: absolute;
  left: 300px;
  right: 24px;
  bottom: 38px;
  display: grid;
  grid-template-columns: minmax(340px, 1.12fr) minmax(300px, 1fr) minmax(300px, 1fr);
  gap: 12px;
  z-index: 12;
  pointer-events: none;
}

.mv-floating-stats.collapsed {
  left: auto;
  right: 24px;
  bottom: 42px;
  display: block;
}

.mv-floating-stats > * {
  pointer-events: auto;
}

.mv-chart-card {
  padding: 14px 16px 12px;
  border-radius: 10px;
  min-height: 214px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.mv-chart-title {
  font-size: 16px;
  font-weight: 900;
  color: #08235a;
  margin-bottom: 0;
}

/* Pie chart layout */
.mv-pie-layout {
  flex: 1;
  display: flex;
  gap: 10px;
  min-height: 0;
}

.mv-pie-left {
  position: relative;
  flex: 0 0 140px;
  width: 140px;
  height: 140px;
  align-self: center;
}

.mv-pie-dom {
  width: 140px;
  height: 140px;
}

.mv-pie-center-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  font-size: 11px;
  color: #657b9c;
  line-height: 1.2;
  text-align: center;
}

/* 限制标签宽度，使较长的英文 "Total samples" 在圆环内换行而不溢出 */
.mv-pie-center-text > div:first-child {
  max-width: 72px;
}

.mv-pie-center-text strong {
  font-size: 22px;
  color: #08235a;
  font-weight: 900;
}

.mv-pie-mapped {
  margin-top: 1px;
  font-size: 10.5px;
  color: #94a3b8;
}

.mv-pie-right {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.mv-pie-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.mv-pie-name {
  flex: 1;
  color: #1e3a5f;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mv-pie-pct { color: #0b66ff; font-weight: 700; font-size: 13px; }
.mv-pie-cnt {
  /* color: #94a3b8;  */
  font-size: 13px;
}

/* Bar chart */
.mv-bar-dom {
  flex: 1;
  min-height: 160px;
}

/* Region card */
.mv-region-card {
  overflow: hidden;
}

.mv-region-wrap {
  flex: 1;
  position: relative;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(239, 247, 255, 0.88));
  border-radius: 6px;
  overflow: hidden;
  min-height: 158px;
}

.mv-region-geo {
  position: absolute;
  inset: 0;
}

.mv-region-design-map {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* opacity: 0.55; */
  filter: saturate(0.85) brightness(1.05);
}

.mv-region-item {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  gap: 0;
  border: 1px solid rgba(255, 255, 255, 0.92);
  border-radius: 50%;
  background: color-mix(in srgb, var(--region-color) 58%, rgba(255, 255, 255, 0.78));
  box-shadow: 0 8px 20px rgba(49, 81, 119, 0.14);
  transform: translate(-50%, -50%);
  transition: opacity 0.2s;
}

.mv-region-item strong {
  font-size: 11px;
  font-weight: 800;
  color: #12366b;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(255,255,255,0.86);
}

.mv-region-item span {
  font-size: 15px;
  font-weight: 900;
  color: #08235a;
  text-shadow: 0 1px 3px rgba(255,255,255,0.9);
}

.mv-region-item.zero {
  opacity: 0.58;
}

.mv-region-item.zero strong { color: #8ca0be; }
.mv-region-item.zero span { color: #9eb3cd; font-size: 14px; }
</style>
