const fs = require('fs').promises
const path = require('path')
const express = require('express')

module.exports = (app) => {
    
    app.use('/images', express.static(path.join(__dirname, '../images')))
    app.use('/images/devtoberfest/css/font.css', async (req, res) => {
        const svg = require("../util/svgRender")
        res.type('text/css').status(200).send(await svg.svgDevtoberfestFont())
    })

    app.use('/flp', express.static(path.join(__dirname, '../app/flp')))
    app.get('/selfie/', async (req, res) => {
        return res.redirect("/flp/#selfie-ui")
    })
    // New Vue SPA — served from the built dist directory
    const profileDist = path.join(__dirname, '../app/profile-vue/dist')
    app.use('/profile', express.static(profileDist))
    app.get(/^\/profile(\/.*)?$/, (req, res) => {
        const indexHtml = path.join(profileDist, 'index.html')
        res.sendFile(indexHtml, { dotfiles: 'allow' }, (error) => {
            if (error) {
                app.logger.error(error)
                if (!res.headersSent) {
                    res.status(500).send(error.toString())
                }
            }
        })
    })
    app.use('/i18n', express.static(path.join(__dirname, '../_i18n')))
    app.use('/favicon.ico', express.static(path.join(__dirname, '../app/favicon.ico')))
    app.get('/appconfig/fioriSandboxConfig.json', async (req, res) => {
        try {
            let jsonData = require('../app/appconfig/fioriSandboxConfig.json')
            res.type("application/json").status(200).send(jsonData)           
        } catch (error) {
            app.logger.error(error)
            res.status(500).send(error.toString())
        }
    })  

    app.get('/', async (req, res) => {

        try {
            let mdReadMe = await fs.readFile(path.resolve(__dirname, "../doc/README.md"), "utf-8")
            const { marked } = require('marked')
            let content = marked.parse(mdReadMe)
            let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAP Community Cards</title>
    <link rel="icon" href="/favicon.ico">
    <link rel="stylesheet" href="https://unpkg.com/@sap-theming/theming-base-content/content/Base/baseLib/sap_horizon/css_variables.css">
    <link rel="stylesheet" href="https://unpkg.com/fundamental-styles@0.41.4/dist/theming/sap_horizon.css">
    <link rel="stylesheet" media="(prefers-color-scheme: dark)" href="https://unpkg.com/@sap-theming/theming-base-content/content/Base/baseLib/sap_horizon_dark/css_variables.css">
    <link rel="stylesheet" media="(prefers-color-scheme: dark)" href="https://unpkg.com/fundamental-styles@0.41.4/dist/theming/sap_horizon_dark.css">
    <style>
        body {
            font-family: var(--sapFontFamily);
            font-size: var(--sapFontSize);
            color: var(--sapTextColor);
            background-color: var(--sapBackgroundColor);
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }
        .page-shell {
            max-width: 960px;
            margin: 0 auto;
            padding: 2rem;
        }
        .page-content {
            background: var(--sapGroup_ContentBackground);
            border: 1px solid var(--sapGroup_ContentBorderColor);
            border-radius: 0.75rem;
            padding: 2rem 2.5rem;
            box-shadow: var(--sapContent_Shadow0);
        }
        h1 {
            font-family: var(--sapFontHeaderFamily);
            font-size: 2rem;
            font-weight: 600;
            color: var(--sapGroup_TitleTextColor);
            border-bottom: 2px solid var(--sapGroup_TitleBorderColor);
            padding-bottom: 0.5rem;
            margin-top: 0;
        }
        h2 {
            font-family: var(--sapFontHeaderFamily);
            font-size: 1.375rem;
            font-weight: 600;
            color: var(--sapGroup_TitleTextColor);
            margin-top: 2rem;
            border-bottom: 1px solid var(--sapGroup_TitleBorderColor);
            padding-bottom: 0.375rem;
        }
        a {
            color: var(--sapLinkColor);
            text-decoration: none;
        }
        a:hover {
            color: var(--sapLink_Hover_Color);
            text-decoration: underline;
        }
        a:visited {
            color: var(--sapLink_Visited_Color);
        }
        img {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
            margin: 0.75rem 0;
        }
        code {
            font-family: var(--sapFontMonoFamily, monospace);
            background: var(--sapField_Background);
            border: 1px solid var(--sapField_BorderColor);
            border-radius: 0.25rem;
            padding: 0.125rem 0.375rem;
            font-size: 0.875em;
        }
        pre {
            background: var(--sapField_Background);
            border: 1px solid var(--sapField_BorderColor);
            border-radius: 0.5rem;
            padding: 1rem;
            overflow-x: auto;
        }
        pre code {
            background: none;
            border: none;
            padding: 0;
        }
        p {
            margin: 0.75rem 0;
        }
        ul, ol {
            padding-left: 1.5rem;
        }
        li {
            margin: 0.375rem 0;
        }
    </style>
</head>
<body>
    <div class="page-shell">
        <div class="page-content">
            ${content}
        </div>
    </div>
</body>
</html>`
            res.type("text/html").status(200).send(html)
        } catch (error) {
            app.logger.error(error)
            res.status(500).send(error.toString())
        }

    })
}