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

                        let selBadges = []
                        for (let i = 0; i < 5; i++) {
                            selBadges.push({ badge: "", url: "" })
                        }

                        if (src !== "") {
                            const url = new URL(src)
                            let pathname = url.pathname.split('/')
                            for (let badgeIndex = 0; badgeIndex < 5; badgeIndex++) {
                                let pathIndex = badgeIndex + 3
                                if (pathname[pathIndex]) {
                                    selBadges[badgeIndex].badge = pathname[pathIndex]
                                }
                            }
                        }

                        if (data.data && data.data.user_badges) {
                            for (let index = 0; index < data.data.user_badges.items.length; index++) {
                                data.data.user_badges.items[index].selected = ''
                                data.data.user_badges.items[index].earned_date =
                                    new Date((typeof date === "string" ? new Date(data.data.user_badges.items[index].earned_date) : data.data.user_badges.items[index].earned_date)
                                    )

                                for (let i = 0; i < selBadges.length; i++) {
                                    if (selBadges[i].badge === data.data.user_badges.items[index].badge.id) {
                                        data.data.user_badges.items[index].selected = "true"
                                        selBadges[i].url = data.data.user_badges.items[index].badge.icon_url
                                        break
                                    }
                                }
                            }
                        }
                        data.selBadges = selBadges
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
                for (let i = 0; i < data.selBadges.length; i++) {
                    if (data.selBadges[i].badge !== "") signatureURL += `/${data.selBadges[i].badge}`
                }
                model.setProperty("/signatureURL", signatureURL)
                model.setProperty("/signatureBigURL", signatureURL.replace("showcaseBadgesGroups", "showcaseBadges"))
                let signatureFull = `<a href="${data.data.view_href}" target="_blank">` +
                    `<img src="https://devrel-tools-prod-scn-badges-srv.cfapps.eu10.hana.ondemand.com${signatureURL}" /></a>`
                model.setProperty("/signatureFull", signatureFull)
            },
            selectBadge: function (oEvent) {

                let sRow = oEvent.getSource().getBindingContext().getPath()
                let model = this.getModel("profileModel")
                let badges = model.getProperty("/data/user_badges/items")
                let selId = model.getProperty(sRow + "/badge/id")
                let selBadges = model.getProperty("/selBadges")

                if (oEvent.getParameters().selected) {
                    const isMatch = (element) => element.badge.id === selId
                    const isEmpty = (element) => element.badge === ""
                    let emptyIndex = selBadges.findIndex(isEmpty)
                    if (emptyIndex === -1) {
                        let oError = {}
                        oError.statusText = "You can only select five badges"
                        MessageBox.alert(oError.statusText)
                        badges[badges.findIndex(isMatch)].selected = ""
                    } else {
                        selBadges[emptyIndex].badge = selId
                        selBadges[emptyIndex].url = badges[badges.findIndex(isMatch)].badge.icon_url
                    }
                } else {
                    const isMatch = (element) => element.badge === selId
                    selBadges.splice(selBadges.findIndex(isMatch), 1)
                    selBadges.push({ badge: "", url: "" })
                }
                model.setProperty("/selBadges", selBadges)
                model.setProperty("/data/user_badges/items", badges)
                this.buildSignature()
                return
               
            },
            onDropSelectedProductsTable: function(oEvent) {
                let oDraggedItem = oEvent.getParameter("draggedControl")
                let oDraggedItemContext = oDraggedItem.getBindingContext()
                if (!oDraggedItemContext) {
                    return
                }

                let oDroppedItem = oEvent.getParameter("droppedControl");

                if (oDroppedItem instanceof ColumnListItem) {
                    // get the dropped row data
                    var sDropPosition = oEvent.getParameter("dropPosition");
                    var oDroppedItemContext = oDroppedItem.getBindingContext();
                   // var iDroppedItemRank = oDroppedItemContext.getProperty("Rank");
                    var oDroppedTable = oDroppedItem.getParent();
                    var iDroppedItemIndex = oDroppedTable.indexOfItem(oDroppedItem);
    
                    // find the new index of the dragged row depending on the drop position
                    var iNewItemIndex = iDroppedItemIndex + (sDropPosition === "After" ? 1 : -1);
                    var oNewItem = oDroppedTable.getItems()[iNewItemIndex];
                    if (!oNewItem) {
                        // dropped before the first row or after the last row
                        iNewRank = oRanking[sDropPosition](iDroppedItemRank);
                    } else {
                        // dropped between first and the last row
                        var oNewItemContext = oNewItem.getBindingContext();
                        iNewRank = oRanking.Between(iDroppedItemRank, oNewItemContext.getProperty("Rank"));
                    }
                }

                this.buildSignature()
    
            }


        })
    }
)