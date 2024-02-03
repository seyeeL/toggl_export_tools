const wakaTime = require('./wakatime')
const toggl = require('./toggl')
const ora = require('ora')
const fs = require('fs')
const moment = require('moment')

async function main(flags) {
  // 调用 WakaTime 和 Toggl 的 API
  const wakaTimeActivity = await wakaTime.getActivity(flags.day, flags.minDuration)
  const togglInfo = await toggl.getInfo(flags.toggl)

  // console.log('wakaTimeActivity', wakaTimeActivity);
  // console.log('togglInfo', togglInfo);
  const jsonStr = JSON.stringify(togglInfo, null, 2)

  // 下载 toggl 数据
  const outputFilePath = 'togglInfo.json'

  try {
    fs.writeFileSync(outputFilePath, jsonStr)
    console.log(`结果已成功写入文件 ${outputFilePath}`)
  } catch (err) {
    console.error('无法将结果写入文件：', err)
  }

  // 列出所有 WakaTime 项目  ['MyObsidian']
  const wakaTimeProjects = Object.keys(
    wakaTimeActivity.reduce((acc, act) => {
      acc[act.project] = act
      return acc
    }, {}),
  )

  // 公司项目名称，用来把所有的公司相关的项目都写入指定项目
  const workProjects = new Map([['project_name', '示例项目名称，写入描述']])
  const workProjectId = 11111 // 修改成你的id

  // 某些 wakatime 识别的文件夹名，和我 toggl 的项目名称不一样，则写入指定的 项目id
  const blackList = new Map([['project_name', 1111]])

  // 找出尚未在 Toggl 中的项目，排除公司项目
  const projectsToCreate = wakaTimeProjects.filter(
    p =>
      !workProjects.has(p.toLowerCase()) &&
      !blackList.has(p.toLowerCase()) &&
      !togglInfo.projects.find(t => t.name.toLowerCase() === p.toLowerCase()),
  )

  // 如果有需要新建的项目，暂停，看一下具体放在哪个已有项目里，不打算建太多已有的项目
  if (projectsToCreate.length) {
    console.log('projectsToCreate', projectsToCreate)
    // return;
  }

  // 在 Toggl 中创建项目
  for (const project of projectsToCreate) {
    console.log('workspace_id', togglInfo.workspaces[0].id)

    const created = await toggl.createProject(project, togglInfo.workspaces[0].id, flags.toggl)
    togglInfo.projects.push(created)
    await sleep(1000) // 每秒钟发起一个请求，以避免达到请求限制
  }

  // 取所有 wakatime 里项目名称的 id 是多少
  const projectIds = togglInfo.projects.reduce((acc, p) => {
    acc[p.name.toLowerCase()] = p.id
    return acc
  }, {})

  // 将 WakaTime 条目添加到 Toggl
  let added = 0
  let duplicates = 0
  let projects = {}
  const spinner = ora('正在添加条目到 Toggl...').start()
  const entries = await toggl.fetchTimeEntries({
    start_date: flags.start_date,
    end_date: flags.end_date,
  })

  for (const entry of wakaTimeActivity) {
    let projectId
    let description
    if (workProjects.has(entry.project)) {
      projectId = workProjectId
      description = workProjects.get(entry.project)
    } else if (blackList.has(entry.project)) {
      projectId = blackList.get(entry.project)
    } else {
      projectId = projectIds[entry.project.toLowerCase()]
    }

    if (!projectId) {
      throw new Error(`在 Toggl 中找不到项目 "${entry.project}"`)
    }
    const start = new Date(Math.round(entry.time) * 1000).toISOString()
    const duration = Math.round(entry.duration)

    if (alreadyExists({ start, duration, entries })) {
      duplicates++
      spinner.text = `已添加 ${added}/${wakaTimeActivity.length} 个条目到 Toggl... 发现 ${duplicates} 个重复条目`
      continue
    }
    // 添加的请求
    await toggl.addEntry({
      projectId,
      workspaceId: togglInfo.workspaces[0].id,
      start,
      duration,
      description,
    })
    spinner.text = `已添加 ${added}/${wakaTimeActivity.length} 个条目到 Toggl...`
    if (duplicates > 0) {
      spinner.text += ` 发现 ${duplicates} 个重复条目`
    }
    projects[projectId] = true
    added++
    await sleep(1000) // 每秒钟发起一个请求，以避免达到请求限制
  }
  spinner.succeed(`已添加 ${added} 个时间条目到 ${Object.keys(projects).length} 个项目中。`)
  if (duplicates > 0) {
    ora(`有 ${duplicates} 个条目已经存在于 Toggl 中。`).info()
  }
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms))
}

function alreadyExists({ projectId, start, duration, entries }) {
  return Boolean(
    entries.find(
      entry => entry.start.substr(0, 19) === start.substr(0, 19) && entry.duration === duration,
      // entry.pid === projectId, // 原逻辑加了项目判断，我觉得没有必要
    ),
  )
}

main({
  start_date: moment(new Date()).subtract(1, 'days').format('YYYY-MM-DD'),
  end_date: moment(new Date()).add(1, 'days').format('YYYY-MM-DD'),
  day: 1,
  minDuration: 120,
})
