# Toggl export tool 

toggl 的相关工具

1. `export_toggl_to_md.js` 导出 `markdown` 数据，会导出两种，一种是 timeEntries，按天分内容，只能导出近 90 天的数据，一种是 report，统计一段时间内的各个项目的汇总数据
2. `wakatime_to_toggl.js` 把 wakatime 的数据导入 Toggl，参考了项目 bokub/wakatime-to-toggl: 📩 Sync your WakaTime data in Toggl https://github.com/bokub/wakatime-to-toggl 
3.  `toggl_to_ics.js` 把 toggl 近 90 天的数据导出成 ics ，可以导入日历