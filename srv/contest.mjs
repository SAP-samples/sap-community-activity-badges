import { createRequire } from 'module'
// @ts-ignore
const require = createRequire(import.meta.url)
const fs = require("fs")

async function init() {
  try {

    let [pointsLevels, badges, members] = await Promise.all([
      require('./util/points.json'),
      require('./util/badges.json'),
      require('./util/members.json')
    ])
    const khoros = require("./util/khoros")

    try {
        for (let item of members.data.items) {
        console.log(`Processing ${item.login}`)
        let scnId = item.id //SCN Id
        var scnItems
        try {
          scnItems = await khoros.callUserAPI(scnId)
        } catch (error) {
          console.error(`Error fetching SCN data for ${item.login}:`, error)
          continue
        }
        let points = 0
        for (let item of scnItems.data.user_badges.items) {
          let badgeValue = badges.find(x => x.displayName == item.badge.title)
          if (badgeValue) {
            points = points + badgeValue.points
          }
        }

        let level = 0
        for (const index in pointsLevels) {
          if (points >= pointsLevels[index].points) {
            level = pointsLevels[index].level
          }
        }

        item.points = points
        item.level = level
      }
    } catch (error) {
      console.error(error)
    }

    var MyDate = new Date()
    let currentMonth = ('0' + (MyDate.getMonth() + 1)).slice(-2)
    let currentDay = ('0' + MyDate.getDate()).slice(-2)
    const result = JSON.stringify(members.data.items, null, 2)
    fs.writeFileSync(`../../devtoberfest-data/devtoberfest-${new Date().getFullYear()}-${currentMonth}-${currentDay}.json`, result)

  } catch (error) {
    console.error(error)
  }
}
init()