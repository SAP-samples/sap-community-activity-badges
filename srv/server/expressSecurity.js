'use strict'
module.exports = (app) => {

    //Only needed if service requires authentication and this one won't
      /* 
    const passport = require("passport")
    const xssec = require("@sap/xssec")
    const xsenv = require("@sap/xsenv")

     passport.use("JWT", new xssec.JWTStrategy(xsenv.getServices({
           uaa: {
               tag: "xsuaa"
           }
       }).uaa))
       app.use(passport.initialize()) 
       app.use(
           passport.authenticate("JWT", {
               session: false
           })
       ) */
}