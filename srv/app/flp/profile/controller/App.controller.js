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

                        data.signatureFull = data.data.signature
                        const parser = new DOMParser()
                        const htmlDoc = parser.parseFromString(data.signatureFull, 'text/html')
                        const htmlElms = htmlDoc.getElementsByTagName('img')
                        let src = ""
                        for (const htmlElm of htmlElms) {
                            src = htmlElm.getAttribute('src')
                        }

                        data.badge1 = ""
                        data.badge1URL = ""
                        data.badge2 = ""
                        data.badge2URL = ""
                        data.badge3 = ""
                        data.badge3URL = ""
                        data.badge4 = ""
                        data.badge4URL = ""
                        data.badge5 = ""
                        data.badge5URL = ""
                        if (src !== ""){
                            const url = new URL(src)
                            let pathname = url.pathname.split('/')
                            if(pathname[3]){
                                data.badge1 = pathname[3]
                            }
                            if(pathname[4]){
                                data.badge2 = pathname[4]
                            }
                            if(pathname[5]){
                                data.badge3 = pathname[5]
                            }
                            if(pathname[6]){
                                data.badge4 = pathname[6]
                            }
                            if(pathname[7]){
                                data.badge5 = pathname[7]
                            }
                        }
                        if (data.data && data.data.user_badges) {
                            for (let index = 0; index < data.data.user_badges.items.length; index++) {
                                data.data.user_badges.items[index].selected = ''
                                data.data.user_badges.items[index].earned_date =
                                  new Date((typeof date === "string" ? new Date(data.data.user_badges.items[index].earned_date) : data.data.user_badges.items[index].earned_date) 
                                )

                                if(data.badge1 === data.data.user_badges.items[index].badge.id){
                                    data.data.user_badges.items[index].selected = "true"
                                    data.badge1URL = data.data.user_badges.items[index].badge.icon_url
                                }
                                if(data.badge2 === data.data.user_badges.items[index].badge.id){
                                    data.data.user_badges.items[index].selected = "true"
                                    data.badge2URL = data.data.user_badges.items[index].badge.icon_url
                                }
                                if(data.badge3 === data.data.user_badges.items[index].badge.id){
                                    data.data.user_badges.items[index].selected = "true"
                                    data.badge3URL = data.data.user_badges.items[index].badge.icon_url
                                }
                                if(data.badge4 === data.data.user_badges.items[index].badge.id){
                                    data.data.user_badges.items[index].selected = "true"
                                    data.badge4URL = data.data.user_badges.items[index].badge.icon_url
                                }
                                if(data.badge5 === data.data.user_badges.items[index].badge.id){
                                    data.data.user_badges.items[index].selected = "true"
                                    data.badge5URL = data.data.user_badges.items[index].badge.icon_url
                                }
                            }
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
                model.setProperty("/signatureBigURL", signatureURL.replace("showcaseBadgesGroups", "showcaseBadges"))
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