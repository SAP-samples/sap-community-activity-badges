/* eslint-disable no-undef */
/*eslint-env es6 */
"use strict";
sap.ui.define([
    "profile/controller/BaseController",
    "sap/m/MessageToast",
    "sap/ui/core/Core",
    "sap/m/Text",
    "sap/m/Link",
    "sap/ui/table/Column",
    "sap/m/MessageBox"
],
    function (BaseController, MessageToast, oCore, Text, Link, Column, MessageBox) {

        return BaseController.extend("profile.controller.App", {

            onInit: function () {
                let scnId = this.getModel("config").getProperty("/scnId")
                if (scnId) {
                    this.getModel("profileModel").setProperty("/scnId", scnId)
                    this.loadProfile()
                }
                let model = this.getModel("profileModel")
                this.getView().setModel(model)
            },

            loadProfile: async function () {
                this.startBusy()
                let aUrl = `/khoros/user/${this.getModel("profileModel").getProperty("/scnId")}`
                let oController = this
                jQuery.ajax({
                    url: aUrl,
                    method: "GET",
                    dataType: "json",
                    success: function (myJSON) {
                        oController.endBusy(oController)
                        let model = oController.getModel("profileModel")
                        let data = { scnId: model.getProperty("/scnId"), data: myJSON.data }
                        if (data.data && data.data.user_badges) {
                            for (let item of data.data.user_badges.items) {
                                item.selected = ''
                            }
                        }
                        for (let item of data.data.user_badges.items) {
                            item.selected = ''
                        }
                        model.setData(data)
                        oController.buildSignature()
                    },
                    error: function (error) {
                        oController.onErrorCall(error, oController)
                    }
                })
            },

            buildSignature: function () {
                let model = this.getModel("profileModel")
                let scnId = model.getProperty("/scnId")
                let data = model.getData()
                let signatureURL = `/showcaseBadgesGroups/${scnId}`
                if (data.badge1) signatureURL += `/${data.badge1}` 
                if (data.badge2) signatureURL += `/${data.badge2}` 
                if (data.badge3) signatureURL += `/${data.badge3}` 
                if (data.badge4) signatureURL += `/${data.badge4}` 
                if (data.badge5) signatureURL += `/${data.badge5}`                 
                model.setProperty("/signatureURL", signatureURL)
                let signatureFull = `<a href="${data.data.view_href}" target="_blank">` +
                `<img src="https://devrel-tools-prod-scn-badges-srv.cfapps.eu10.hana.ondemand.com${signatureURL}" /></a>`
                model.setProperty("/signatureFull", signatureFull)
            },

            selectBadge: function (oControl) {
                let model = this.getModel("profileModel")
                let badges = model.getProperty("/data/user_badges/items")

                let badge1 = ""
                let badge1URL = ""
                let badge2 = ""
                let badge2URL = ""
                let badge3 = ""
                let badge3URL = ""
                let badge4 = ""
                let badge4URL = ""
                let badge5 = ""
                let badge5URL = ""
                for (let badge of badges) {
                    if (badge.selected === "true") {
                        if (badge1 === "") {
                            badge1 = badge.badge.id
                            badge1URL = badge.badge.icon_url
                        } else if (badge2 === "") {
                            badge2 = badge.badge.id
                            badge2URL = badge.badge.icon_url
                        } else if (badge3 === "") {
                            badge3 = badge.badge.id
                            badge3URL = badge.badge.icon_url
                        } else if (badge4 === "") {
                            badge4 = badge.badge.id
                            badge4URL = badge.badge.icon_url
                        } else if (badge5 === "") {
                            badge5 = badge.badge.id
                            badge5URL = badge.badge.icon_url
                        } else {
                            let oError = {}
                            oError.statusText = "You can only select five badges"
                            MessageBox.alert(oError.statusText)
                            badge.selected = ""
                        }
                    }
                }

                model.setProperty("/data/user_badges/items", badges)
                model.setProperty("/badge1", badge1)
                model.setProperty("/badge1URL", badge1URL)
                model.setProperty("/badge2", badge2)
                model.setProperty("/badge2URL", badge2URL)
                model.setProperty("/badge3", badge3)
                model.setProperty("/badge3URL", badge3URL)
                model.setProperty("/badge4", badge4)
                model.setProperty("/badge4URL", badge4URL)
                model.setProperty("/badge5", badge5)
                model.setProperty("/badge5URL", badge5URL)

                this.buildSignature()
            }


        })
    }
)