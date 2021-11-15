
async function init() {
    try {
        
        let [pointsLevels, badges] = await Promise.all([
            require('./util/points.json'),
            require('./util/badges.json')
          ])

        const request = require('then-request')
        const urlBadges = `https://people-api.services.sap.com/rs/badge/debjit.singha?sort=timestamp,desc&size=1000`

        let itemsRes = await request('GET', urlBadges)
        const scnItems = JSON.parse(itemsRes.getBody())
        
        let points = 0
        for (let item of scnItems.content) {
          let badgeValue = badges.find(x => x.displayName == item.displayName)
          if (badgeValue) {
            points = points + badgeValue.points
            console.log(`${item.displayName};${badgeValue.points}` )
          }

        }
        console.log(points)

       
      } catch (error) {
        console.error(error)
      }
    }

    init()