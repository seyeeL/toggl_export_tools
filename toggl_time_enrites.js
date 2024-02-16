const axios = require('axios')
const moment = require('moment')
const { writeFile } = require('./common.js')
const { getProjectInfo, fetchTimeEntries } = require('./toggl.js')

moment.locale('zh-cn')

let start_date
let end_date
let projectInfo = {}

const getTogglTimeEntries = async ({ fileNamePrefix }) => {
  try {
    const response = await fetchTimeEntries({start_date, end_date})
    const formattedEntries = formatTimeEntries(response)
    let output = handleEntries(formattedEntries)
    writeFile(output, {
      start_date,
      end_date,
      fileNamePrefix,
      fileNameSuffix: 'time_entries',
    })
  } catch (error) {
    console.error(error)
  }
}
function handleEntries(formattedEntries) {
  let output = ''
  let totalHours = 0
  let totalMinutes = 0
  Object.keys(formattedEntries)
    .sort((a, b) => moment(b, 'YYYY-MM-DD').diff(moment(a, 'YYYY-MM-DD'))) // 倒序
    // .sort((a, b) => moment(a, 'YYYY-MM-DD').diff(moment(b, 'YYYY-MM-DD'))) // 正序
    .forEach(date => {
      formattedEntries[date].sort((a, b) => a.startTime.localeCompare(b.startTime))
      let itemHours = 0
      let itemMinutes = 0
      output += `- ${date}\n`
      const outputEntries = []

      formattedEntries[date].forEach(entry => {
        const { startTime, description, hours, minutes } = entry
        const existingEntry = outputEntries.find(e => e.description === description)
        totalHours += hours
        totalMinutes += minutes
        itemHours += hours
        itemMinutes += minutes
        if (existingEntry) {
          existingEntry.hours += hours
          existingEntry.minutes += minutes
        } else {
          const newEntry = {
            startTime,
            description,
            hours,
            minutes,
          }
          outputEntries.push(newEntry)
        }
      })

      outputEntries.forEach(entry => {
        if (entry.hours > 0 || entry.minutes > 0) {
          const formattedDuration = formatDuration(entry.hours, entry.minutes)
          output += `    - ${entry.startTime} ${entry.description} ${formattedDuration}\n`
        }
      })
      const formattedTotalDuration = formatDuration(itemHours, itemMinutes, false)
      if (outputEntries.length > 1) {
        output = output.replace(date, `${date}\n    - sum: ${formattedTotalDuration}`)
      }
      output += '\n'
    })
  output = `- 共 ${formatDuration(totalHours, totalMinutes, false)}\n\n${output}`
  return output
}

function formatTimeEntries(entries) {
  const formattedEntries = {}

  entries.forEach(entry => {
    const startDate = moment(entry.start)
    const stopDate = moment(entry.stop)
    const duration = entry.duration

    const date = startDate.format(`YYYY-MM-DD ddd`)
    // const date = `[[${startDate.format('YYYY-MM-DD')}]] ${startDate.format('ddd')}`

    const startTime = startDate.format('HH:mm')
    // const stopTime = stopDate.format('HH:mm')
    let description = entry.description

    if (description === '🏋️‍♂️ Traditional Strength Training') {
      description = '#健身房'
    }

    const blackProject = [] // 不加项目名的项目id
    // 加上项目名
    if (projectInfo[entry.project_id] && !blackProject.includes(entry.project_id)) {
      description = `${projectInfo[entry.project_id]} - ${description}`
    } else {
      description = `${description}`
    }

    if (!formattedEntries[date]) {
      formattedEntries[date] = []
    }

    const hours = Math.floor(duration / 3600)
    const minutes = Math.floor((duration % 3600) / 60)

    const formattedEntry = {
      startTime,
      description,
      hours,
      minutes,
    }

    formattedEntries[date].push(formattedEntry)
  })

  return formattedEntries
}

function formatDuration(hours, minutes, isTag = true) {
  const itemMinutes = hours * 60 + minutes
  const formattedHours = Math.floor(itemMinutes / 60)
  const formattedMinutes = itemMinutes % 60

  let formattedDuration = ''

  if (formattedHours > 0) {
    formattedDuration += `${isTag ? '#' : ''}${formattedHours}${isTag ? 'h ' : 'h'}`
  }

  if (formattedMinutes > 0) {
    formattedDuration += `${isTag ? '#' : ''}${formattedMinutes}${isTag ? 'm' : 'min'}`
  }

  return formattedDuration
}
const main = async ({ startDate, endDate, fileNamePrefix }) => {
  start_date = startDate
  end_date = endDate
  // fetchSummary()
  projectInfo = await getProjectInfo()
  await getTogglTimeEntries({ fileNamePrefix })
}
// main()

module.exports = main
