import { chromium } from 'playwright'

const url = 'http://127.0.0.1:5181/tectonic_setting_discrimination_front_V2/'
const browser = await chromium.launch()

const shots = [
  { lang: 'en', w: 1600, name: 'en-1600' },
  { lang: 'en', w: 1366, name: 'en-1366' },
  { lang: 'en', w: 1280, name: 'en-1280' },
  { lang: 'zh', w: 1600, name: 'zh-1600' },
]

for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: s.w, height: 900 }, deviceScaleFactor: 2 })
  await page.addInitScript((l) => localStorage.setItem('locale', l), s.lang)
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const header = await page.$('.app-header')
  await header.screenshot({ path: `.shot-${s.name}.png` })
  // 是否被省略号截断（scrollWidth > clientWidth 即溢出）
  const truncated = await page.evaluate(() => {
    const el = document.querySelector('.brand-text strong')
    return el.scrollWidth > el.clientWidth + 1
  })
  console.log(s.name, 'truncated=', truncated)
  await page.close()
}
await browser.close()
console.log('done')
