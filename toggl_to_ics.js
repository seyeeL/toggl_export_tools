const ics = require('ics')
const moment = require('moment')
const { writeFileSync } = require('fs')
const { getProjectInfo, fetchTimeEntries } = require('./toggl.js')

// 转换 Toggl 时间条目为 ICS 事件
async function convertToICSEvents(timeEntries) {
  const events = []
  let projectInfo = await getProjectInfo()
  console.log(`projectInfo: ${JSON.stringify(projectInfo)}`)

  timeEntries.forEach(entry => {
    const start = new Date(entry.start)
    const end = new Date(entry.stop)

    const event = {
      start: [
        start.getFullYear(),
        start.getMonth() + 1,
        start.getDate(),
        start.getHours(),
        start.getMinutes(),
      ],
      end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), end.getHours(), end.getMinutes()],
      title: `${projectInfo[entry.project_id]} - ${entry.description}` || '',
      description: '',
      location: '',
    }

    events.push(event)
  })
  console.log(`events: ${JSON.stringify(events)}`)

  return events
}

// 生成 ICS 文件
function generateICSFile(events) {
  const { error, value } = ics.createEvents(events)

  if (error) {
    console.error('Failed to generate ICS file:', error)
    return
  }

  writeFileSync(`${__dirname}/event.ics`, value)
}

// 执行主要逻辑
async function run() {
  try {
    const timeEntries = await fetchTimeEntries({
      start_date: moment(new Date()).subtract(90, 'days').format('YYYY-MM-DD'),
      end_date: moment(new Date()).format('YYYY-MM-DD'),
    })
    const events = await convertToICSEvents(timeEntries)

    generateICSFile(events)
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

// 运行脚本
run()
