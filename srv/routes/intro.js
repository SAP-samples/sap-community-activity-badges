const fs = require('fs').promises
const path = require('path')
const express = require('express')

module.exports = (app) => {
    app.use('/images', express.static(path.join(__dirname, '../images')))
    app.use('/images/devtoberfest/css/font.css', async (req, res) =>{
        const svg = require("../util/svgRender")
        res.type('text/css').status(200).send(await svg.svgDevtoberfestFont())
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