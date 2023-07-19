/* eslint-disable no-console */
// @ts-check

//Catch uncaught errors
//@ts-ignore
process.on('uncaughtException', function (err) {
    console.error(err.name + ': ' + err.message, err.stack.replace(/.*\n/, '\n')) // eslint-disable-line
})

// @ts-ignore
const express = require('express')
const path = require('path')
const upath = require('upath')
// @ts-ignore
const favicon = require('serve-favicon')
const fileExists = require('fs').existsSync
const { glob } = require('glob')

function ExpressServer() {
    //Default port
    this.port = process.env.PORT || 4000
    this.baseDir = process.cwd()
    this.routes = []

    let app
    let httpServer
    app = express()
    app.express = express
    this.app = app

    this.app.use(favicon(path.join(__dirname, 'images', 'favicon.ico')))

    this.start = async function () {
        // @ts-ignore
        app.baseDir = this.baseDir

        //Load express.js
        let expressFile = path.join(app.baseDir, 'server/express.js')
        if (fileExists(expressFile)) {
            await require(expressFile)(app)
        }

        //Load routes
        // @ts-ignore
        let routesDir = path.join(this.baseDir, 'routes/**/*.js')
        let files = await glob(upath.normalize(routesDir))
        console.log(routesDir)
        this.routerFiles = files
        if (files.length !== 0) {
            for (let file of files) {
                await require(file)(app)
            }
        }

        // @ts-ignore
        httpServer = app.listen(this.port)
        // @ts-ignore
        console.log(`Express Server Now Running On http://localhost:${this.port}/`)
    }

    this.stop = async function () {
        httpServer.close()
    }
}
module.exports = ExpressServer