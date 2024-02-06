sap.ui.define([
    "sap/m/MessageToast"
], function (MessageToast) {
    "use strict";

    var Utils = {

        ranking: {
            Initial: 0,
            Default: 1024,
            Before: function (iRank) {
                return iRank + 1024
            },
            Between: function (iRank1, iRank2) {
                // limited to 53 rows
                return (iRank1 + iRank2) / 2
            },
            After: function (iRank) {
                return iRank / 2
            }
        },

        getSelBadgesTable: function (oController) {
            return oController.getOwnerComponent().getRootControl().byId("selBadgesTable").byId("table")
        },

        getSelectedItemContext: function (oTable, fnCallback) {
            let aSelectedItems = oTable.getSelectedItems()
            let oSelectedItem = aSelectedItems[0]

            if (!oSelectedItem) {
                MessageToast.show("Please select a row!")
                return
            }

            let oSelectedContext = oSelectedItem.getBindingContext()
            if (oSelectedContext && fnCallback) {
                let iSelectedIndex = oTable.indexOfItem(oSelectedItem)
                fnCallback(oSelectedContext, iSelectedIndex, oTable)
            }

            return oSelectedContext
        }

    }

    return Utils

})