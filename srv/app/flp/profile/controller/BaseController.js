/*global history */
/* eslint-disable no-undef */
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/core/Fragment",
    "sap/ui/core/syncStyleClass",
], function (Controller, History, Fragment, syncStyleClass) {
    "use strict";

    return Controller.extend("profile.controller.BaseController", {
        /**
         * Convenience method for accessing the router in every controller of the application.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        },

        /**
         * Convenience method for getting the view model by name in every controller of the application.
         * @public
         * @param {string} sName the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

        /**
         * Convenience method for setting the view model in every controller of the application.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        /**
         * Convenience method for getting the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        /**
         * Event handler for navigating back.
         * It there is a history entry we go one step back in the browser history
         * If not, it will replace the current entry of the browser history with the master route.
         * @public
         */
        onNavBack: function () {
            var sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                history.go(-1);
            } else {
                this.getRouter().navTo("master", {}, true)
            }
        },


        openUrl: function (url, newTab) {
            // Require the URLHelper and open the URL in a new window or tab (same as _blank):
            sap.ui.require(["sap/m/library"], ({ URLHelper }) => URLHelper.redirect(url, newTab));
        },


        startBusy: function () {
            if (!this._pBusyDialog) {
                this._pBusyDialog = Fragment.load({
                    name: "profile.view.BusyDialog",
                    controller: this
                }).then(function (oBusyDialog) {
                    this.getView().addDependent(oBusyDialog)
                    syncStyleClass("sapUiSizeCompact", this.getView(), oBusyDialog)
                    return oBusyDialog
                }.bind(this))
            }

            this._pBusyDialog.then(function (oBusyDialog) {
                oBusyDialog.open()
            }.bind(this))
        },
        endBusy: function (oController) {
            if (oController._pBusyDialog) {
                oController._pBusyDialog.then(function (oBusyDialog) {
                    oBusyDialog.close()
                })
            }
        },

        onErrorCall: function (oError, oController) {
            if (oController) {
                oController.endBusy(oController)
            }
            sap.ui.require(["sap/m/MessageBox"], function (MessageBox) {
                let errorMsg = oError.stack ||oError.message || oError.statusText || oError.responseText || String(oError) || "Unknown error"
                if (oError.fileName || oError.lineNumber) {
                    errorMsg += `\nSource: ${oError.fileName || "unknown"}:${oError.lineNumber || "?"}`
                }
                MessageBox.error(errorMsg)
            })
        }

    })

}
)