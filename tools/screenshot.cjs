const { chromium } = require('playwright')
const path = require('path')

const BASE = 'http://localhost:5199'
const OUT = path.join(__dirname)
const CSV_PATH = path.join(__dirname, '..', 'public', 'data', 'Back_arc_basin.csv')

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1600, height: 900 })

  // ── Screenshot 1: homepage ───────────────────────────────────────────────
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUT, 'screenshot_home.png') })
  console.log('HOME SCREENSHOT done')

  // ── Open upload dialog ───────────────────────────────────────────────────
  await page.click('button:has-text("开始使用")')
  await page.waitForSelector('.el-dialog', { state: 'visible' })
  await page.waitForTimeout(500)

  // The el-upload wraps a hidden <input type="file">; trigger it directly
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.locator('.el-upload input[type="file"]').evaluate(el => el.click())
  ])
  await fileChooser.setFiles(CSV_PATH)

  // Dialog should close automatically after file is processed
  await page.waitForSelector('.el-dialog', { state: 'hidden', timeout: 15000 })
  await page.waitForTimeout(1000)

  // ── Click "数据处理" ─────────────────────────────────────────────────────
  await page.click('button:has-text("数据处理")')

  // Wait for loading overlay to disappear (KNN imputation can take a while)
  await page.waitForSelector('.loading-overlay', { state: 'hidden', timeout: 120000 })
  await page.waitForTimeout(800)

  // ── Click "开始预测" ─────────────────────────────────────────────────────
  await page.click('button:has-text("开始预测")')

  // Wait for prediction loading overlay to disappear
  await page.waitForSelector('.loading-overlay', { state: 'hidden', timeout: 120000 })
  await page.waitForTimeout(1500)

  // ── Screenshot 2: results page ───────────────────────────────────────────
  await page.screenshot({ path: path.join(OUT, 'screenshot_result.png') })
  console.log('RESULT SCREENSHOT done')

  await browser.close()
  console.log('ALL DONE')
})().catch(err => { console.error(err); process.exit(1) })
