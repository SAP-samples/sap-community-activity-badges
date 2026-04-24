import { fileURLToPath } from 'url'
import { URL } from 'url'
import search from '@inquirer/search'
import fs from 'fs'
import path from 'path'
import excel from 'node-xlsx'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

function sleep(milliseconds) {
  const date = Date.now();
  // eslint-disable-next-line no-useless-assignment -- used in do-while condition
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

function walkDir(dir, depth, maxDepth) {
  if (depth > maxDepth) return []
  const results = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, depth + 1, maxDepth))
    } else {
      results.push(fullPath)
    }
  }
  return results
}

async function init() {
  try {
    const rootPath = path.resolve(__dirname, '../../devtoberfest-data')
    const allFiles = walkDir(rootPath, 0, 5)

    const filePath = await search({
      message: 'Select a Contest Excel File to import',
      source: (input) => {
        const term = (input || 'Devtoberfest').toLowerCase()
        return allFiles
          .filter(f => f.toLowerCase().includes(term))
          .map(f => ({ name: path.relative(rootPath, f), value: f }))
      }
    })

    const badges = JSON.parse(fs.readFileSync(path.join(__dirname, 'util/badges.json'), 'utf8'))
    const pointsLevels = JSON.parse(fs.readFileSync(path.join(__dirname, 'util/points.json'), 'utf8'))

    const workSheetsFromFile = excel.parse(filePath, { raw: false })
    await Promise.all(workSheetsFromFile[0].data.map(async (item) => {
      try {
        if (item[0] === `type`) {
          return
        }

        if (!item[0]) {
          return
        }

        if(item[8]){
          return
        }
        let scnId = item[6] //SCN Id
        scnId = scnId.replace("@", "")
        scnId = scnId.replace("https://people.sap.com/", "")
        scnId = scnId.replace("http://scn.sap.com/people/", "")
        scnId = scnId.replace("people.sap.com/", "")

        scnId = scnId.toLowerCase()

        const urlBadges = `https://people-api.services.sap.com/rs/badge/${scnId}?sort=timestamp,desc&size=1000`

        const response = await fetch(urlBadges)
        sleep(20)
        const scnItems = await response.json()

        let points = 0
        let trees = false
        for (let item of scnItems.content) {
          if(item.displayName === 'SAP TechEd in 2025 Registered Attendee' || item.displayName === 'SAP TechEd in 2025 Attendee - Bangalore'){
            trees = true
          }
          let badgeValue = badges.find(x => x.displayName == item.displayName)
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

        item[8] = points
        item[9] = level
        item[10] = trees
      } catch (error) {
       console.error(error)
      }
    }

    ))

    var MyDate = new Date()
    let currentMonth = ('0' + (MyDate.getMonth() + 1)).slice(-2)
    let currentDay = ('0' + MyDate.getDate()).slice(-2)
    const result = excel.build([{
      name: `Devtoberfest Results`,
      data: workSheetsFromFile[0].data
    }])
    fs.writeFileSync(`../../devtoberfest-data/devtoberfest-trees-${new Date().getFullYear()}-${currentMonth}-${currentDay}.xlsx`, result)

  } catch (error) {
    console.error(error)
  }
}
init()
