const fs = require('fs').promises
const path = require('path')
const express = require('express')

module.exports = (app) => {
    
    app.use('/images', express.static(path.join(__dirname, '../images')))
    app.use('/images/devtoberfest/css/font.css', async (req, res) => {
        const svg = require("../util/svgRender")
        res.type('text/css').status(200).send(await svg.svgDevtoberfestFont())
    })

    app.use('/selfie', express.static(path.join(__dirname, '../app/selfie')))
    app.get('/selfie/', async (req, res) => {
        return res.redirect("/selfie/#selfie-ui")
    })
    app.use('/i18n', express.static(path.join(__dirname, '../_i18n')))
    app.use('/favicon.ico', express.static(path.join(__dirname, '../app/favicon.ico')))
    app.get('/appconfig/fioriSandboxConfig.json', async (req, res) => {
        try {
            let jsonData = require('../app/appconfig/fioriSandboxConfig.json')
            res.type("application/json").status(200).send(jsonData)           
        } catch (error) {
            base.error(error)
            res.status(500).send(error.toString())
        }
    }) 

    app.get('/', async (req, res) => {

        try {
            let mdReadMe = await fs.readFile(path.resolve(__dirname, "../doc/README.md"), "utf-8")
            const showdown = require('showdown')
            const converter = new showdown.Converter()
            let html = converter.makeHtml(mdReadMe)
            res.type("text/html").status(200).send(html)
        } catch (error) {
            app.logger.error(error)
            res.status(500).send(error.toString())
        }

    })
}