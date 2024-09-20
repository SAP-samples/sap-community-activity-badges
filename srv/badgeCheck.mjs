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
    const khoros = require("./util/khoros")
    let scnId = '139' //SCN Id
    if (process.argv.length >= 3) {
      scnId = process.argv[2]
      console.log(scnId)
    }

    scnId = scnId.replace("@", "")
    scnId = scnId.replace("https://people.sap.com/", "")
    scnId = scnId.replace("http://scn.sap.com/people/", "")
    scnId = scnId.replace("people.sap.com/", "")

    scnId = scnId.toLowerCase()

    let [scnItems, pointsLevels, badges] = await Promise.all([
      khoros.callUserAPI(scnId),
      require('./util/points.json'),
      require('./util/badges.json')
    ])

    try {

      for (let item of badges){
        let badgeValue = scnItems.data.user_badges.items.find(x => x.badge.title == item.displayName)
        if(!badgeValue){
          console.log(`${item.displayName};${item.points}\n\t${item.URL}\n`)
        }
      }
     
    
    } catch (error) {
      console.error(error)
    }   

  } catch (error) {
    console.error(error)
  }
}
init()