export const COLUMNS_TO_EXTRACT = [
  'NA2O(WT%)', 'MGO(WT%)', 'AL2O3(WT%)', 'SIO2(WT%)', 'P2O5(WT%)', 'K2O(WT%)',
  'CAO(WT%)', 'TIO2(WT%)', 'MNO(WT%)', 'FEOT(WT%)', 'LOI(WT%)', 'RB(PPM)', 'V(PPM)',
  'CR(PPM)', 'CO(PPM)', 'NI(PPM)', 'BA(PPM)', 'SR(PPM)', 'Y(PPM)', 'ZR(PPM)',
  'NB(PPM)', 'LA(PPM)', 'CE(PPM)', 'PR(PPM)', 'ND(PPM)', 'SM(PPM)', 'EU(PPM)',
  'GD(PPM)', 'TB(PPM)', 'DY(PPM)', 'HO(PPM)', 'ER(PPM)', 'YB(PPM)', 'LU(PPM)',
  'HF(PPM)', 'TA(PPM)', 'TH(PPM)'
]

export const COLUMNS_TO_EXTRACT1 = [
  'NA2O(WT%)', 'MGO(WT%)', 'CR(PPM)', 'AL2O3(WT%)', 'SIO2(WT%)', 'P2O5(WT%)',
  'K2O(WT%)', 'CAO(WT%)', 'TIO2(WT%)', 'V(PPM)', 'MNO(WT%)', 'FEOT(WT%)',
  'RB(PPM)', 'SR(PPM)', 'Y(PPM)', 'NB(PPM)', 'CO(PPM)', 'NI(PPM)',
  'BA(PPM)', 'LA(PPM)', 'CE(PPM)', 'PR(PPM)', 'ND(PPM)', 'ZR(PPM)',
  'SM(PPM)', 'EU(PPM)', 'GD(PPM)', 'TB(PPM)', 'DY(PPM)', 'HO(PPM)',
  'TH(PPM)', 'ER(PPM)', 'YB(PPM)', 'LU(PPM)', 'HF(PPM)', 'TA(PPM)'
]

export const MODEL_SEQUENCE_COLUMNS = [
  'RB(PPM)', 'K2O(WT%)', 'BA(PPM)', 'SR(PPM)', 'CAO(WT%)', 'NA2O(WT%)',
  'LA(PPM)', 'Y(PPM)', 'MGO(WT%)', 'PR(PPM)', 'CE(PPM)', 'ER(PPM)',
  'HO(PPM)', 'ND(PPM)', 'SM(PPM)', 'DY(PPM)', 'LU(PPM)', 'TB(PPM)',
  'GD(PPM)', 'YB(PPM)', 'EU(PPM)', 'TH(PPM)', 'AL2O3(WT%)', 'HF(PPM)',
  'ZR(PPM)', 'TIO2(WT%)', 'MNO(WT%)', 'V(PPM)', 'NB(PPM)', 'CR(PPM)',
  'TA(PPM)', 'FEOT(WT%)', 'CO(PPM)', 'NI(PPM)', 'SIO2(WT%)', 'P2O5(WT%)'
]

export const MAJOR_ELEMENTS = [
  'NA2O(WT%)', 'MGO(WT%)', 'AL2O3(WT%)', 'SIO2(WT%)', 'P2O5(WT%)',
  'K2O(WT%)', 'CAO(WT%)', 'TIO2(WT%)', 'MNO(WT%)', 'FEOT(WT%)'
]

// 太古代正式应用集筛选参数（与 predict_archean/archean_data_preprocess.py 对齐）：
// 无水归一化后 SiO2∈[44,53] 且 MgO≤18 的玄武岩范围；五项关键主量必须有值。
export const ARCHEAN_SIO2_MIN = 44.0
export const ARCHEAN_SIO2_MAX = 53.0
export const ARCHEAN_MGO_MAX = 18.0
export const ARCHEAN_MAX_MISSING_EXCLUSIVE = 18
export const ARCHEAN_REQUIRED_MAJORS = [
  'SIO2(WT%)', 'AL2O3(WT%)', 'FEOT(WT%)', 'MGO(WT%)', 'CAO(WT%)'
]

