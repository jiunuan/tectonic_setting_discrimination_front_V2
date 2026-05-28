<template>
  <el-dropdown @command="handleCommand">
    <span class="lang-switch">
      {{ locale === 'zh' ? '中文' : 'English' }}
      <el-icon class="lang-icon">
        <arrow-down />
      </el-icon>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="zh">中文</el-dropdown-item>
        <el-dropdown-item command="en">English</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { ArrowDown } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const handleCommand = (command) => {
  locale.value = command
  localStorage.setItem('locale', command)
}
</script>

<style scoped>
.lang-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: currentColor;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
}

.lang-icon {
  font-size: 13px;
}
</style>
