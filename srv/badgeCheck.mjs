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
    let [pointsLevels, badges] = await Promise.all([
      require('./util/points.json'),
      require('./util/badges.json')
    ])

      try {


        let scnId = 'thomas.jung' //SCN Id
        if (process.argv.length >= 3) {
          scnId = process.argv[2]
          console.log(scnId)
        }
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


        for (let item of badges){
          let badgeValue = scnItems.content.find(x => x.displayName == item.displayName)
          if(!badgeValue){
            console.log(`${item.displayName};${item.points}\n\t${item.URL}\n`)
          }
        }
/*         let points = 0
        for (let item of scnItems.content) {
          let badgeValue = badges.find(x => x.displayName == item.displayName)
          if (badgeValue) {
            points = points + badgeValue.points
            item.points = badgeValue.points
          }else {
            item.points = 0
          }
          console.log(`${item.displayName};${item.points}`)
        }

        let level = 0
        for (const index in pointsLevels) {
          if (points >= pointsLevels[index].points) {
            level = pointsLevels[index].level
          }
        } */
 
        //console.table(scnItems.content)
      } catch (error) {
       console.error(error)
      }
    

/* 
     var MyDate = new Date()
    let currentMonth = ('0' + (MyDate.getMonth() + 1)).slice(-2)
    let currentDay = ('0' + MyDate.getDate()).slice(-2)
    const result = excel.build([{
      name: `badgeCheck Results`,
      data: workSheetsFromFile[0].data
    }])
    fs.writeFileSync(`../../devtoberfest-data/devtoberfest-${new Date().getFullYear()}-${currentMonth}-${currentDay}.xlsx`, result) */

  } catch (error) {
    console.error(error)
  }
}
init()