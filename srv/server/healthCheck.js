'use strict'
module.exports = (app) => {

    const health = require('@cloudnative/health-connect')
    let healthcheck = new health.HealthChecker()

    const lagHealth = () => new Promise((resolve, _reject) => {
        let lag = require('event-loop-lag')(1000)
        if(lag() > 40){
          _reject(`Event Loop Lag Exceeded: ${lag()} milliseconds`) 
        }
        resolve()
    })
    let lagCheck = new health.LivenessCheck("Event Loop Lag Check", lagHealth)
    healthcheck.registerLivenessCheck(lagCheck)

    app.use('/live', health.LivenessEndpoint(healthcheck))
    app.use('/ready', health.ReadinessEndpoint(healthcheck))
    app.use('/health', health.HealthEndpoint(healthcheck))
    app.use('/healthcheck', health.HealthEndpoint(healthcheck))

}