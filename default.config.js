const email = ''  // toggl账号
const password = '' // toggl密码
const workspace_id = ''  // toggl workspace_id
const wakatimeToken = ''

module.exports = {
  email,
  password,
  workspace_id,
  wakatimeToken,
  outputFilePath: '我的toggl数据/', // 替换为输出文件的路径
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Basic ${Buffer.from(email + ':' + password).toString('base64')}`,
  },
}
