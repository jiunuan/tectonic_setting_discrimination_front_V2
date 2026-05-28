<template>
  <el-dialog
    :model-value="visible"
    width="900px"
    top="5vh"
    class="help-dialog"
    :show-close="false"
    @close="$emit('update:visible', false)"
  >
    <template #header>
      <div class="help-header">
        <div>
          <h2>{{ t('help.title') }}</h2>
          <p>{{ t('help.subtitle') }}</p>
        </div>
        <button class="help-close" type="button" @click="$emit('update:visible', false)">×</button>
      </div>
    </template>

    <div class="help-body" v-html="renderedHtml"></div>

    <template #footer>
      <div class="help-footer">
        <span class="help-foot-hint">v2 · {{ locale === 'zh' ? '中文' : 'English' }}</span>
        <el-button type="primary" @click="$emit('update:visible', false)">
          {{ t('help.close') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MarkdownIt from 'markdown-it'
// 中文注释：?raw 让 Vite 把 markdown 文件作为字符串直接打包进 bundle，
// 这样不依赖运行时网络，部署到任何路径都能正常加载。
import zhMd from '../../../docs/help.zh.md?raw'
import enMd from '../../../docs/help.en.md?raw'

defineProps({
  visible: { type: Boolean, required: true }
})
defineEmits(['update:visible'])

const { t, locale } = useI18n()
const md = new MarkdownIt({ html: false, linkify: true, breaks: false })

// 把 markdown 里相对图片路径前置 BASE_URL，兼容 GH Pages 等子路径部署
const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '/')
const fixImagePaths = (raw) => raw.replace(/!\[([^\]]*)\]\(([^)/][^)]*)\)/g, (_, alt, src) => {
  if (/^https?:\/\//.test(src) || src.startsWith('/')) return `![${alt}](${src})`
  return `![${alt}](${baseUrl}${src})`
})

const renderedHtml = computed(() => {
  const raw = locale.value === 'zh' ? zhMd : enMd
  return md.render(fixImagePaths(raw))
})
</script>

<style scoped>
.help-dialog :deep(.el-dialog) {
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(11, 35, 76, 0.28);
}

.help-dialog :deep(.el-dialog__header) {
  margin: 0;
  padding: 0;
  border-bottom: 1px solid #e6eef9;
}

.help-dialog :deep(.el-dialog__body) {
  padding: 0;
  background: linear-gradient(180deg, #fafdff 0%, #f4f9ff 100%);
}

.help-dialog :deep(.el-dialog__footer) {
  padding: 12px 24px;
  border-top: 1px solid #e6eef9;
  background: #fff;
}

.help-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 24px 16px;
  background:
    linear-gradient(135deg, #0b66ff 0%, #04308f 100%),
    radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.25), transparent 50%);
  color: #fff;
}

.help-header h2 {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.help-header p {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.82);
}

.help-close {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}

.help-close:hover {
  background: rgba(255, 255, 255, 0.28);
}

.help-body {
  max-height: 70vh;
  overflow-y: auto;
  padding: 24px 32px 28px;
  color: #1a3a6c;
  font-size: 14px;
  line-height: 1.78;
  font-family: var(--app-font-family);
}

.help-body :deep(h1) {
  margin: 0 0 10px;
  font-size: 24px;
  font-weight: 900;
  color: #08235a;
  letter-spacing: 0.01em;
}

.help-body :deep(blockquote) {
  margin: 0 0 18px;
  padding: 10px 16px;
  border-left: 4px solid #0b66ff;
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(11, 102, 255, 0.1), rgba(11, 102, 255, 0));
  color: #234b89;
  font-size: 14px;
}

.help-body :deep(blockquote p) {
  margin: 0;
}

.help-body :deep(img) {
  display: block;
  max-width: 100%;
  margin: 14px auto 22px;
  border-radius: 10px;
  box-shadow: 0 14px 32px rgba(11, 35, 76, 0.18);
  background: #fff;
}

.help-body :deep(h2) {
  margin: 32px 0 12px;
  padding: 8px 14px;
  font-size: 17px;
  font-weight: 900;
  color: #08235a;
  border-left: 4px solid #0b66ff;
  background: linear-gradient(90deg, rgba(11, 102, 255, 0.12), rgba(11, 102, 255, 0));
  border-radius: 0 6px 6px 0;
}

.help-body :deep(h3) {
  margin: 18px 0 8px;
  font-size: 15px;
  font-weight: 800;
  color: #12366b;
}

.help-body :deep(p) {
  margin: 6px 0 10px;
  color: #2a4c7e;
}

.help-body :deep(strong) {
  color: #08235a;
  font-weight: 800;
}

.help-body :deep(ul),
.help-body :deep(ol) {
  margin: 6px 0 10px;
  padding-left: 22px;
}

.help-body :deep(li) {
  margin: 4px 0;
  color: #2a4c7e;
}

.help-body :deep(code) {
  padding: 1px 6px;
  border: 1px solid #d8e6f7;
  border-radius: 4px;
  background: #f1f6fd;
  color: #0b49b6;
  font-size: 12.5px;
  font-family: 'JetBrains Mono', Consolas, monospace;
}

.help-body :deep(a) {
  color: #0b66ff;
  text-decoration: none;
  border-bottom: 1px dashed currentColor;
}

.help-body :deep(a:hover) {
  color: #04308f;
}

.help-body :deep(hr) {
  margin: 22px 0;
  border: 0;
  border-top: 1px dashed #cfdcf0;
}

.help-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.help-foot-hint {
  color: #94a3b8;
  font-size: 12px;
}

/* 滚动条美化 */
.help-body::-webkit-scrollbar {
  width: 8px;
}
.help-body::-webkit-scrollbar-track {
  background: transparent;
}
.help-body::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background: #cdddf1;
}
.help-body::-webkit-scrollbar-thumb:hover {
  background: #98b6dc;
}
</style>
