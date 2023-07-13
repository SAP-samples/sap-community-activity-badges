'use strict'
const swaggerJSDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

module.exports = (app) => {
    const swaggerDefinition = {
        openapi: '3.0.0',
        info: {
            title: 'Express API for SAP Community Activity Badges',
            version: '3.0.6',

        },
        contact: {
            name: 'SAP Developer Advocates',
            url: 'https://developers.sap.com/developer-advocates.html',
        },
        servers: [
            {
                url: 'http://localhost:4000',
                description: 'Development server',
            },
            {
                url: 'https://devrel-tools-prod-scn-badges-srv.cfapps.eu10.hana.ondemand.com/',
                description: 'Production server',
            }
        ]
    }

    const options = {
        swaggerDefinition,
        // Paths to files containing OpenAPI definitions
        apis: ['./routes/*.js'],
    }
    const swaggerSpec = swaggerJSDoc(options)

    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}