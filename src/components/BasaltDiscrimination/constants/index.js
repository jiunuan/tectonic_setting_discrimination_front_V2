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

export const TECTONIC_SETTINGS = [
  'BACK-ARC_BASIN',
  'Continental arc',
  'CONTINENTAL FLOOD BASALT',
  'CONTINENTAL_RIFT',
  'Intra-oceanic arc',
  'Island arc',
  'OCEAN ISLAND',
  'OCEANIC PLATEAU',
  'SPREADING_CENTER'
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

// Maps CNN prediction label → MissForest JSON filename (in public/model/missforest/)
export const MISSFOREST_LABEL_TO_FILE = {
  'BACK-ARC_BASIN': 'BACK-ARC_BASIN',
  'Continental arc': 'Continental_arc',
  'CONTINENTAL FLOOD BASALT': 'CONTINENTAL_FLOOD_BASALT',
  'CONTINENTAL_RIFT': 'CONTINENTAL_RIFT',
  'Intra-oceanic arc': 'Intra-oceanic_arc',
  'Island arc': 'Island_arc',
  'OCEAN ISLAND': 'OCEAN_ISLAND',
  'OCEANIC PLATEAU': 'OCEANIC_PLATEAU',
  'SPREADING_CENTER': 'SPREADING_CENTER'
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
