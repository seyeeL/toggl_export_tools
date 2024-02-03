const fs = require('fs')
const qs = require('qs')
const axios = require('axios')
const moment = require('moment')
const { workspace_id, headers } = require('./default.config.js')
const { writeFile } = require('./common.js')
const { getProjectInfo } = require('./toggl.js')
moment.locale('zh-cn')

let start_date
let end_date
let projectInfo

// 格式化 second
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  const hoursDisplay = hours > 0 ? hours + 'h' : ''
  const minutesDisplay = minutes > 0 ? minutes + 'min' : ''

  return hoursDisplay + '' + minutesDisplay
}

const getSummary = async ({ naturalDays, workDays, fileNamePrefix }) => {
  try {
    const response = await axios.post(
      `https://track.toggl.com/reports/api/v3/workspace/${workspace_id}/summary/time_entries`,
      {
        end_date,
        start_date,
      },
      {
        headers,
      },
    )
    let output = ''
    let totalCount = 0
    let projectList = response.data.groups
      .reduce((acc, group) => {
        let projectName = group.id ? projectInfo[group.id] : '琐事'
        // 计算每个 sub_group 的 seconds 总和
        const subGroupSeconds = group.sub_groups.reduce(
          (total, subGroup) => total + subGroup.seconds,
          0,
        )
        totalCount += subGroupSeconds

        // 构建每个 group 的格式
        const groupFormat = {
          projectName,
          tracked_seconds: subGroupSeconds,
          sub_groups: group.sub_groups,
        }

        acc.push(groupFormat)
        return acc
      }, [])
      .sort((a, b) => b.tracked_seconds - a.tracked_seconds)

    for (const item of projectList) {
      let projectName = item.projectName || ''

      output += `- ${projectName} ${formatTime(item.tracked_seconds)} \n`

      let arr = item.sub_groups

      arr.map(
        (obj, index) =>
          (output +=
            index === arr.length - 1
              ? `  ${index + 1}. ${obj.title || ''} ${formatTime(obj.seconds)} \n\n`
              : `  ${index + 1}. ${obj.title || ''} ${formatTime(obj.seconds)} \n`),
      )
    }
    output = `- 共 ${formatTime(totalCount)}\n\n` + output

    writeFile(output, {
      start_date,
      end_date,
      fileNamePrefix,
      fileNameSuffix: 'report',
    })
  } catch (error) {
    console.error(error)
  }
}

const main = async ({ startDate, endDate, naturalDays, workDays, fileNamePrefix }) => {
  start_date = startDate
  end_date = endDate
  projectInfo = await getProjectInfo()
  getSummary({ naturalDays, workDays, fileNamePrefix })
}
// main()

module.exports = main
