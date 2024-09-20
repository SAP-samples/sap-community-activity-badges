import { fileURLToPath } from 'url'
import { URL } from 'url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { createRequire } from 'module'
// @ts-ignore
const require = createRequire(import.meta.url)
const excel = require("node-xlsx")
const fs = require("fs")
import inquirer from 'inquirer'

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

async function init() {
  try {

    let [pointsLevels, badges, members] = await Promise.all([
      require('./util/points.json'),
      require('./util/badges.json'),
      require('./util/members.json')
    ])
    const khoros = require("./util/khoros")

    try {
      async function forEachParallel(array, callback) {
        await Promise.all(array.map(callback))
      }

      await forEachParallel(members.data.items, async (item) =>  {
        console.log(`Processing ${item.login}`)
        let scnId = item.id //SCN Id
        let scnItems = await khoros.callUserAPI(scnId)
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
      })
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