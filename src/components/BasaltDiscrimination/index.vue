<template>
  <div class="system-page">
    <upload-dialog
      v-model:visible="showUploadDialog"
      @file-processed="handleFileProcessed"
    />
    <help-dialog v-model:visible="showHelpDialog" />

    <header class="app-header">
      <div class="brand-block" @click="goHome">
        <div class="brand-logo">
          <span class="cube-core"></span>
        </div>
        <div class="brand-text">
          <strong>{{ t('header.brandTitle') }}</strong>
        </div>
      </div>

      <nav class="main-nav" :aria-label="t('header.navAriaLabel')">
        <button
          v-for="item in navItems"
          :key="item.key"
          type="button"
          class="nav-item"
          :class="{ active: activeTab === item.key }"
          @click="handleNav(item.key)"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="header-tools">
        <lang-switch />
        <span class="research-badge">
          <el-icon><Aim /></el-icon>
          {{ t('header.researchBadge') }}
        </span>
        <button class="avatar-button" type="button" :aria-label="t('header.avatarLabel')">
          <el-icon><UserFilled /></el-icon>
        </button>
      </div>
    </header>

    <main v-if="!fileData.length" class="home-dashboard">
      <section class="hero-card">
        <div class="hero-copy">
          <h1>{{ t('home.heroTitle') }}</h1>
          <p>{{ t('home.heroDesc') }}</p>
          <div class="hero-actions">
            <el-button type="primary" size="large" :icon="VideoPlay" @click="showUploadDialog = true">
              {{ t('home.heroStart') }}
            </el-button>
            <button class="doc-button" type="button" @click="handleNav('help')">
              <el-icon><Reading /></el-icon>
              {{ t('home.heroDoc') }}
            </button>
          </div>
          <div class="hero-promises">
            <span>
              <el-icon><CircleCheckFilled /></el-icon>
              {{ t('home.promise1') }}
            </span>
            <span>
              <el-icon><CircleCheckFilled /></el-icon>
              {{ t('home.promise2') }}
            </span>
            <span>
              <el-icon><CircleCheckFilled /></el-icon>
              {{ t('home.promise3') }}
            </span>
          </div>
        </div>

        <div class="hero-visual" :style="heroVisualStyle">
          <div class="volcano-halo"></div>
          <div class="visual-card element-card">
            <span v-for="element in ['Si', 'Ti', 'Al', 'Fe', 'Mg', 'Ca', 'Na', 'K']" :key="element">
              {{ element }}
            </span>
          </div>
          <div class="visual-card scatter-card">
            <span class="chart-grid"></span>
            <i v-for="point in 22" :key="point" :style="pointStyle(point)"></i>
          </div>
          <div class="visual-card line-card">
            <span v-for="bar in [34, 48, 39, 61, 52, 76, 68]" :key="bar" :style="{ height: `${bar}%` }"></span>
          </div>
          <div class="visual-card network-card">
            <i v-for="node in 7" :key="node"></i>
          </div>
        </div>
      </section>

      <section class="feature-grid" :aria-label="t('home.featureAriaLabel')">
        <article v-for="item in featureCards" :key="item.title" class="feature-card">
          <div class="feature-icon">
            <el-icon><component :is="item.icon" /></el-icon>
          </div>
          <div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
          </div>
        </article>
      </section>

      <section class="dashboard-grid">
        <article class="panel quick-panel">
          <div class="panel-title">{{ t('home.quickPanelTitle') }}</div>
          <div class="flow-row">
            <div v-for="(step, index) in quickSteps" :key="step.title" class="flow-step">
              <div class="flow-icon">
                <el-icon><component :is="step.icon" /></el-icon>
              </div>
              <strong>{{ step.title }}</strong>
              <p>{{ step.desc }}</p>
            </div>
          </div>
        </article>

        <article class="panel capability-panel">
          <div class="panel-title">{{ t('home.capabilityPanelTitle') }}</div>
          <div class="capability-grid">
            <div v-for="item in capabilities" :key="item.title" class="mini-card">
              <el-icon><component :is="item.icon" /></el-icon>
              <div>
                <strong>{{ item.title }}</strong>
                <span>{{ item.desc }}</span>
              </div>
            </div>
          </div>
        </article>

        <article class="panel overview-panel">
          <div class="panel-title">{{ t('home.overviewPanelTitle') }}</div>
          <div class="status-list">
            <div v-for="item in projectStatus" :key="item.label">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
          <div class="cube-illustration">
            <span></span>
          </div>
        </article>
      </section>

      <section class="lower-grid">
        <article class="panel scene-panel">
          <div class="panel-title">{{ t('home.scenePanelTitle') }}</div>
          <div class="scene-grid">
            <div v-for="item in useCases" :key="item.title" class="scene-card">
              <el-icon><component :is="item.icon" /></el-icon>
              <div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </article>

        <article class="panel recent-panel">
          <div class="panel-title">{{ t('home.recentPanelTitle') }}</div>
          <table>
            <thead>
              <tr>
                <th>{{ t('home.recentTh.name') }}</th>
                <th>{{ t('home.recentTh.count') }}</th>
                <th>{{ t('home.recentTh.time') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="file in recentFiles" :key="file.name">
                <td>{{ file.name }}</td>
                <td>{{ file.count }}</td>
                <td>{{ file.time }}</td>
              </tr>
            </tbody>
          </table>
        </article>

        <article class="panel sample-panel">
          <div class="panel-title">{{ t('home.samplePanelTitle') }}</div>
          <a
            v-for="file in sampleFiles"
            :key="file.name"
            :href="resolvePublicUrl(file.path)"
            :download="file.name"
          >
            <el-icon><Document /></el-icon>
            <span>{{ file.name }}</span>
            <el-icon><Download /></el-icon>
          </a>
        </article>
      </section>
    </main>

    <main
      v-else
      class="workspace"
      :class="{ 'workspace-map-mode': workspaceTab === 'map', 'workspace-process-open': workspaceTab === 'map' && mapProcessOpen, 'workspace-side-open': workspaceTab === 'map' && mapSidePanelOpen }"
    >
      <button
        v-if="workspaceTab === 'map'"
        class="process-toggle-btn"
        type="button"
        :title="mapProcessOpen ? t('sidebar.processToggleHide') : t('sidebar.processToggleShow')"
        @click="toggleMapProcessSidebar"
      >
        <el-icon><Fold v-if="mapProcessOpen" /><Expand v-else /></el-icon>
        
      </button>

      <aside v-if="workspaceTab !== 'map' || mapProcessOpen" class="process-sidebar">
        <div class="panel-title">{{ t('sidebar.panelTitle') }}</div>
        <ol class="process-list">
          <li
            v-for="(step, index) in processSteps"
            :key="step.title"
            :class="{ done: step.done, active: step.active }"
          >
            <span>{{ index + 1 }}</span>
            <div>
              <strong>{{ step.title }}</strong>
              <p>{{ step.note }}</p>
            </div>
            <el-icon v-if="step.done"><CircleCheckFilled /></el-icon>
          </li>
        </ol>
        <div class="research-card">
          <strong>{{ t('sidebar.researchTitle') }}</strong>
          <p>{{ t('sidebar.researchDesc') }}</p>
        </div>
      </aside>

      <section class="workspace-main">
        <!-- 中文注释：地图模式下 .workspace-topbar 把标题区与右侧 Tab/按钮合成顶部一栏；
             非地图模式用 display:contents 透明化，保持原有统计页布局不变。 -->
        <div class="workspace-topbar">
          <div class="workspace-head" v-draggable>
            <div class="drag-handle">
              <span class="eyebrow">{{ predictions.length ? (workspaceTab === 'map' ? t('workspace.eyebrowMap') : t('workspace.eyebrowResult')) : t('workspace.eyebrowUpload') }}</span>
              <h2>{{ predictions.length ? (workspaceTab === 'map' ? t('workspace.titleMap') : t('workspace.titleResult')) : t('workspace.titleUpload') }}</h2>
              <p>{{ t('workspace.currentFile') }}：{{ currentFileName || t('workspace.waitingFile') }} · {{ fileData.length }} {{ t('workspace.samplesUnit') }}</p>
            </div>
          </div>
          <!-- head-right 改为独立兄弟节点 + 自带 drag-handle，与 head 互不影响 -->
          <div class="workspace-head-right" v-draggable>
            <span class="drag-handle workspace-head-right-grip" :title="t('workspace.dragHandleTitle')" aria-hidden="true">⋮⋮</span>
            <div v-if="predictions.length" class="view-tabs">
              <button
                type="button"
                :class="['view-tab', { active: workspaceTab === 'stat' }]"
                @click="workspaceTab = 'stat'"
              >
                {{ t('workspace.tabStat') }}
              </button>
              <button
                type="button"
                :class="['view-tab', { active: workspaceTab === 'map' }]"
                @click="workspaceTab = 'map'"
              >
                {{ t('workspace.tabMap') }}
              </button>
            </div>
            <el-button type="primary" size="large" :icon="UploadFilled" @click="showUploadDialog = true">
              {{ t('workspace.reupload') }}
            </el-button>
          </div>
        </div>

        <!-- 统计分析视图 -->
        <template v-if="workspaceTab === 'stat'">
          <div v-if="predictions.length" class="metric-grid">
            <article v-for="metric in resultMetrics" :key="metric.label" class="metric-card">
              <div>
                <span>{{ metric.label }}</span>
                <strong :class="metric.tone">{{ metric.value }}</strong>
                <p>{{ metric.note }}</p>
              </div>
              <el-icon><component :is="metric.icon" /></el-icon>
            </article>
          </div>

          <section class="data-panel">
            <data-display
              :table-data="fileData"
              :predictions="predictions"
              :predicting="predicting"
              :processing="processing"
              :progress-percentage="progressPercentage"
              :processed-data="processedData"
              :filename="currentFileName"
              @download="downloadResults"
              @predict="handlePredict"
              @process="handleProcessData"
            />
          </section>
        </template>

        <!-- 空间分布视图 -->
        <template v-else>
          <map-view
            ref="mapViewRef"
            :file-data="fileData"
            :predictions="predictions"
            :coordinates="coordinateData"
            :tectonic-filter="mapFilters.tectonicType"
            :confidence-threshold="mapFilters.confidenceThreshold"
            :display-cluster="mapFilters.displayCluster"
            :color-by-type="mapFilters.colorByType"
            :show-popup-enabled="mapFilters.showPopupEnabled"
            :show-sample-layer="mapFilters.showSampleLayer"
            :filename="currentFileName"
          />
        </template>
      </section>

      <button
        v-if="workspaceTab === 'map' && !mapSidePanelOpen"
        class="map-side-chip"
        type="button"
        @click="mapSidePanelOpen = true"
      >
        {{ t('sidebar.sideChip') }}
      </button>

      <aside v-if="workspaceTab === 'stat' || mapSidePanelOpen" class="workspace-side">
        <!-- ── 统计分析侧栏 ── -->
        <template v-if="workspaceTab === 'stat'">
          <article class="panel">
            <div class="panel-title">{{ t('statSettings.organizeTitle') }}</div>
            <div class="toggle-list">
              <div v-for="item in preprocessOptions" :key="item.title" class="toggle-row">
                <el-icon><component :is="item.icon" /></el-icon>
                <div>
                  <strong>{{ item.title }}</strong>
                  <span>{{ item.desc }}</span>
                </div>
                <em>{{ t('statSettings.enabled') }}</em>
              </div>
            </div>
            <div class="impute-method-row">
              <span class="impute-method-label">{{ t('statSettings.imputeLabel') }}</span>
              <div class="impute-method-tabs">
                <button type="button" :class="['method-tab', { active: imputeMethod === 'knn' }]" @click="imputeMethod = 'knn'">{{ t('statSettings.imputeKnn') }}</button>
                <button type="button" :class="['method-tab', { active: imputeMethod === 'missforest' }]" @click="imputeMethod = 'missforest'">{{ t('statSettings.imputeMissForest') }}</button>
              </div>
            </div>
            <p v-if="imputeMethod === 'missforest'" class="impute-method-hint">{{ t('statSettings.imputeHint') }}</p>
          </article>

          <article class="panel model-panel">
            <div class="panel-title">{{ t('statSettings.modelTitle') }}</div>
            <div class="model-info">
              <div class="model-icon"><el-icon><Share /></el-icon></div>
              <dl>
                <dt>{{ t('statSettings.modelObject') }}</dt><dd>{{ t('statSettings.modelObjectVal') }}</dd>
                <dt>{{ t('statSettings.modelInput') }}</dt><dd>{{ t('statSettings.modelInputVal') }}</dd>
                <dt>{{ t('statSettings.modelLocation') }}</dt><dd>{{ t('statSettings.modelLocationVal') }}</dd>
                <dt>{{ t('statSettings.modelStatus') }}</dt><dd>{{ modelStateText }}</dd>
              </dl>
            </div>
          </article>

          <article v-if="predictions.length" class="panel export-panel">
            <div class="panel-title">{{ t('statSettings.exportTitle') }}</div>
            <button type="button" @click="downloadResults"><el-icon><Download /></el-icon>{{ t('statSettings.exportCsv') }}</button>
            <button type="button" @click="copySummary"><el-icon><Document /></el-icon>{{ t('statSettings.exportSummary') }}</button>
          </article>

          <article v-if="predictions.length" class="panel insight-panel">
            <div class="panel-title">{{ t('statSettings.insightTitle') }}</div>
            <p>{{ t('statSettings.insightP1') }}</p>
            <p>{{ t('statSettings.insightP2') }}</p>
          </article>
        </template>

        <!-- ── 空间分布侧栏 ── -->
        <template v-else>
          <article class="panel map-filter-panel" v-draggable>
            <div class="map-panel-head drag-handle">
              <div class="panel-title">{{ t('mapSidebar.title') }}</div>
              <button class="map-panel-close" type="button" :title="t('mapSidebar.closeTitle')" @click="mapSidePanelOpen = false">×</button>
            </div>

            <div class="mf-section">
              <div class="mf-label">{{ t('mapSidebar.tectonicType') }}</div>
              <select class="mf-select" v-model="mapFilters.tectonicType">
                <option value="">{{ t('mapSidebar.allTypes') }}</option>
                <option v-for="s in TECTONIC_SETTINGS" :key="s" :value="s">{{ localizeSetting(s) }}</option>
              </select>
            </div>

            <div class="mf-section">
              <div class="mf-label-row">
                <span class="mf-label">{{ t('mapSidebar.confThreshold') }}</span>
                <strong class="mf-val">{{ mapFilters.confidenceThreshold }}</strong>
              </div>
              <input type="range" class="mf-slider" min="0" max="100" step="5" v-model.number="mapFilters.confidenceThreshold" />
            </div>

            <div class="mf-section">
              <div class="mf-label">{{ t('mapSidebar.displayMode') }}</div>
              <div class="mf-toggle-list">
                <div class="mf-toggle-row">
                  <span>{{ t('mapSidebar.cluster') }}</span>
                  <label class="mf-switch">
                    <input type="checkbox" v-model="mapFilters.displayCluster" />
                    <span></span>
                  </label>
                </div>
                <div class="mf-toggle-row mf-disabled">
                  <span>{{ t('mapSidebar.heatmap') }}</span>
                  <label class="mf-switch">
                    <input type="checkbox" disabled />
                    <span></span>
                  </label>
                </div>
                <div class="mf-toggle-row">
                  <span>{{ t('mapSidebar.colorByType') }}</span>
                  <label class="mf-switch">
                    <input type="checkbox" v-model="mapFilters.colorByType" />
                    <span></span>
                  </label>
                </div>
                <div class="mf-toggle-row">
                  <span>{{ t('mapSidebar.showPopup') }}</span>
                  <label class="mf-switch">
                    <input type="checkbox" v-model="mapFilters.showPopupEnabled" />
                    <span></span>
                  </label>
                </div>
              </div>
            </div>

            <div class="mf-section">
              <div class="mf-label">{{ t('mapSidebar.layerManage') }}</div>
              <div class="mf-check-list">
                <label class="mf-check-row">
                  <input type="checkbox" v-model="mapFilters.showSampleLayer" />
                  <span>{{ t('mapSidebar.layerSample') }}</span>
                </label>
                <label class="mf-check-row">
                  <input type="checkbox" v-model="mapFilters.showTerrainLayer" />
                  <span>{{ t('mapSidebar.layerTerrain') }}</span>
                </label>
                <label class="mf-check-row mf-disabled">
                  <input type="checkbox" disabled />
                  <span>{{ t('mapSidebar.layerPlate') }}</span>
                </label>
                <label class="mf-check-row mf-disabled">
                  <input type="checkbox" disabled />
                  <span>{{ t('mapSidebar.layerArc') }}</span>
                </label>
              </div>
            </div>

            <div class="mf-export-row">
              <button class="mf-export-btn" type="button" @click="exportCurrentMapImage">
                <el-icon><Download /></el-icon>
                {{ t('mapSidebar.exportImage') }}
              </button>
              <button class="mf-export-btn outline" type="button" @click="exportMapResult">
                <el-icon><Download /></el-icon>
                {{ t('mapSidebar.exportSpatial') }}
              </button>
            </div>
          </article>
        </template>
      </aside>
    </main>

    <div v-if="predicting || processing" class="loading-overlay">
      <div class="loading-box">
        <el-icon class="spin-icon"><Loading /></el-icon>
        <p class="loading-label">{{ predicting ? t('message.predicting') : t('message.processing') }}</p>
        <el-progress :percentage="progressPercentage" :show-text="false" :stroke-width="8" />
        <p class="loading-pct">{{ progressPercentage }}%</p>
        <p class="loading-note">{{ modelStateText }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  Aim,
  Box,
  CircleCheckFilled,
  DataAnalysis,
  Document,
  Download,
  Expand,
  Files,
  Finished,
  Fold,
  Histogram,
  HomeFilled,
  Loading,
  LocationFilled,
  Monitor,
  Operation,
  QuestionFilled,
  Reading,
  Setting,
  Share,
  TrendCharts,
  UploadFilled,
  UserFilled,
  VideoPlay,
  WarningFilled
} from '@element-plus/icons-vue'
import UploadDialog from './components/UploadDialog.vue'
import DataDisplay from './components/DataDisplay.vue'
import HelpDialog from './components/HelpDialog.vue'
import MapView from './components/MapView.vue'
import LangSwitch from '../LangSwitch.vue'
import { addAnhydrousNormalizedData } from './composables/anhydrousNormalize'
import { imputeRowsByKnn, imputeRowsByMissForest, imputeRowsByTrainingMedian, isArcheanFilename, isMissingChemicalValue } from './composables/impute'
import { normalizeData } from './composables/normalize'
import {
  loadModel,
  modelError,
  modelStatus,
  predictRows
} from './composables/useOnnxModel'
import {
  COLUMNS_TO_EXTRACT,
  COLUMNS_TO_EXTRACT1,
  MISSFOREST_LABEL_TO_FILE,
  MODEL_SEQUENCE_COLUMNS,
  TECTONIC_SETTINGS,
  TECTONIC_SETTINGS_MAP
} from './constants'

const { t, tm } = useI18n()

const localizeSetting = (label) => {
  const dict = tm('settings')
  return (dict && dict[label]) || label
}

const showUploadDialog = ref(false)
const showHelpDialog = ref(false)
const fileData = ref([])
const processedData = ref([])
const predictions = ref([])
const coordinateData = ref([])
const workspaceTab = ref('map') // 'stat' | 'map'
const mapViewRef = ref(null)
const mapProcessOpen = ref(false)
const mapSidePanelOpen = ref(true)
const mapFilters = reactive({
  tectonicType: '',
  confidenceThreshold: 0,
  displayCluster: false,
  colorByType: true,
  showPopupEnabled: true,
  showSampleLayer: true,
  showTerrainLayer: true
})
const currentFileName = ref('')
const predicting = ref(false)
const processing = ref(false)
const progressPercentage = ref(0)

// 中文注释：空间分布页浮动卡片拖拽。
// 用 transform:translate 累积位移：元素始终在原位占住 layout，仅视觉移动；
// 因此既不会让原位置镂空，也不会带动其他卡片移位。
const vDraggable = {
  mounted(el) {
    const interactiveSelector = 'button,input,select,textarea,a,label'
    const THRESHOLD = 5
    let startX = 0, startY = 0
    let accumX = 0, accumY = 0
    let dragging = false
    let baseTransform = ''

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
        el.classList.add('dragging-panel')
      }
      applyTransform(accumX + dx, accumY + dy)
    }

    const stopDrag = (event) => {
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', stopDrag)
      if (dragging) {
        accumX += event.clientX - startX
        accumY += event.clientY - startY
        el.classList.remove('dragging-panel')
        el.style.willChange = ''
      }
      dragging = false
    }

    const startDrag = (event) => {
      const handle = event.target.closest('.drag-handle')
      if (event.button !== 0 || !handle || !el.contains(handle) || event.target.closest(interactiveSelector)) return

      startX = event.clientX
      startY = event.clientY
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

// 插补方式：'knn' 为纯前端 KNN（无需额外网络请求），'missforest' 为两段式
//（先 KNN 粗判构造环境，再调用对应环境的预训练 MissForest 模型精插补）。
// 太古代克拉通样品文件名命中关键词时，MissForest 模式自动回退到 KNN，
// 因为 MissForest 模型仅用现代玄武岩数据训练，对太古代地球化学代表性不足。
const imputeMethod = ref('knn')
const DEFAULT_MAX_MISSING_FEATURES_EXCLUSIVE = 20
const MAX_MISSING_FEATURES_EXCLUSIVE = 16

watch(workspaceTab, async (tab) => {
  if (tab === 'map') {
    // 中文注释：进入空间分布时默认收起流程栏，给地图留出更多横向空间。
    mapProcessOpen.value = false
    mapSidePanelOpen.value = true
    await nextTick()
    mapViewRef.value?.updateMapSize?.()
  }
})

// 图标映射保持常量，文案通过 i18n 数组按当前语言取
const NAV_ICONS = [HomeFilled, UploadFilled, Operation, Share, TrendCharts, QuestionFilled]
const NAV_KEYS = ['home', 'upload', 'process', 'model', 'result', 'help']
const navItems = computed(() => NAV_KEYS.map((key, i) => ({
  key,
  label: t(`nav.${key}`),
  icon: NAV_ICONS[i]
})))

const FEATURE_ICONS = [Box, Files, Operation, TrendCharts]
const featureCards = computed(() => (tm('home.featureCards') || []).map((item, i) => ({
  title: item.title,
  desc: item.desc,
  icon: FEATURE_ICONS[i]
})))

const QUICK_ICONS = [UploadFilled, Setting, Share, Histogram]
const quickSteps = computed(() => (tm('home.quickSteps') || []).map((item, i) => ({
  title: item.title,
  desc: item.desc,
  icon: QUICK_ICONS[i]
})))

const CAPABILITY_ICONS = [Document, WarningFilled, Operation, Histogram]
const capabilities = computed(() => (tm('home.capabilities') || []).map((item, i) => ({
  title: item.title,
  desc: item.desc,
  icon: CAPABILITY_ICONS[i]
})))

const projectStatus = computed(() => tm('home.projectStatus') || [])

const USE_CASE_ICONS = [Monitor, Aim, DataAnalysis]
const useCases = computed(() => (tm('home.useCases') || []).map((item, i) => ({
  title: item.title,
  desc: item.desc,
  icon: USE_CASE_ICONS[i]
})))

const recentFiles = computed(() => tm('home.recentFiles') || [])

const sampleFiles = [
  { name: 'archean_basalt.csv', path: 'data/archean_basalt.csv' },
  { name: 'BACK-ARC_BASIN.csv', path: 'data/BACK-ARC_BASIN.csv' },
  { name: 'Continental_arc.csv', path: 'data/Continental_arc.csv' },
  { name: 'North_China_Craton.csv', path: 'data/North_China_Craton.csv' },
  { name: 'Superior_Abitibi.csv', path: 'data/Superior_Abitibi.csv' },
  { name: 'Isua.csv', path: 'data/Isua.csv' }
]

// preprocessOptions 用 computed 而非静态数组，是因为描述文字需要随 imputeMethod 同步更新，
// 让右侧面板始终反映当前实际使用的插补策略。
const preprocessOptions = computed(() => [
  {
    title: t('statSettings.preprocess.missing.title'),
    desc: imputeMethod.value === 'missforest'
      ? t('statSettings.preprocess.missing.descMissForest')
      : t('statSettings.preprocess.missing.descKnn'),
    icon: WarningFilled
  },
  { title: t('statSettings.preprocess.anhydrous.title'), desc: t('statSettings.preprocess.anhydrous.desc'), icon: Operation },
  { title: t('statSettings.preprocess.quantile.title'), desc: t('statSettings.preprocess.quantile.desc'), icon: Histogram }
])

const resolvePublicUrl = (relativePath) => {
  // 中文注释：静态部署时让资源地址跟随当前页面路径，兼容 GitHub Pages 子目录。
  if (typeof window === 'undefined') {
    return relativePath
  }

  return new URL(relativePath, window.location.href).href
}

const heroVisualStyle = computed(() => ({
  // 中文注释：首页主视觉使用项目内玄武岩图片，并叠加蓝白科技风遮罩贴近设计稿。
  backgroundImage: `linear-gradient(90deg, rgba(248, 252, 255, 0.96) 0%, rgba(235, 246, 255, 0.62) 30%, rgba(21, 111, 232, 0.04) 100%), url("${resolvePublicUrl('hero-volcano-blue.png')}")`
}))

const activeTab = computed(() => {
  if (!fileData.value.length) return 'home'
  if (predictions.value.length) return 'result'
  if (processedData.value.length) return 'model'
  return 'upload'
})

const modelStateText = computed(() => {
  if (modelStatus.value === 'loading') {
    return t('backend.modelLoading')
  }

  if (modelStatus.value === 'ready') {
    return t('backend.modelReady')
  }

  if (modelStatus.value === 'error') {
    return `${t('backend.modelError')}${modelError.value ? `：${modelError.value}` : ''}`
  }

  return t('backend.modelIdle')
})

const processSteps = computed(() => {
  const ps = 'sidebar.processSteps'
  const noteDone = t(`${ps}.noteDone`)
  const notePending = t(`${ps}.notePending`)
  const noteWaiting = t(`${ps}.noteWaiting`)
  return [
    { title: t(`${ps}.upload.title`), note: currentFileName.value || t(`${ps}.upload.noteImported`), done: fileData.value.length > 0, active: !processedData.value.length },
    { title: t(`${ps}.fields.title`), note: `${COLUMNS_TO_EXTRACT.length} ${t(`${ps}.fields.noteUnit`)}`, done: fileData.value.length > 0, active: false },
    { title: t(`${ps}.missing.title`), note: processedData.value.length ? noteDone : notePending, done: processedData.value.length > 0, active: processing.value },
    { title: t(`${ps}.anhydrous.title`), note: processedData.value.length ? noteDone : notePending, done: processedData.value.length > 0, active: processing.value },
    { title: t(`${ps}.quantile.title`), note: processedData.value.length ? noteDone : notePending, done: processedData.value.length > 0, active: processing.value },
    { title: t(`${ps}.discriminate.title`), note: predictions.value.length ? noteDone : noteWaiting, done: predictions.value.length > 0, active: predicting.value },
    { title: t(`${ps}.analyze.title`), note: predictions.value.length ? t(`${ps}.analyze.noteCurrent`) : t(`${ps}.analyze.noteWaiting`), done: false, active: predictions.value.length > 0 }
  ]
})

const resultMetrics = computed(() => {
  const total = fileData.value.length
  // 0.7 为置信度阈值：低于此值说明模型在该样品的多个构造环境间存在明显犹豫，
  // 建议结合地质背景人工复核，而非直接采纳最高概率标签。
  const confident = predictions.value.filter(item => item.confidence >= 0.7).length
  const review = Math.max(total - confident, 0)
  const classes = new Set(predictions.value.map(item => item.label)).size

  return [
    { label: t('metrics.total.label'), value: total, note: t('metrics.total.note'), icon: Files, tone: 'blue' },
    { label: t('metrics.confident.label'), value: confident, note: t('metrics.confident.note'), icon: CircleCheckFilled, tone: 'green' },
    { label: t('metrics.review.label'), value: review, note: t('metrics.review.note'), icon: WarningFilled, tone: 'orange' },
    { label: t('metrics.classes.label'), value: classes, note: t('metrics.classes.note'), icon: TrendCharts, tone: 'blue' }
  ]
})

const pointStyle = (index) => {
  const left = 10 + ((index * 17) % 78)
  const top = 12 + ((index * 29) % 70)
  return {
    left: `${left}%`,
    top: `${top}%`,
    opacity: 0.45 + (index % 5) * 0.1
  }
}

const handleNav = (key) => {
  if (key === 'home') { goHome(); return }
  if (key === 'upload') { showUploadDialog.value = true; return }
  if (key === 'help') {
    showHelpDialog.value = true
    return
  }
  if (!fileData.value.length) {
    ElMessage.info(t('message.uploadFirst'))
    showUploadDialog.value = true
    return
  }
  if (key === 'result' && !predictions.value.length) {
    ElMessage.info(t('message.processBeforeResult'))
  }
}

const handleFileProcessed = (rows, filename, coordinates = []) => {
  currentFileName.value = filename
  predictions.value = []
  processedData.value = []
  coordinateData.value = coordinates
  workspaceTab.value = 'stat'

  // 把二维数组转为 { col0, col1, ... } 对象列表，
  // 方便后续按列名随机访问而不必依赖列索引顺序。
  fileData.value = rows.map(row => {
    const item = {}
    row.forEach((value, index) => {
      item[`col${index}`] = value
    })
    return item
  })
}

const buildModelRowsFromTableData = (rows) => {
  // 中文注释：模型输入不包含 LOI，必须按列名映射，避免 RB 之后的字段整体错位。
  return rows.map(row =>
    COLUMNS_TO_EXTRACT1.map(columnName => {
      const displayIndex = COLUMNS_TO_EXTRACT.indexOf(columnName)
      return displayIndex === -1 ? null : row[`col${displayIndex}`] ?? null
    })
  )
}

const filterRows = (rows, options = {}) => {
  const seen = new Set()
  const keptIndexes = []
  let invalidCount = 0
  let duplicateCount = 0
  const maxMissingFeaturesExclusive = options.maxMissingFeaturesExclusive || DEFAULT_MAX_MISSING_FEATURES_EXCLUSIVE

  const filteredRows = rows.filter((row, index) => {
    // 中文注释：模型输入字段缺失数必须小于阈值；太古代样品使用更严格的 <16 规则。
    const invalidValues = row.filter(value => isMissingChemicalValue(value)).length
    if (invalidValues >= maxMissingFeaturesExclusive) {
      invalidCount += 1
      return false
    }

    // 用拼接字符串做哈希去重，避免完全相同的样品重复进入模型导致结果虚胖。
    const hash = row.join(',')
    if (seen.has(hash)) {
      duplicateCount += 1
      return false
    }

    seen.add(hash)
    keptIndexes.push(index)
    return true
  })

  return {
    rows: filteredRows,
    keptIndexes,
    stats: {
      total: rows.length,
      invalid: invalidCount,
      duplicate: duplicateCount,
      remaining: filteredRows.length
    }
  }
}

const handleProcessData = async () => {
  if (!fileData.value.length) {
    ElMessage.error(t('message.noData'))
    return
  }

  processing.value = true
  progressPercentage.value = 0

  try {
    const displayRows = fileData.value.map(row =>
      COLUMNS_TO_EXTRACT.map((_, index) => row[`col${index}`] ?? null)
    )
    const modelRows = buildModelRowsFromTableData(fileData.value)
    const archean = isArcheanFilename(currentFileName.value)
    const maxMissingFeaturesExclusive = archean
      ? MAX_MISSING_FEATURES_EXCLUSIVE
      : DEFAULT_MAX_MISSING_FEATURES_EXCLUSIVE

    const { rows: filteredModelRows, keptIndexes, stats } = filterRows(modelRows, {
      maxMissingFeaturesExclusive
    })
    const filteredDisplayRows = keptIndexes.map(index => displayRows[index])

    if (!filteredDisplayRows.length || !filteredModelRows.length) {
      ElMessage.error(t('message.noValidData'))
      return
    }

    // 同步把坐标按 keptIndexes 过滤，保证后续 fileData / predictions / coordinateData
    // 三者按行索引一一对齐，否则地图上样品点会错位或缺失。
    if (coordinateData.value.length) {
      coordinateData.value = keptIndexes.map(idx => coordinateData.value[idx] || null)
    }

    if (stats.invalid > 0 || stats.duplicate > 0) {
      ElMessage.warning(t('message.filteredRows', {
        invalid: stats.invalid,
        duplicate: stats.duplicate,
        remaining: stats.remaining
      }))
    }

    progressPercentage.value = 20
    const displayTableData = filteredDisplayRows.map(row => {
      const item = {}
      row.forEach((value, index) => {
        item[`col${index}`] = value
      })
      return item
    })

    progressPercentage.value = 30
    const anhydrousDisplayRows = addAnhydrousNormalizedData(displayTableData, COLUMNS_TO_EXTRACT)
    const anhydrousModelRows = buildModelRowsFromTableData(anhydrousDisplayRows)

    let imputedModelRows

    const useMissForest = imputeMethod.value === 'missforest'

    if (archean) {
      // 太古代克拉通样品不做任何近邻插补，缺失值直接置 0。
      // 理由：KNN/MissForest/训练集中位数都基于现代基性岩，强行插补会污染太古代特征；
      // 置 0 让 CNN 自己处理"该元素缺失"这一信号，最大限度保留样品原始信息。
      ElMessage.warning(t('message.archeanFallback'))
      progressPercentage.value = 50
      imputedModelRows = anhydrousModelRows.map(row =>
        row.map(v => (v === null || v === undefined || Number.isNaN(v)) ? 0 : v)
      )
      progressPercentage.value = 75
    } else if (useMissForest && !archean) {
      // ── 两段式插补：解决"插补时不知道构造环境"的鸡生蛋问题 ───────────────
      // 第一段：用 KNN 填充缺失值 → 归一化 → CNN 粗判出每行的构造环境标签。
      // 第二段：把粗判标签映射到对应的 MissForest 模型，对原始（无水归一化后、
      //         尚未插补的）数据重新插补，利用同类玄武岩的统计规律提升精度。
      // 最终再归一化后送入 CNN 进行正式判别。
      progressPercentage.value = 35

      const knnImputedRows = await imputeRowsByKnn(anhydrousModelRows, COLUMNS_TO_EXTRACT1)
      progressPercentage.value = 50

      await loadModel()
      const knnNormalized = await normalizeData(knnImputedRows, COLUMNS_TO_EXTRACT1)
      const knnPredictions = await predictRows(
        knnNormalized,
        COLUMNS_TO_EXTRACT1,
        MODEL_SEQUENCE_COLUMNS,
        { batchSize: 96 }
      )
      const roughLabels = knnPredictions.map(p => p.label)
      // recognizedCount < total 时说明部分行被分类到无对应 MissForest 模型的标签，
      // 这些行将沿用 KNN 结果，不影响其余行的精插补。
      const recognizedCount = roughLabels.filter(l => MISSFOREST_LABEL_TO_FILE[l]).length
      progressPercentage.value = 65

      if (recognizedCount === 0) {
        ElMessage.warning(t('message.knnRoughFail'))
        imputedModelRows = knnImputedRows
      } else {
        // 用无水归一化后、尚未经过任何插补的原始行做第二段插补，
        // 避免 KNN 的插补误差传递进 MissForest 的特征输入。
        imputedModelRows = await imputeRowsByMissForest(
          anhydrousModelRows,
          COLUMNS_TO_EXTRACT1,
          roughLabels
        )
        ElMessage.info(t('message.missForestDone', { recognized: recognizedCount, total: roughLabels.length }))
      }
      progressPercentage.value = 80
    } else {
      // ── 单段式 KNN 插补（默认模式或太古代样品回退）──────────────────────
      progressPercentage.value = 50
      imputedModelRows = await imputeRowsByKnn(anhydrousModelRows, COLUMNS_TO_EXTRACT1)
      progressPercentage.value = 75
    }

    // 中文注释：表格展示同步写回插补后的数值，便于用户复核哪些字段参与了后续判别。
    fileData.value = anhydrousDisplayRows.map((row, rowIndex) => {
      const nextRow = { ...row }
      COLUMNS_TO_EXTRACT1.forEach((columnName, modelIndex) => {
        const displayIndex = COLUMNS_TO_EXTRACT.indexOf(columnName)
        if (displayIndex !== -1) {
          nextRow[`col${displayIndex}`] = Number(imputedModelRows[rowIndex][modelIndex].toFixed(6))
        }
      })
      return nextRow
    })

    progressPercentage.value = 90
    processedData.value = await normalizeData(imputedModelRows, COLUMNS_TO_EXTRACT1)

    progressPercentage.value = 100
    ElMessage.success(t('message.processSuccess'))
  } catch (error) {
    console.error('数据处理失败:', error)
    ElMessage.error(t('message.processFail'))
  } finally {
    processing.value = false
    setTimeout(() => {
      progressPercentage.value = 0
    }, 300)
  }
}

const handlePredict = async () => {
  if (!processedData.value.length && !fileData.value.length) {
    ElMessage.error(t('message.processDataFirst'))
    return
  }

  const rowsForPrediction = processedData.value.length
    ? processedData.value
    : buildModelRowsFromTableData(fileData.value)

  if (!processedData.value.length) {
    ElMessage.info(t('message.skipProcess'))
  }

  predicting.value = true
  progressPercentage.value = 10
  let progressTimer = null

  try {
    // nextTick + requestAnimationFrame 确保 loading overlay 先渲染出来，
    // 再开始同步密集的 ONNX 推理，防止 UI 在运算期间冻结不显示加载状态。
    await nextTick()
    await new Promise(resolve => window.requestAnimationFrame(resolve))

    // ONNX 推理耗时随样品量线性增长且无法精确预估，
    // 用定时器缓慢推进进度条，让用户感知系统仍在运行而非卡死。
    // 上限钳在 88%，预留最后 12% 给实际完成回调来精确触达 100%。
    progressTimer = window.setInterval(() => {
      if (progressPercentage.value < 88) {
        progressPercentage.value += progressPercentage.value < 55 ? 4 : 2
      }
    }, 450)

    await loadModel()

    progressPercentage.value = 40
    predictions.value = await predictRows(
      rowsForPrediction,
      COLUMNS_TO_EXTRACT1,
      MODEL_SEQUENCE_COLUMNS,
      {
        batchSize: 96,
        onProgress: ({ completed, total }) => {
          const percent = total ? completed / total : 0
          // Math.max 防止定时器已把进度推得更高时被 onProgress 倒退。
          progressPercentage.value = Math.max(
            progressPercentage.value,
            Math.min(96, Math.round(40 + percent * 56))
          )
        }
      }
    )

    // 把预测结果回写到 fileData，让表格可以直接展示 prediction / confidence 列，
    // 同时保留原始元素数据列，方便用户对比原始值和判别结果。
    fileData.value = fileData.value.map((row, index) => ({
      ...row,
      prediction: predictions.value[index]?.label || '',
      confidence: predictions.value[index]
        ? Number((predictions.value[index].confidence * 100).toFixed(2))
        : ''
    }))

    progressPercentage.value = 100
    ElMessage.success(t('message.predictSuccess'))
    // 预测成功后自动跳到空间分布。若无任何有效坐标则保留在统计分析
    const hasCoord = coordinateData.value.some(c => c && c.lat !== null && c.lon !== null && !isNaN(c.lat) && !isNaN(c.lon))
    if (hasCoord) {
      workspaceTab.value = 'map'
    }
  } catch (error) {
    console.error('预测失败:', error)
    ElMessage.error(`${t('message.predictFail')}${error?.message ? `：${error.message}` : ''}`)
  } finally {
    if (progressTimer) {
      window.clearInterval(progressTimer)
    }

    predicting.value = false
    setTimeout(() => {
      progressPercentage.value = 0
    }, 300)
  }
}

const downloadResults = () => {
  if (!predictions.value.length) {
    ElMessage.error(t('message.noResults'))
    return
  }

  const headers = [...COLUMNS_TO_EXTRACT, 'Predicted_Setting', 'Confidence']
  const csvRows = [headers.join(',')]

  fileData.value.forEach(row => {
    const values = COLUMNS_TO_EXTRACT.map((_, index) => row[`col${index}`] ?? '')
    values.push(row.prediction || '')
    values.push(row.confidence || '')
    csvRows.push(values.join(','))
  })

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const baseName = currentFileName.value ? currentFileName.value.split('.').slice(0, -1).join('.') : 'result'
  const date = new Date().toISOString().slice(0, 10)

  link.href = url
  link.download = `${baseName}_tectonic_predictions_${date}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const copySummary = async () => {
  const text = t('message.summary', { total: fileData.value.length, predicted: predictions.value.length })
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(t('message.summaryCopied'))
  } catch {
    ElMessage.info(text)
  }
}

const goHome = () => {
  fileData.value = []
  processedData.value = []
  predictions.value = []
  coordinateData.value = []
  workspaceTab.value = 'stat'
  mapProcessOpen.value = false
  currentFileName.value = ''
}

const toggleMapProcessSidebar = async () => {
  mapProcessOpen.value = !mapProcessOpen.value
  await nextTick()
  mapViewRef.value?.updateMapSize?.()
}

const exportMapResult = () => {
  if (!predictions.value.length) { ElMessage.error(t('message.needPredictFirst')); return }
  const headers = ['INDEX', 'LATITUDE', 'LONGITUDE', 'Predicted_Setting', 'Confidence']
  const rows = [headers.join(',')]
  coordinateData.value.forEach((coord, i) => {
    if (!coord || coord.lat === null) return
    const pred = predictions.value[i]
    rows.push([i + 1, coord.lat, coord.lon, pred?.label || '', pred ? (pred.confidence * 100).toFixed(2) : ''].join(','))
  })
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${currentFileName.value.replace(/\.\w+$/, '') || 'spatial'}_spatial_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const exportCurrentMapImage = async () => {
  try {
    await mapViewRef.value?.exportMapImage?.()
    ElMessage.success(t('message.mapImgExported'))
  } catch (error) {
    ElMessage.error(error?.message || t('message.mapImgExportFail'))
  }
}

onMounted(() => {
  loadModel().catch(() => {})
})
</script>

<style scoped>
.system-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f3f8ff 0%, #f8fbff 46%, #f5f9ff 100%);
  color: #0b2454;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: grid;
  grid-template-columns: minmax(420px, 520px) 1fr auto;
  align-items: stretch;
  min-height: 84px;
  padding: 0 24px;
  background:
    linear-gradient(90deg, #031d52 0%, #052761 52%, #031847 100%),
    radial-gradient(circle at 78% 0%, rgba(53, 128, 255, 0.54), transparent 30%);
  color: #fff;
  box-shadow: 0 9px 22px rgba(4, 33, 86, 0.22);
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  cursor: pointer;
}

.brand-logo {
  position: relative;
  width: 60px;
  height: 60px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(169, 210, 255, 0.7);
  border-radius: 18px;
  background:
    linear-gradient(145deg, rgba(232, 247, 255, 0.9), rgba(20, 114, 255, 0.7)),
    linear-gradient(145deg, #0b8dff, #06377e);
  box-shadow: inset 0 0 18px rgba(255, 255, 255, 0.22), 0 0 0 6px rgba(22, 112, 255, 0.15);
  clip-path: polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%);
}

.brand-logo::before,
.brand-logo::after {
  content: '';
  position: absolute;
  border: 1px solid rgba(230, 246, 255, 0.62);
  clip-path: inherit;
}

.brand-logo::before {
  inset: 8px;
  background: rgba(255, 255, 255, 0.12);
}

.brand-logo::after {
  inset: 17px;
  background: linear-gradient(145deg, #e7f6ff, #167aff 58%, #064199);
}

.cube-core {
  z-index: 1;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: rgba(229, 246, 255, 0.82);
  box-shadow: 0 0 0 8px rgba(255, 255, 255, 0.13);
  transform: rotate(45deg);
}

.brand-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.brand-text strong {
  overflow: hidden;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.05;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brand-text span {
  color: rgba(235, 245, 255, 0.88);
  font-size: 15px;
}

.main-nav {
  display: flex;
  align-items: stretch;
  justify-content: center;
  min-width: 0;
}

.nav-item {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-width: 128px;
  padding: 0 19px;
  border: 0;
  border-left: 1px solid transparent;
  border-right: 1px solid transparent;
  background: transparent;
  color: rgba(235, 245, 255, 0.88);
  font: inherit;
  font-size: 17px;
  font-weight: 800;
  cursor: pointer;
}

.nav-item:hover,
.nav-item.active {
  background: #fff;
  color: #0b66ff;
}

.nav-item.active {
  box-shadow: inset 0 -3px 0 #0b66ff;
}

.nav-item .el-icon {
  font-size: 20px;
}

.header-tools {
  display: flex;
  align-items: center;
  gap: 22px;
  padding-left: 22px;
}

.research-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 800;
  white-space: nowrap;
}

.avatar-button {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: #0b66ff;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
}

.home-dashboard,
.workspace {
  width: min(1874px, calc(100% - 48px));
  margin: 18px auto 28px;
}

.hero-card,
.panel,
.feature-card,
.data-panel,
.process-sidebar {
  border: 1px solid #d8e6f7;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8px 22px rgba(25, 78, 146, 0.09);
}

.hero-card {
  min-height: 362px;
  display: grid;
  grid-template-columns: minmax(610px, 0.88fr) minmax(720px, 1.12fr);
  gap: 0;
  overflow: hidden;
  background:
    linear-gradient(90deg, #ffffff 0%, rgba(244, 250, 255, 0.96) 44%, rgba(232, 243, 255, 0.72) 100%),
    radial-gradient(circle at 54% 8%, rgba(11, 102, 255, 0.13), transparent 29%);
}

.hero-copy {
  position: relative;
  z-index: 2;
  padding: 43px 26px 34px 54px;
}

.hero-copy h1 {
  margin: 0 0 20px;
  color: #061e54;
  font-size: 42px;
  line-height: 1.18;
  letter-spacing: 0;
}

.hero-copy p {
  max-width: 760px;
  margin: 0;
  color: #183e76;
  font-size: 18px;
  line-height: 1.85;
}

.hero-actions,
.hero-promises {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px;
  margin-top: 26px;
}

.hero-actions :deep(.el-button) {
  min-width: 182px;
  min-height: 54px;
  border: 0;
  border-radius: 7px;
  background: linear-gradient(180deg, #0b64e8 0%, #004fc8 100%);
  box-shadow: 0 10px 22px rgba(0, 79, 200, 0.28);
  font-size: 18px;
  font-weight: 800;
}

.hero-actions :deep(.el-button .el-icon) {
  font-size: 21px;
}

.doc-button {
  min-width: 178px;
  min-height: 54px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 1px solid #1674ff;
  border-radius: 7px;
  background: #fff;
  color: #075ff0;
  font-family: inherit;
  font-size: 17px;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(19, 103, 236, 0.08);
  transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.doc-button:hover {
  background: #f5f9ff;
  box-shadow: 0 12px 24px rgba(19, 103, 236, 0.14);
  transform: translateY(-1px);
}

.doc-button .el-icon {
  font-size: 21px;
}

.hero-promises {
  gap: 48px;
  margin-top: 36px;
}

.hero-promises span {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #0d58c8;
  font-size: 15px;
  font-weight: 800;
}

.hero-promises .el-icon {
  color: #0b66ff;
  font-size: 25px;
}

.hero-visual {
  position: relative;
  min-height: 360px;
  overflow: hidden;
  background-position: center right;
  background-size: cover;
}

.hero-visual::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.62) 0%, rgba(255, 255, 255, 0.14) 25%, rgba(1, 47, 128, 0.02) 100%),
    radial-gradient(circle at 67% 30%, rgba(32, 126, 255, 0.08), transparent 24%);
}

.hero-visual::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(7, 86, 206, 0.04)),
    linear-gradient(120deg, rgba(11, 102, 255, 0.12) 0 1px, transparent 1px 78px);
  opacity: 0.38;
}

.volcano-halo {
  display: none;
}

.visual-card {
  position: absolute;
  z-index: 2;
  border: 1px solid rgba(255, 255,255, 0.24);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(226, 241, 255, 0.2), rgba(167, 205, 248, 0.08)),
    rgba(130, 183, 244, 0.06);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    0 12px 26px rgba(25, 88, 168, 0.09);
  backdrop-filter: blur(1px) saturate(108%);
}

.element-card {
  top: 38px;
  left: 20%;
  display: grid;
  grid-template-columns: repeat(4, 43px);
  gap: 6px;
  padding: 13px;
}

.element-card span {
  display: grid;
  place-items: center;
  height: 35px;
  border: 1px solid rgba(110, 164, 234, 0.46);
  border-radius: 4px;
  color: #073574;
  font-weight: 800;
  background: rgba(220, 238, 255, 0.2);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.scatter-card {
  left: 11%;
  bottom: 58px;
  width: 222px;
  height: 116px;
}

.chart-grid {
  position: absolute;
  inset: 12px;
  background-image:
    linear-gradient(rgba(79, 145, 238, 0.2) 1px, transparent 1px),
    linear-gradient(90deg, rgba(79, 145, 238, 0.2) 1px, transparent 1px);
  background-size: 28px 24px;
}

.scatter-card i {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #126bff;
}

.line-card {
  top: 58px;
  right: 15%;
  width: 152px;
  height: 100px;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 14px;
}

.line-card span {
  flex: 1;
  border-radius: 5px 5px 0 0;
  background: linear-gradient(180deg, rgba(91, 166, 255, 0.95), rgba(11, 102, 255, 0.88));
}

.network-card {
  top: 42px;
  right: 3.5%;
  width: 118px;
  height: 112px;
}

.network-card::before,
.network-card::after {
  content: '';
  position: absolute;
  inset: 24px 16px;
  border-top: 1px solid rgba(12, 102, 255, 0.28);
  border-left: 1px solid rgba(12, 102, 255, 0.28);
  transform: rotate(25deg);
}

.network-card i {
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #0b66ff;
  box-shadow: 0 0 0 5px rgba(11, 102, 255, 0.1);
}

.network-card i:nth-child(1) { left: 18px; top: 28px; }
.network-card i:nth-child(2) { left: 52px; top: 18px; }
.network-card i:nth-child(3) { right: 24px; top: 36px; }
.network-card i:nth-child(4) { left: 36px; top: 66px; }
.network-card i:nth-child(5) { right: 36px; top: 72px; }
.network-card i:nth-child(6) { left: 68px; bottom: 18px; }
.network-card i:nth-child(7) { right: 14px; bottom: 34px; }

.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  margin-top: 18px;
}

.feature-card {
  display: flex;
  align-items: center;
  gap: 18px;
  min-height: 112px;
  padding: 20px 22px;
}

.feature-icon,
.flow-icon,
.model-icon {
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #eaf3ff;
  color: #0b66ff;
}

.feature-icon {
  width: 70px;
  height: 70px;
  font-size: 36px;
}

.feature-card:nth-child(2) .feature-icon {
  position: relative;
  background: #e7fff3;
  color: #14b86a;
}

.feature-card:nth-child(2) .feature-icon .el-icon {
  display: none;
}

.feature-card:nth-child(2) .feature-icon::before {
  content: 'XLS';
  width: 34px;
  height: 42px;
  display: grid;
  place-items: end center;
  padding-bottom: 6px;
  border-radius: 7px;
  background:
    linear-gradient(135deg, transparent 0 11px, rgba(255, 255, 255, 0.82) 11px 17px, transparent 17px),
    linear-gradient(180deg, #23c579, #0aa95e);
  color: #fff;
  font-size: 11px;
  font-weight: 900;
  box-shadow: 0 8px 16px rgba(20, 184, 106, 0.24);
}

.feature-card:nth-child(2) .feature-icon::after {
  content: '';
  position: absolute;
  right: 15px;
  bottom: 18px;
  width: 16px;
  height: 12px;
  border-radius: 3px;
  background:
    linear-gradient(#fff 0 0) 50% 33% / 11px 1px no-repeat,
    linear-gradient(#fff 0 0) 50% 66% / 11px 1px no-repeat,
    rgba(255, 255, 255, 0.24);
  border: 1px solid rgba(255, 255, 255, 0.7);
}

.feature-card:nth-child(3) .feature-icon {
  background: #f0edff;
  color: #6655e9;
}

.feature-card:nth-child(4) .feature-icon {
  background: #e9f4ff;
  color: #0d7dff;
}

.feature-card h3,
.mini-card strong,
.scene-card strong {
  margin: 0 0 8px;
  color: #08235a;
  font-size: 18px;
  line-height: 1.25;
}

.feature-card p,
.mini-card span,
.scene-card p {
  margin: 0;
  color: #315177;
  font-size: 15px;
  line-height: 1.55;
}

.dashboard-grid,
.lower-grid,
.workspace {
  display: grid;
  gap: 18px;
}

.dashboard-grid {
  grid-template-columns: minmax(560px, 1.18fr) minmax(560px, 1.02fr) minmax(330px, 0.64fr);
  margin-top: 18px;
}

.panel {
  position: relative;
  padding: 18px 26px;
}

.panel-title {
  margin-bottom: 14px;
  color: #08235a;
  font-size: 18px;
  font-weight: 900;
}

.flow-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.flow-step {
  position: relative;
  min-height: 116px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 14px 10px 10px;
  text-align: center;
}

.flow-step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 58px;
  right: -12px;
  width: 24px;
  height: 2px;
  background: linear-gradient(90deg, #8bbcff 50%, transparent 50%);
  background-size: 8px 2px;
}

.flow-index {
  position: absolute;
  top: 0;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #0b66ff;
  color: #fff;
  font-weight: 900;
}

.flow-icon {
  width: 58px;
  height: 58px;
  margin-top: 10px;
  border: 1px solid #cde1ff;
  font-size: 29px;
}

.flow-step strong {
  color: #0a3578;
  font-size: 16px;
}

.flow-step p {
  margin: 0;
  color: #507096;
  font-size: 13px;
  line-height: 1.4;
}

.capability-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.mini-card {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-height: 74px;
  padding: 8px 14px;
  border: 1px solid #dce9f9;
  border-radius: 8px;
  background: linear-gradient(135deg, #fff, #f7fbff);
}

.mini-card .el-icon {
  color: #0b66ff;
  font-size: 30px;
}

.mini-card div,
.scene-card div {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.status-list {
  display: grid;
  gap: 16px;
  padding-right: 92px;
  margin-left: 6px;
  margin-top: 6px;
}

.status-list div {
  display: grid;
  grid-template-columns: 112px 1fr;
  gap: 16px;
  align-items: center;
}

.status-list span {
  color: #315177;
  font-size: 15px;
}

.status-list strong {
  color: #075dff;
  font-size: 15px;
  margin-left: -16px;
}

.cube-illustration {
  position: absolute;
  right: 22px;
  bottom: 26px;
  width: 76px;
  height: 76px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: linear-gradient(145deg, #eef7ff, #dfeeff);
}

.cube-illustration span {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(145deg, #9ed0ff, #0b66ff);
  box-shadow: 0 0 0 12px rgba(11, 102, 255, 0.08);
  transform: rotate(45deg);
}

.lower-grid {
  grid-template-columns: minmax(560px, 1.08fr) minmax(390px, 0.68fr) minmax(310px, 0.52fr);
  margin-top: 18px;
}

.scene-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.scene-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 106px;
  padding: 16px;
  border: 1px solid #dce9f9;
  border-radius: 8px;
  background: #f8fbff;
}

.scene-card .el-icon {
  flex: 0 0 auto;
  color: #0b66ff;
  font-size: 42px;
}

.recent-panel table {
  width: 100%;
  border-collapse: collapse;
  color: #12366b;
  font-size: 14px;
}

.recent-panel th,
.recent-panel td {
  padding: 11px 10px;
  border-bottom: 1px solid #e6eef9;
  text-align: left;
}

.recent-panel th {
  background: #f1f6fd;
  color: #315177;
  font-weight: 800;
}

.sample-panel {
  display: flex;
  flex-direction: column;
}

.sample-panel a {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  color: #0c4fb6;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}

.workspace {
  position: relative;
  grid-template-columns: 280px minmax(0, 1fr) 360px;
  align-items: start;
}

.workspace.workspace-map-mode {
  width: 100%;
  height: calc(100vh - 84px);
  margin: 0;
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
  align-items: stretch;
  overflow: hidden;
}

/* 右侧空间筛选侧栏展开：地图不再全屏，让出右侧固定栏，二者同高协调 */
.workspace.workspace-map-mode.workspace-side-open {
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
  padding: 18px;
}

.workspace.workspace-map-mode.workspace-process-open {
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 18px;
  padding: 18px;
}

.workspace.workspace-map-mode.workspace-process-open.workspace-side-open {
  grid-template-columns: 280px minmax(0, 1fr) 360px;
}

/* 地图模式：标题区 + 右侧 Tab/按钮合成顶部一栏，作为系统标题栏下方的独立条带，
   在文档流中占据高度，不再悬浮覆盖地图。 */
.workspace-map-mode .workspace-topbar {
  position: relative;
  z-index: 26;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  /* 左侧留出流程栏开关按钮(左上角)空间，避免标题被遮挡 */
  padding: 10px 18px 10px 58px;
  background: #fff;
  border-bottom: 1px solid #e3edf9;
  box-shadow: 0 4px 14px rgba(20, 61, 112, 0.06);
}

/* 流程栏展开时，开关按钮移入左侧栏，顶栏左侧无需再留空 */
.workspace-process-open .workspace-topbar {
  padding-left: 18px;
}

/* 合并后内部两块不再各自成卡片，去掉定位与卡片样式 */
.workspace-map-mode .workspace-head {
  position: static;
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: none;
  box-shadow: none;
  backdrop-filter: none;
}

/* 标题与“当前文件”同行显示，文件信息不换到第二行 */
.workspace-map-mode .workspace-head .drag-handle {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  column-gap: 14px;
  row-gap: 0;
}

.workspace-map-mode .workspace-head .eyebrow {
  display: none;
}

.workspace-map-mode .workspace-head h2 {
  font-size: 22px;
  margin: 0;
  white-space: nowrap;
}

.workspace-map-mode .workspace-head p {
  font-size: 13.5px;
  margin: 0;
  white-space: nowrap;
}

.workspace-map-mode .workspace-head-right {
  position: static;
  z-index: auto;
  transform: none;
  flex: 0 0 auto;
  flex-direction: row;
  align-items: center;
  white-space: nowrap;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: none;
  box-shadow: none;
  backdrop-filter: none;
}

.workspace-map-mode .workspace-head-right :deep(.el-button) {
  min-height: 40px;
  white-space: nowrap;
}

.workspace-map-mode .workspace-head-right .view-tabs {
  flex: 0 0 auto;
  flex-direction: row;
  white-space: nowrap;
}

.workspace-map-mode .workspace-head-right .view-tab {
  min-width: 88px;
  white-space: nowrap;
}

.workspace-process-open .workspace-head {
  position: static;
  padding-left: 0;
}

.workspace-map-mode .workspace-main {
  height: 100%;
  min-height: 0;
  gap: 0;
}

/* 顶栏占据高度后，地图填满 workspace-main 的剩余空间 */
.workspace-map-mode :deep(.mv-root) {
  flex: 1;
  height: auto;
  min-height: 0;
}

.workspace-map-mode :deep(.mv-map-wrap) {
  height: 100%;
  min-height: 0;
}

.workspace-map-mode .workspace-side {
  /* 作为独立右侧栏，与主界面（地图）同高，不再悬浮在地图之上 */
  position: relative;
  z-index: 1;
  width: auto;
  height: 100%;
  min-height: 0;
}

.map-side-chip {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 28;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid rgba(184, 213, 255, 0.78);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.72);
  color: #0b66ff;
  font-size: 14px;
  font-weight: 900;
  box-shadow: 0 14px 34px rgba(20, 61, 112, 0.16);
  backdrop-filter: blur(12px);
  cursor: pointer;
}

.dragging-panel {
  cursor: grabbing !important;
  user-select: none;
}

.drag-handle {
  cursor: grab;
}

.process-toggle-btn {
  position: absolute;
  top: 12px;
  left: 0;
  z-index: 30;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 11px;
  border: 1px solid #b8d5ff;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.96);
  color: #0b66ff;
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 8px 20px rgba(20, 80, 150, 0.13);
  cursor: pointer;
}

.process-toggle-btn:hover {
  background: #eef6ff;
}

.workspace-process-open .process-toggle-btn {
  /* 中文注释：流程栏展开时按钮收回左侧栏内部，避免压住主标题。 */
  left: 238px;
  width: 38px;
  min-width: 38px;
  padding: 0;
  justify-content: center;
}

.workspace-process-open .process-toggle-btn span {
  display: none;
}

.process-sidebar {
  position: sticky;
  top: 100px;
  padding: 22px;
}

.process-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.process-list li {
  position: relative;
  display: grid;
  grid-template-columns: 38px 1fr auto;
  gap: 12px;
  min-height: 68px;
  color: #315177;
}

.process-list li::before {
  content: '';
  position: absolute;
  left: 18px;
  top: 38px;
  bottom: -7px;
  border-left: 1px dashed #9eb8dc;
}

.process-list li:last-child::before {
  display: none;
}

.process-list li > span {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 1px solid #9eb8dc;
  border-radius: 50%;
  background: #fff;
  color: #173a72;
  font-size: 16px;
  font-weight: 900;
}

.process-list li.active > span {
  border-color: #0b66ff;
  background: #0b66ff;
  color: #fff;
}

.process-list li.done > span {
  border-color: #13b85d;
  color: #13b85d;
}

.process-list strong {
  display: block;
  color: #12366b;
  font-size: 16px;
  line-height: 1.2;
}

.process-list p {
  margin: 6px 0 0;
  color: #657b9c;
  font-size: 13px;
}

.process-list .el-icon {
  color: #13b85d;
  font-size: 18px;
}

.research-card {
  margin-top: 22px;
  padding: 18px;
  border-radius: 8px;
  background: linear-gradient(180deg, #edf6ff, #f8fbff);
}

.research-card strong {
  color: #0b66ff;
  font-size: 17px;
}

.research-card p {
  margin: 10px 0 0;
  color: #426287;
  font-size: 14px;
  line-height: 1.75;
}

.workspace-main {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 默认透明化：不影响统计页原有 head / head-right 布局；仅地图模式下变成顶栏 */
.workspace-topbar {
  display: contents;
}

/* 统计模式下：head-right 浮到 workspace-main 右上角空白处 */
.workspace:not(.workspace-map-mode) .workspace-head-right {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 6px 8px;
  border: 1px solid rgba(184, 213, 255, 0.55);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 8px 22px rgba(20, 61, 112, 0.12);
  backdrop-filter: blur(10px);
}

/* 非地图模式下 head-right 的拖拽抓手保持显示，方便和地图模式行为一致 */
.workspace:not(.workspace-map-mode) .workspace-head-right-grip {
  display: inline-flex;
}

.workspace-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 72px;
}

.eyebrow {
  color: #0b66ff;
  font-size: 14px;
  font-weight: 900;
}

.workspace-head h2 {
  margin: 5px 0 4px;
  color: #08235a;
  font-size: 28px;
  line-height: 1.2;
}

.workspace-head p {
  margin: 0;
  color: #526f94;
  font-size: 15px;
}

.data-panel {
  padding: 12px 22px;
}

.workspace-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toggle-list {
  display: grid;
  gap: 13px;
}

.toggle-row {
  display: grid;
  grid-template-columns: 46px 1fr auto;
  gap: 14px;
  align-items: center;
  min-height: 78px;
  padding: 14px;
  border: 1px solid #e0ebf8;
  border-radius: 8px;
  background: #fbfdff;
}

.toggle-row .el-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 8px;
  background: #eaf3ff;
  color: #0b66ff;
  font-size: 24px;
}

.toggle-row strong {
  display: block;
  color: #14396e;
  font-size: 16px;
}

.toggle-row span {
  display: block;
  margin-top: 4px;
  color: #617b9c;
  font-size: 13px;
}

.toggle-row em {
  padding: 4px 9px;
  border-radius: 5px;
  background: #dff7e9;
  color: #0f9b50;
  font-size: 13px;
  font-style: normal;
  font-weight: 800;
}

.model-info {
  display: grid;
  grid-template-columns: 86px 1fr;
  gap: 18px;
}

.model-icon {
  width: 86px;
  height: 86px;
  font-size: 44px;
}

.model-info dl {
  margin: 0;
  display: grid;
  grid-template-columns: 74px 1fr;
  gap: 8px 12px;
}

.model-info dt {
  color: #607a9b;
  font-size: 13px;
}

.model-info dd {
  margin: 0;
  color: #0d3679;
  font-size: 14px;
  font-weight: 800;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 78px;
  padding: 12px 14px;
  border: 1px solid #d8e6f7;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(28, 83, 149, 0.06);
}

.metric-card span {
  color: #315177;
  font-size: 13px;
  font-weight: 800;
}

.metric-card strong {
  display: block;
  margin-top: 4px;
  font-size: 26px;
  line-height: 1;
}

.metric-card strong.blue {
  color: #0b49b6;
}

.metric-card strong.green {
  color: #13a75a;
}

.metric-card strong.orange {
  color: #ff7715;
}

.metric-card p {
  margin: 4px 0 0;
  color: #627a99;
  font-size: 12px;
}

.metric-card .el-icon {
  color: #0b66ff;
  font-size: 26px;
}

.export-panel {
  display: grid;
  gap: 14px;
}

.export-panel button {
  min-height: 58px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid #8db8ff;
  border-radius: 7px;
  background: #fff;
  color: #0b66ff;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
}

.insight-panel {
  background: linear-gradient(135deg, #ecfff5, #f7fffb);
  border-color: #bfead0;
}

.insight-panel p {
  margin: 10px 0 0;
  color: #117342;
  font-size: 14px;
  line-height: 1.8;
}

.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(244, 248, 253, 0.9);
  backdrop-filter: blur(8px);
}

.loading-box {
  min-width: 340px;
  padding: 36px 40px;
  border: 1px solid #d8e6f7;
  border-radius: 8px;
  background: #fff;
  text-align: center;
  box-shadow: 0 24px 56px rgba(22, 71, 136, 0.16);
}

.spin-icon {
  color: #0b66ff;
  font-size: 42px;
  animation: spin 1.4s linear infinite;
}

.loading-label {
  margin: 16px 0 14px;
  color: #08235a;
  font-size: 18px;
  font-weight: 800;
}

.loading-pct {
  margin: 10px 0 0;
  color: #0b66ff;
  font-size: 16px;
  font-weight: 900;
}

.loading-note {
  min-height: 18px;
  margin: 8px 0 0;
  color: #6a82a3;
  font-size: 14px;
}

@media (max-width: 1480px) {
  .app-header {
    grid-template-columns: minmax(280px, 360px) 1fr;
  }

  .header-tools {
    display: none;
  }

  .nav-item {
    min-width: auto;
  }

  .hero-card {
    grid-template-columns: minmax(520px, 0.92fr) minmax(540px, 1fr);
  }

  .hero-copy h1 {
    font-size: 38px;
  }

  .dashboard-grid,
  .lower-grid,
  .workspace {
    grid-template-columns: 1fr;
  }

  .process-sidebar {
    position: static;
  }
}

@media (max-width: 1120px) {
  .app-header {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
  }

  .main-nav {
    justify-content: flex-start;
    overflow-x: auto;
  }

  .nav-item {
    min-height: 52px;
    flex: 0 0 auto;
  }

  .hero-card,
  .feature-grid,
  .flow-row,
  .scene-grid,
  .metric-grid {
    grid-template-columns: 1fr;
  }

  .hero-copy {
    padding: 32px 28px;
  }

  .hero-visual {
    min-height: 280px;
  }

  .workspace.workspace-map-mode,
  .workspace.workspace-map-mode.workspace-process-open,
  .workspace.workspace-map-mode.workspace-side-open,
  .workspace.workspace-map-mode.workspace-process-open.workspace-side-open {
    grid-template-columns: 1fr;
  }

  .workspace-map-mode .workspace-topbar {
    flex-wrap: wrap;
    gap: 8px 12px;
  }

  .workspace-process-open .process-toggle-btn {
    left: 0;
    width: auto;
    padding: 0 11px;
  }

  .workspace-process-open .process-toggle-btn span {
    display: inline;
  }
}

@media (max-width: 720px) {
  .home-dashboard,
  .workspace {
    width: calc(100% - 24px);
    margin-top: 12px;
  }

  .brand-text strong {
    font-size: 21px;
    white-space: normal;
  }

  .hero-copy h1 {
    font-size: 30px;
  }

  .hero-copy p {
    font-size: 16px;
  }

  .hero-promises {
    gap: 14px;
  }

  .panel,
  .data-panel,
  .process-sidebar {
    padding: 18px;
  }

  .workspace-head {
    align-items: flex-start;
    flex-direction: column;
  }
}

.impute-method-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #e6eef9;
}

.impute-method-label {
  color: #14396e;
  font-size: 15px;
  font-weight: 800;
}

.impute-method-tabs {
  display: flex;
  border: 1px solid #cde1ff;
  border-radius: 6px;
  overflow: hidden;
}

.method-tab {
  padding: 5px 16px;
  border: 0;
  background: #f5f9ff;
  color: #426287;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.method-tab + .method-tab {
  border-left: 1px solid #cde1ff;
}

.method-tab.active {
  background: #0b66ff;
  color: #fff;
}

.impute-method-hint {
  margin: 10px 0 0;
  padding: 9px 13px;
  border-radius: 6px;
  background: #edf6ff;
  color: #315177;
  font-size: 13px;
  line-height: 1.65;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── workspace-head 右侧区域 ── */
.workspace-head-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

/* 独立悬浮框的拖拽抓手（非地图模式下隐藏，避免干扰原页面布局） */
.workspace-head-right-grip {
  display: none;
  align-items: center;
  padding: 0 4px;
  color: #94a3b8;
  font-weight: 900;
  letter-spacing: -2px;
  user-select: none;
  cursor: grab;
}

.workspace-map-mode .workspace-head-right-grip {
  display: inline-flex;
}

/* ── 统计/空间 Tab 切换器 ── */
.view-tabs {
  display: flex;
  border: 1px solid #cde1ff;
  border-radius: 8px;
  overflow: hidden;
  background: #f0f7ff;
}

.view-tab {
  padding: 8px 18px;
  border: none;
  background: transparent;
  color: #315177;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.view-tab.active {
  background: #0b66ff;
  color: #fff;
}

.view-tab:not(.active):hover {
  background: #dfeeff;
}

/* ── 地图筛选面板 ── */
.map-filter-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: min(680px, calc(100vh - 132px));
  max-height: calc(100vh - 132px);
  padding: 18px 20px;
  overflow-y: auto;
}

.workspace-map-mode .map-filter-panel {
  /* 拉满侧栏列高，使其与地图主界面高度一致 */
  flex: 1;
  min-height: 0;
  max-height: 100%;
  background: rgba(255, 255, 255, 0.72);
  border-color: rgba(184, 213, 255, 0.72);
  box-shadow: 0 18px 42px rgba(20, 61, 112, 0.2);
  backdrop-filter: blur(12px);
}

.map-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 4px;
}

.map-panel-head .panel-title {
  margin-bottom: 0;
}

.map-panel-close {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 7px;
  background: rgba(236, 246, 255, 0.9);
  color: #315177;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.map-panel-close:hover {
  background: #dfeeff;
}

.mf-section {
  padding: 12px 0;
  border-bottom: 1px solid #eef3fb;
}

.mf-section:last-of-type {
  border-bottom: none;
}

.mf-label {
  font-size: 12px;
  font-weight: 800;
  color: #315177;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.mf-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.mf-val {
  font-size: 14px;
  color: #0b66ff;
  font-weight: 900;
}

.mf-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cde1ff;
  border-radius: 7px;
  background: #f7fbff;
  color: #12366b;
  font-size: 13px;
  cursor: pointer;
  appearance: auto;
}

.mf-slider {
  width: 100%;
  accent-color: #0b66ff;
  cursor: pointer;
}

.mf-toggle-list,
.mf-check-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mf-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  color: #1e3a5f;
}

.mf-check-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #1e3a5f;
  cursor: pointer;
}

.mf-check-row input { accent-color: #0b66ff; cursor: pointer; }

.mf-disabled {
  opacity: 0.4;
  pointer-events: none;
}

/* Toggle switch */
.mf-switch {
  position: relative;
  display: inline-block;
  width: 34px;
  height: 19px;
  flex-shrink: 0;
  cursor: pointer;
}

.mf-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.mf-switch span {
  position: absolute;
  inset: 0;
  background: #c5d8f0;
  border-radius: 99px;
  transition: background 0.2s;
}

.mf-switch span::before {
  content: '';
  position: absolute;
  width: 13px;
  height: 13px;
  left: 3px;
  top: 3px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
}

.mf-switch input:checked + span {
  background: #0b66ff;
}

.mf-switch input:checked + span::before {
  transform: translateX(15px);
}

/* Export button */
.mf-export-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  margin-top: auto;
}

.mf-export-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 40px;
  padding: 9px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
  border: 1px solid #cde1ff;
  background: #f0f7ff;
  color: #0b66ff;
}

.mf-export-btn:hover {
  background: #dfeeff;
}
</style>
