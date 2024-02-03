const getSummary = require('./toggl_summary.js')
const getTogglTimeEntries = require('./toggl_time_enrites.js')
const moment = require('moment')

let type = ''
let fileNamePrefix = ''
// 默认今天
let startDate = '2024-02-01'
let endDate = '2024-02-02'
getDate()
// 计算自然日数量（包括开始和结束日期）
const naturalDays = moment(endDate).diff(startDate, 'days') + 1

// 计算工作日数量
let workDays = 0
let currentDate = moment(startDate).clone()
while (currentDate.isSameOrBefore(endDate)) {
  if (currentDate.isoWeekday() <= 5) {
    // 1-5 表示周一至周五
    workDays++
  }
  currentDate.add(1, 'days')
}
console.log(startDate, endDate)
console.log(`自然日: ${naturalDays} 工作日: ${workDays}`)

// 根据 type 计算开始结束日期
function getDate() {
  const weekRegex = /^week(\d+)$/i
  const weekMatch = type.match(weekRegex)
  if (weekMatch) {
    const weekNumber = parseInt(weekMatch[1])
    startDate = moment()
      .isoWeekYear(2023)
      .isoWeek(weekNumber)
      .startOf('isoWeek')
      .format('YYYY-MM-DD')
    endDate = moment().isoWeekYear(2023).isoWeek(weekNumber).endOf('isoWeek').format('YYYY-MM-DD')
    fileNamePrefix = 'weekly'
    return
  }

  switch (type) {
    case 'yestoday':
      startDate = moment(new Date()).subtract(1, 'days').format('YYYY-MM-DD')
      endDate = moment(new Date()).subtract(1, 'days').format('YYYY-MM-DD')
      break
    case 'last7days':
      startDate = moment(new Date()).subtract(8, 'days').format('YYYY-MM-DD')
      endDate = moment(new Date()).subtract(1, 'days').format('YYYY-MM-DD')
      break
    case 'lastWeek':
      startDate = moment().subtract(1, 'weeks').startOf('isoWeek').format('YYYY-MM-DD')
      endDate = moment().subtract(1, 'weeks').endOf('isoWeek').format('YYYY-MM-DD')
      fileNamePrefix = 'weekly'
      break
    case 'lastMonth':
      startDate = moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD')
      endDate = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD')
      fileNamePrefix = 'monthly'
      break
    case 'thisMonth':
      startDate = moment().startOf('month').format('YYYY-MM-DD')
      endDate = moment().endOf('month').format('YYYY-MM-DD')
      fileNamePrefix = 'monthly'
      break
  }
}

getSummary({
  startDate,
  endDate,
  fileNamePrefix,
  naturalDays,
  workDays,
})
// 判断 startDate 是否早于今天之前的90天
const today = moment().startOf('day')
let diffDay = Math.abs(moment(startDate).diff(today, 'days'))

if (diffDay > 90) {
  console.log('开始时间超过90天，跳过 timeEntries', diffDay)
  return
}

getTogglTimeEntries({
  startDate,
  endDate,
  fileNamePrefix,
})
