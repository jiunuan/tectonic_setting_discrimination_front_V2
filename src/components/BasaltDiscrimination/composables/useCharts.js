import * as echarts from 'echarts'
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { TECTONIC_SETTINGS_MAP, TECTONIC_COLORS } from '../constants'

export function useCharts(predictionsRef) {
  const { t } = useI18n()
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
      name: TECTONIC_SETTINGS_MAP[key] || key,
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
        top: 'middle'
      },
      series: [
        {
          type: 'pie',
          radius: '52%',
          data: sortedData,
          label: {
            formatter: '{b}'
          }
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
