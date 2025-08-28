/* eslint - disable no - undef */
/*eslint-env es6 */
"use strict";
sap.ui.define([
    "tags/controller/BaseController",
    "sap/m/MessageBox",
    "sap/m/Panel",
    "sap/ui/layout/VerticalLayout",
    "sap/m/Link"
], function (BaseController, MessageBox, Panel, VerticalLayout, Link) {

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

            try {
                const res = await fetch(aUrl)
                if (!res.ok) throw new Error(res.statusText)
                const tags = await res.json()
                oController.endBusy(oController)
                let model = oController.getModel("tagsModel")

                const container = this.byId("mainPage")
                if (container?.removeAllContent) {
                    container.removeAllContent()
                } else if (container?.removeAllItems) {
                    container.removeAllItems()
                }

                Object.keys(tags || {}).forEach((groupName) => {
                    const items = tags[groupName] || []

                    const vBox = new VerticalLayout({
                        content: items.map((item) =>
                            new Link({
                                text: item.title,
                                href: item.link,
                                target: "_blank"
                            })
                        )
                    })

                    const panel = new Panel({
                        headerText: groupName,
                        expandable: true,
                        expanded: true,
                        content: [vBox]
                    })

                    if (container?.addContent) {
                        container.addContent(panel)
                    } else if (container?.addItem) {
                        container.addItem(panel)
                    } else {
                        // Fallback: if container is the view root, place directly
                        this.getView().addContent(panel)
                    }
                })
            } catch (e) {
                oController.onErrorCall(error, oController)
            }

        }

    })
}
)