/* eslint-disable no-undef */
/*eslint-env es6 */
sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "sap/profile/model/models",
], function (UIComponent, Device, models) {
    "use strict"

    return UIComponent.extend("profile.Component", {


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

            const hash = window.location.hash || "";
            const q = hash.indexOf("?") >= 0 ? hash.slice(hash.indexOf("?") + 1) : "";
            const scnId = new URLSearchParams(q).get("scnId");


            let model = this.getModel("config")
            model.setData({ scnId: scnId })
        }


    })
})