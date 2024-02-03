const fs = require('fs')
const path = require('path')
const moment = require('moment')

const { outputFilePath } = require('./default.config')

let weekNumber
// 将内容写入文件
const writeFile = (output, { start_date, end_date, fileNamePrefix, fileNameSuffix }) => {
  weekNumber = moment(start_date, 'YYYY-MM-DD').isoWeek()

  let outputName = getFileName({ start_date, end_date, fileNamePrefix, fileNameSuffix })
  // console.log(`start_date111 ${start_date}`, outputName)

  const outputFullName = path.join(outputFilePath, outputName)
  if (!fs.existsSync(outputFilePath)) {
    fs.mkdirSync(outputFilePath, { recursive: true })
  }

  try {
    fs.writeFileSync(outputFullName, output)
    console.log(`结果已成功写入文件 ${outputFullName}`)
  } catch (err) {
    console.error('无法将结果写入文件：', err)
  }
}

function getFileName({ start_date, end_date, fileNamePrefix, fileNameSuffix }) {
  if (fileNameSuffix === 'projectInfo') {
    return 'projectInfo.json'
  }

  switch (fileNamePrefix) {
    case 'weekly':
      return `${fileNamePrefix}_${start_date.slice(0, 4)}_W${weekNumber}_${fileNameSuffix}.md`
    case 'monthly':
      return `${fileNamePrefix}_${start_date.replace(/-/g, '').slice(0, 6)}_${fileNameSuffix}.md`
    default:
      return start_date === end_date
        ? `${start_date.replace(/-/g, '')}_${fileNamePrefix}.md`
        : `${fileNamePrefix}_${start_date.replace(/-/g, '')}_${end_date.replace(
            /-/g,
            '',
          )}_${fileNameSuffix}.md`
  }
}

module.exports = {
  writeFile,
}
