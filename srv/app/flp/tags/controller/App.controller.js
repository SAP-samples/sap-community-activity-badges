/* eslint-disable no-undef */
/*eslint-env es6 */
"use strict";
sap.ui.define([
    "tags/controller/BaseController",
    "sap/m/MessageBox",
    "sap/m/ColumnListItem",
    "./Utils",
    "sap/ui/thirdparty/jquery"
],
    function (BaseController, MessageBox, ColumnListItem, Utils, jQuery) {

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

/*                 try {
        const res = await fetch("/api/thing");
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        this.getView().setModel(new JSONModel(data), "api");
      } catch (e) {
        // handle error
      } */

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