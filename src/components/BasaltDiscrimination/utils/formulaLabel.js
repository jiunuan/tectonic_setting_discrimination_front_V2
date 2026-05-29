// 中文注释：把上传/规范化后的元素列名（如 NA2O(WT%)、FEOT(WT%)、RB(PPM)）
// 渲染成带上下标的化学式（Na₂O、FeOᵀ、Rb 等），用于数据预览表头。
// 设计要点：
//   1) 列名可能来自不同来源、大小写/空格/下划线写法不一，匹配时统一归一化。
//   2) 匹配不上的列名（未知元素或自定义列）原样返回，绝不丢失信息。

// 归一化：去掉空格/下划线并转大写，便于宽松匹配各种写法。
const normalizeKey = (s) => String(s).replace(/[\s_]+/g, '').toUpperCase()

// 氧化物等需要下标/特殊写法的化学式。key 为归一化后的公式部分（不含单位）。
// 值为带 <sub>/<sup> 的 HTML 片段。
const OXIDE_HTML = {
  NA2O: 'Na<sub>2</sub>O',
  MGO: 'MgO',
  AL2O3: 'Al<sub>2</sub>O<sub>3</sub>',
  SIO2: 'SiO<sub>2</sub>',
  P2O5: 'P<sub>2</sub>O<sub>5</sub>',
  K2O: 'K<sub>2</sub>O',
  CAO: 'CaO',
  TIO2: 'TiO<sub>2</sub>',
  MNO: 'MnO',
  // 全铁，常写作 FeOt / FeO* / FeOtot
  FEOT: 'FeO<sup>T</sup>',
  FEOTOT: 'FeO<sup>T</sup>',
  'FEO*': 'FeO<sup>*</sup>',
  FE2O3: 'Fe<sub>2</sub>O<sub>3</sub>',
  FE2O3T: 'Fe<sub>2</sub>O<sub>3</sub><sup>T</sup>',
  FEO: 'FeO',
  CR2O3: 'Cr<sub>2</sub>O<sub>3</sub>',
  H2O: 'H<sub>2</sub>O',
  CO2: 'CO<sub>2</sub>',
  // 非化学式，保持原样
  LOI: 'LOI'
}

// 单位归一化展示：(WT%) → (wt%)，(PPM) → (ppm)，其余原样。
const formatUnit = (unit) => {
  const u = unit.toUpperCase()
  if (u === 'WT%') return 'wt%'
  if (u === 'PPM') return 'ppm'
  if (u === 'PPB') return 'ppb'
  return unit
}

// 把公式部分转成 HTML。先查氧化物表；否则若是 1~2 个字母的元素符号则规范大小写；
// 都不匹配返回 null（交由上层走原样回退）。
const formulaToHtml = (formula) => {
  const key = normalizeKey(formula)
  if (OXIDE_HTML[key]) return OXIDE_HTML[key]
  // 纯元素符号（Rb、V、Cr、Th…）：首字母大写，其余小写。
  if (/^[A-Z]{1,2}$/.test(key)) return key.charAt(0) + key.slice(1).toLowerCase()
  return null
}

/**
 * 将原始列名格式化为带上下标的 HTML 字符串，供表头 v-html 使用。
 * 匹配不上时原样返回原始列名（不做转义，原始列名为可信的内部常量）。
 * @param {string} raw 例如 'NA2O(WT%)'、'RB(PPM)'、'FEOT(WT%)'
 * @returns {string} HTML 片段
 */
export function formatColumnLabel(raw) {
  if (raw == null) return ''
  const label = String(raw)
  // 拆出尾部括号里的单位，公式部分为其余内容。
  const m = label.match(/^(.*?)\s*\(([^)]*)\)\s*$/)
  const formulaPart = (m ? m[1] : label).trim()
  const unitPart = m ? m[2].trim() : ''

  const html = formulaToHtml(formulaPart)
  if (!html) return label // 映射不上 → 原样返回

  return unitPart ? `${html} (${formatUnit(unitPart)})` : html
}
