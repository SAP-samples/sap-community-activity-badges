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

   // const inquirer = require('inquirer')
    inquirer.registerPrompt('fuzzypath', require('inquirer-fuzzy-path'))
    const answer = await inquirer.prompt([
      {
        type: 'fuzzypath',
        name: 'path',
        excludePath: nodePath => nodePath.startsWith('node_modules'),
        // excludePath :: (String) -> Bool
        // excludePath to exclude some paths from the file-system scan
        excludeFilter: nodePath => nodePath == '.',
        // excludeFilter :: (String) -> Bool
        // excludeFilter to exclude some paths from the final list, e.g. '.'
        itemType: 'file',
        // itemType :: 'any' | 'directory' | 'file'
        // specify the type of nodes to display
        // default value: 'any'
        // example: itemType: 'file' - hides directories from the item list
        rootPath: '../../devtoberfest-data',
        // rootPath :: String
        // Root search directory
        message: 'Select a Contest Excel File to import',
        default: 'Devtoberfest',
        suggestOnly: false,
        // suggestOnly :: Bool
        // Restrict prompt answer to available choices or use them as suggestions
        depthLimit: 5,
        // depthLimit :: integer >= 0
        // Limit the depth of sub-folders to scan
        // Defaults to infinite depth if undefined
      }
    ])

    let [pointsLevels, badges] = await Promise.all([
      require('./util/points.json'),
      require('./util/badges.json')
    ])

    // Parse a file
    const workSheetsFromFile = excel.parse(answer.path, { raw: false })
    await Promise.all(workSheetsFromFile[0].data.map(async (item) => {
      try {
        if (item[0] === `type`) {
   //       item[8] = 'Score'
   //       item[9] = 'Level'
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

        const request = require('then-request')
        const urlBadges = `https://people-api.services.sap.com/rs/badge/${scnId}?sort=timestamp,desc&size=1000`

        let itemsRes = await request('GET', urlBadges)
        sleep(20)
        const scnItems = JSON.parse(itemsRes.getBody())

        let points = 0
        let scavenger = 0
        let scavengerOut = false
        for (let item of scnItems.content) {
          let badgeValue = badges.find(x => x.displayName == item.displayName)
         // console.log(badgeValue)
          if (badgeValue) {
            if (badgeValue.Week == "Scavenger Hunt"){
              scavenger = scavenger + 1
            }
            points = points + badgeValue.points
          }
        }
        console.log(scavenger)
        if (scavenger >= 30){
          scavengerOut = true
          points = points + 500
        } 

        let level = 0
        for (const index in pointsLevels) {
          if (points >= pointsLevels[index].points) {
            level = pointsLevels[index].level
          }
        }
        console.log(`${scavenger}, ${points}`)
        item[8] = points
        item[9] = level
        item[10] = scavengerOut
      } catch (error) {
      //console.error(error)
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
    fs.writeFileSync(`../../devtoberfest-data/devtoberfest-scavenger-${new Date().getFullYear()}-${currentMonth}-${currentDay}.xlsx`, result)

  } catch (error) {
    console.error(error)
  }
}
init()