import * as echarts from 'echarts'
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { TECTONIC_COLORS } from '../constants'

export function useCharts(predictionsRef) {
  const { t, tm, locale } = useI18n()
  // 中文注释：构造环境名称按当前语言本地化（settings 字典的 key 含空格/连字符，
  // 用 tm() + 索引比 t() 的 keypath 解析更可靠），匹配不到时回退原始标签。
  const localizeSetting = (label) => {
    const dict = tm('settings')
    return (dict && dict[label]) || label
  }
  const pieChartRef = ref(null)
  const barChartRef = ref(null)
  let pieChart = null
  let barChart = null

  const getPredictions = () => {
    const raw = typeof predictionsRef === 'function' ? predictionsRef() : predictionsRef?.value || []
    return raw
  }

  const initCharts = () => {
    if (pieChartRef.value && barChartRef.value) {
      if (!pieChart) {
        pieChart = echarts.init(pieChartRef.value)
      }

      if (!barChart) {
        barChart = echarts.init(barChartRef.value)
      }
    }
  }

  const updateCharts = (predictions = getPredictions()) => {
    if (!pieChart || !barChart) return

    const counts = {}
    predictions.forEach(item => {
      const key = typeof item === 'string' ? item : item?.label
      if (!key) return
      counts[key] = (counts[key] || 0) + 1
    })

    const chartData = Object.entries(counts).map(([key, value]) => ({
      name: localizeSetting(key),
      value,
      itemStyle: {
        color: TECTONIC_COLORS[key] || '#64748b'
      }
    }))

    const sortedData = chartData.sort((a, b) => b.value - a.value)
    const labels = sortedData.map(item => item.name)
    const values = sortedData.map(item => item.value)

    pieChart.setOption({
      title: {
        text: t('charts.distribution'),
        left: 'center',
        textStyle: { fontSize: 18, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        type: 'scroll',
        textStyle: { fontSize: 12 }
      },
      series: [
        {
          type: 'pie',
          radius: '60%',
          center: ['62%', '56%'],
          data: sortedData,
          // 中文注释：扇区名称已由左侧图例与 tooltip 表达，关闭扇区标签避免长名称重叠错乱
          label: { show: false },
          labelLine: { show: false }
        }
      ]
    })

    barChart.setOption({
      title: {
        text: t('charts.statistics'),
        left: 'center',
        textStyle: { fontSize: 18, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: {
        left: '3%',
        right: '6%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: t('preview.count')
      },
      yAxis: {
        type: 'category',
        data: labels.reverse()
      },
      series: [
        {
          type: 'bar',
          data: values.reverse(),
          label: {
            show: true,
            position: 'right'
          }
        }
      ]
    })

    pieChart.resize()
    barChart.resize()
  }

  const handleResize = () => {
    pieChart?.resize()
    barChart?.resize()
  }

  // 中文注释：echarts 是命令式渲染，切换语言不会像模板那样自动更新，
  // 这里监听 locale 变化后重绘，使图表标题/图例/坐标轴名跟随语言切换。
  watch(locale, () => updateCharts())

  onMounted(() => {
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    pieChart?.dispose()
    barChart?.dispose()
  })

  return {
    pieChartRef,
    barChartRef,
    initCharts,
    updateCharts
  }
}
