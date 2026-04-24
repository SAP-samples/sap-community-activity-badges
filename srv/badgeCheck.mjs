import { createRequire } from 'module'
// @ts-ignore
const require = createRequire(import.meta.url)

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

    let [scnItems, , badges] = await Promise.all([
      khoros.callUserAPI(scnId),
      require('./util/points.json'),
      require('./util/badges.json')
    ])

    try {

      for (let item of badges){
        let badgeValue =  scnItems.data.user_badges.items.find(x => x.badge.title == item.displayName)
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