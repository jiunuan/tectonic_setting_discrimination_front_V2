import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/tectonic_setting_discrimination_front_V2/',
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: 5174,
    headers: {
      // 中文注释：开发环境禁用浏览器缓存，避免 Vite 模块缓存损坏后页面白屏。
      'Cache-Control': 'no-store'
    }
  },
  optimizeDeps: {
    // 中文注释：启动开发服务时重新预构建依赖，减少 node_modules/.vite 缓存不一致。
    force: true
  }
})