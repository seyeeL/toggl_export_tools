const axios = require('axios')
const ora = require('ora')
const { headers, workspace_id } = require('./default.config.js')
const instance = axios.create({
  baseURL: 'https://api.track.toggl.com/api/v9/',
  headers,
})

module.exports = {
  // 获取信息
  getInfo: async function (apiKey) {
    const spinner = ora(`Fetching Toggl projects...`).start()

    return instance
      .get('me', {
        params: {
          with_related_data: true,
        },
      })

      .then(resp => resp.data)
      .catch(err => {
        if (err.response) {
          console.error(err.response.data)
        }
        spinner.fail('Cannot fetch Toggl projects')
        throw new Error(`cannot fetch Toggl projects: ${err}`)
      })
  },
  // 创建项目
  createProject: async function (name, workspaceId) {
    const spinner = ora(`Creating project "${name}" in Toggl...`)
    return instance
      .post(`workspaces/${workspaceId}/projects`, {
        name: name,
      })
      .then(resp => {
        spinner.succeed(`Created project "${resp.data.name}" in Toggl.`)
        return resp.data
      })
      .catch(err => {
        if (err.response) {
          console.error(err.response.data)
        }
        spinner.fail(`Cannot create Toggl project "${name}"`)
        throw new Error(`cannot create Toggl project ${name}: ${err}`)
      })
  },
  // 添加事件
  addEntry: async function ({ projectId, workspaceId, start, duration, description }) {
    return instance
      .post(`workspaces/${workspaceId}/time_entries`, {
        description,
        duration: duration,
        start: start,
        pid: projectId,
        created_with: 'wakatime-to-toggl',
        wid: workspaceId,
      })
      .then(resp => resp.data)
      .catch(err => {
        if (err.response) {
          console.error(err.response.data)
        }
        throw new Error(`cannot create Toggl entry : ${err}`)
      })
  },
  // 获取项目
  getProjectInfo: async () => {
    let projectInfo = {}
    try {
      const response = await instance.get(`workspaces/${workspace_id}/projects`)
      projectInfo = response.data.reduce((obj, { name, id }) => {
        obj[id] = name
        return obj
      }, {})

      // console.log(projectInfo)
    } catch (error) {
      console.error(error)
    }
    return projectInfo
  },
  // 获取事件
  fetchTimeEntries: async function ({ start_date, end_date }) {
    return instance
      .get('me/time_entries', {
        params: {
          start_date,
          end_date,
        },
      })
      .then(resp => {
        return resp.data
      })
      .catch(err => {
        if (err.response) {
          console.error(err.response.data)
        }
        throw new Error(`cannot create Toggl entry : ${err}`)
      })
  },
}