// 中文注释：下标 0..8 必须与模型输出 logits 的类别下标一一对应。
// 该顺序由训练脚本 pd.factorize(df_train['TECTONIC SETTING']) 的“首次出现序”决定
// （取自 05_normalize_basalt_train.csv），不是字母序；换模型/重训前务必核对 model_meta.json 的 label_order。
export const TECTONIC_SETTINGS = [
  'CONTINENTAL_RIFT',          // 0
  'OCEAN ISLAND',              // 1
  'SPREADING_CENTER',          // 2
  'Island arc',                // 3
  'CONTINENTAL FLOOD BASALT',  // 4
  'OCEANIC PLATEAU',           // 5
  'BACK-ARC_BASIN',            // 6
  'Intra-oceanic arc',         // 7
  'Continental arc'            // 8
]

export const MODEL_CLASS_NAMES = TECTONIC_SETTINGS

export const TECTONIC_SETTINGS_MAP = {
  'BACK-ARC_BASIN': '弧后盆地',
  'Continental arc': '大陆弧',
  'CONTINENTAL FLOOD BASALT': '大陆溢流玄武岩',
  'CONTINENTAL_RIFT': '大陆裂谷',
  'Intra-oceanic arc': '洋内弧',
  'Island arc': '岛弧',
  'OCEAN ISLAND': '大洋岛',
  'OCEANIC PLATEAU': '洋底高原',
  'SPREADING_CENTER': '洋中脊'
}

// Regex patterns for detecting Archean/craton filenames.
// Flags: i = case-insensitive, so ISUA / Isua / isua all match.
// [\s_\-]? between words handles spaces, underscores, hyphens, or direct concatenation.
export const ARCHEAN_CRATON_PATTERNS = [
  // ── Specific craton / locality names ──────────────────────────────────────
  /isua/i,
  /kaap[\s_\-]?vaal/i,
  /pilbara/i,
  /yilgarn/i,
  /norseman/i,
  /kambalda/i,
  /dharwar/i,
  /singhbhum/i,
  /zimbabwe[\s_\-]?craton/i,
  /amazonia/i,
  /s[aã]o?[\s_\-]?francisco/i,         // São Francisco / Sao Francisco
  /north[\s_\-]?china/i,               // North China / North_China / NorthChina
  /sino[\s_\-]?korean/i,               // Sino-Korean / SinoKorean
  /aldan/i,
  /anabar/i,
  /slave[\s_\-]?craton/i,
  /wyoming[\s_\-]?craton/i,
  /superior[\s_\-]?(craton|province)/i,
  /tarim[\s_\-]?craton/i,
  /greenland/i,

  // ── Age / type keywords ───────────────────────────────────────────────────
  /arch[ae]+an/i,                       // archean / archaean / archaean
  /paleo[\s_\-]?arch[ae]+an/i,
  /eo[\s_\-]?arch[ae]+an/i,
  /meso[\s_\-]?arch[ae]+an/i,
  /neo[\s_\-]?arch[ae]+an/i,
  /greenstone[\s_\-]?(belt|terrane)?/i,
  /ancient[\s_\-]?crust/i,
  /\bcraton\b/i,                        // word-boundary to avoid false hits
]

export const TECTONIC_COLORS = {
  // 中文注释：海洋底图下优先使用高辨识度配色，保证样品点和图例都清晰可见。
  'SPREADING_CENTER': '#FFCC80',
  'OCEAN ISLAND': '#00CED1',
  'OCEANIC PLATEAU': '#FF69B4',
  'BACK-ARC_BASIN': '#32CD32',
  'Continental arc': '#FF0000',
  'Island arc': '#FFD700',
  'Intra-oceanic arc': '#8B008B',
  'CONTINENTAL FLOOD BASALT': '#D4380D',
  'CONTINENTAL_RIFT': '#1E90FF'
}
