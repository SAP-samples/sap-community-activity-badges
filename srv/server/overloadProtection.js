'use strict'
module.exports = (app) => {
    const protectCfg = {
        production: process.env.NODE_ENV === 'production', // if production is false, detailed error messages are exposed to the client
        clientRetrySecs: 1, // Client-Retry header, in seconds (0 to disable) [default 1]
        sampleInterval: 5, // sample rate, milliseconds [default 5]
        maxEventLoopDelay: 100, // maximum detected delay between event loop ticks [default 42]
        maxHeapUsedBytes: 0, // maximum heap used threshold (0 to disable) [default 0]
        maxRssBytes: 0, // maximum rss size threshold (0 to disable) [default 0]
        errorPropagationMode: false, // dictate behavior: take over the response
        logging: (message)=>{
            app.logger.error(message)
        }
        // or propagate an error to the framework [default false]
    }
    const protect = require('overload-protection')('express', protectCfg)

    /**
     * Skip overload-protection for static-asset routes (Vue SPA chunks, FLP
     * SAPUI5 assets, images, favicons). A cold-cache page load fires 30+
     * simultaneous static requests; serving them is cheap, but the burst
     * pushes the event loop past maxEventLoopDelay and the middleware sheds
     * subsequent requests as 503s — including the dynamically-imported UI5
     * chunks, which don't auto-retry. The result is a partially-broken UI
     * on first load.
     *
     * Keep the protection on dynamic routes (/khoros/*, /showcase*, etc.)
     * which actually do real work and benefit from shedding under load.
     */
    const STATIC_PATHS = /^\/(profile\/(assets|.*\.(?:js|css|svg|png|jpg|jpeg|ico|woff2?|ttf|map))|flp|images|favicon\.ico|i18n)/
    app.use((req, res, next) => {
        if (STATIC_PATHS.test(req.path)) return next()
        return protect(req, res, next)
    })
}
