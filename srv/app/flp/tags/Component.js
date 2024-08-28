/* eslint-disable no-undef */
/*eslint-env es6 */
sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "sap/tags/model/models",
    "sap/base/util/UriParameters"
], function (UIComponent, Device, models, UriParameters) {
    "use strict"

    return UIComponent.extend("tags.Component", {


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