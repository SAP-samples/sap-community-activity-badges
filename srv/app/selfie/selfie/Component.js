/* eslint-disable no-undef */
/*eslint-env es6 */
sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "sap/selfie/model/models"
], function (UIComponent, Device, models) {
    "use strict"

    return UIComponent.extend("selfie.Component", {


        metadata: {
            manifest: "json"
        },

        init: function () {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments)

            // enable routing
            this.getRouter().initialize()

            // set the device model
            this.setModel(models.createDeviceModel(), "device")
        }


    })
})