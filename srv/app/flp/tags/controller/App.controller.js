/* eslint-disable no-undef */
/*eslint-env es6 */
"use strict";
sap.ui.define([
    "tags/controller/BaseController",
    "sap/m/MessageBox",
    "sap/m/ColumnListItem",
    "./Utils"
],
    function (BaseController, MessageBox, ColumnListItem, Utils) {

        return BaseController.extend("tags.controller.App", {

            onInit: function () {
                this.loadTags()
                let model = this.getModel("tagsModel")
                this.getView().setModel(model)
            },

            loadTags: async function () {
                this.startBusy()
                let aUrl = `/khoros/tags`
                let oController = this
                jQuery.ajax({
                    url: aUrl,
                    method: "GET",
                    dataType: "json",
                    success: function (tags) {
                        oController.endBusy(oController)
                        let model = oController.getModel("tagsModel")
                        let page = new sap.m.Page({
                            title: "Dynamic Panels from JSON",
                            content: []
                        })
                        Object.keys(tags).forEach((groupName) => {
                            let vBox = new sap.ui.layout.VerticalLayout({
                                content: tags[groupName].map((item) => {
                                    return new sap.m.Link({ text: item.title, href: item.link})
                                })
                            })
                            let panel = new sap.m.Panel({
                                headerText: groupName,
                                expandable: true,
                                expanded: true,
                                content: [vBox]
                            })
                            oController.getView().byId("mainPage").addContent(panel)
                        })

                    },
                    error: function (error) {
                        oController.onErrorCall(error, oController)
                    }
                })
            }

        })
    }
)