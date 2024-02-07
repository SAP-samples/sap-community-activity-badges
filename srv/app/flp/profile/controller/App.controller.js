/* eslint-disable no-undef */
/*eslint-env es6 */
"use strict";
sap.ui.define([
    "profile/controller/BaseController",
    "sap/m/MessageBox",
    "sap/m/ColumnListItem",
    "./Utils"
],
    function (BaseController, MessageBox, ColumnListItem, Utils) {

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
                        oError.statusText = this.getModel("i18n").getResourceBundle().getText("profile.limitErr") //"You can only select five badges"
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

            onDropSelectedBadgesTable: function (oEvent) {
                let draggedItem = oEvent.getParameter("draggedControl")
                let draggedItemContext = draggedItem.getBindingContext()
                if (!draggedItemContext) {
                    return
                }
                let droppedItem = oEvent.getParameter("droppedControl")
                if (droppedItem instanceof ColumnListItem && draggedItem instanceof ColumnListItem) {
                    // get the dropped row data
                    let droppedTable = droppedItem.getParent()
        
                    let draggedItemIndex = droppedTable.indexOfItem(draggedItem)
                    let droppedItemIndex = droppedTable.indexOfItem(droppedItem)
  
                    let model = droppedTable.getModel()
                    let selBadges = model.getProperty("/selBadges")
          
                    
                    selBadges.splice(droppedItemIndex, 0, selBadges.splice(draggedItemIndex, 1)[0])
                    model.setProperty("/selBadges", selBadges)
                    droppedTable.getItems()[droppedItemIndex].setSelected(true).focus()
                    this.buildSignature()                    
                }                
            },

            moveSelectedItem: function (direction, controller) {
                let selBadgesTable = Utils.getSelBadgesTable(this)
                Utils.getSelectedItemContext(selBadgesTable, function (selectedItemContext, selectedItemIndex) {
                    let siblingItemIndex = selectedItemIndex + (direction === "Up" ? -1 : 1)
                    let siblingItem = selBadgesTable.getItems()[siblingItemIndex]
                    if (!siblingItem) {
                        return
                    }
                    let siblingItemContext = siblingItem.getBindingContext()
                    if (!siblingItemContext) {
                        return
                    }

                    // swap the selected and the siblings rank
                    let model = selBadgesTable.getModel()
                    let siblingItemBadge = siblingItemContext.getProperty("badge")
                    let siblingItemUrl = siblingItemContext.getProperty("url")
                    let selectedItemBadge = selectedItemContext.getProperty("badge")
                    let selectedItemUrl = selectedItemContext.getProperty("url")

                    model.setProperty("badge", siblingItemBadge, selectedItemContext)
                    model.setProperty("badge", selectedItemBadge, siblingItemContext)
                    model.setProperty("url", siblingItemUrl, selectedItemContext)
                    model.setProperty("url", selectedItemUrl, siblingItemContext)
                    // after move select the sibling
                    selBadgesTable.getItems()[siblingItemIndex].setSelected(true).focus()
                    controller.buildSignature()
                })
            },

            moveUp: function (oEvent) {
                this.moveSelectedItem("Up", this)
                oEvent.getSource().focus()
            },

            moveDown: function (oEvent) {
                this.moveSelectedItem("Down", this)
                oEvent.getSource().focus()
            },

            onBeforeOpenContextMenu: function (oEvent) {
                oEvent.getParameters().listItem.setSelected(true)
            }


        })
    }
)