import { fileURLToPath } from 'url'
import { URL } from 'url'
import search from '@inquirer/search'
import fs from 'fs'
import path from 'path'
import excel from 'node-xlsx'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const khoros = require('./util/khoros.js')

const __dirname = fileURLToPath(new URL('.', import.meta.url))

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

        // The legacy people-api.services.sap.com/rs/badge/<scnId> endpoint
        // returned HTTP 410 Gone (verified 2026-06-02). Source the same
        // {displayName, timestamp} pairs from Khoros via callUserAPI, which
        // returns user_badges.items[].badge.title (= displayName) and
        // .earned_date (= timestamp). callUserAPI handles dot/underscore
        // login normalization internally, so no extra preprocessing here.
        let scnItems
        try {
          scnItems = await khoros.callUserAPI(scnId)
        } catch (error) {
          console.error(`Error fetching SCN data for ${scnId}:`, error.message)
          return
        }
        const userBadges = (scnItems?.data?.user_badges?.items || []).map(b => ({
          displayName: b?.badge?.title,
          timestamp: b?.earned_date
        }))

        let points = 0
        let trees = false
        for (let item of userBadges) {
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
