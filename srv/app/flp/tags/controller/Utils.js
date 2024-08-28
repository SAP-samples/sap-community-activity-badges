sap.ui.define([
    "sap/m/MessageToast"
], function (MessageToast) {
    "use strict";

    var Utils = {

        ranking: {
            Initial: 0,
            Default: 1024,
            Before: function (rank) {
                return rank + 1024
            },
            Between: function (rank1, rank2) {
                // limited to 53 rows
                return (rank1 + rank2) / 2
            },
            After: function (rank) {
                return rank / 2
            }
        },

        getSelBadgesTable: function (controller) {
            return controller.getOwnerComponent().getRootControl().byId("application-profile-ui-component---App--selBadgesTable") //.byId("table")
        },

        getSelectedItemContext: function (table, callback) {
            let selectedItems = table.getSelectedItems()
            let selectedItem = selectedItems[0]

            if (!selectedItem) {
                MessageToast.show("Please select a row!")
                return
            }

            let selectedContext = selectedItem.getBindingContext()
            if (selectedContext && callback) {
                let selectedIndex = table.indexOfItem(selectedItem)
                callback(selectedContext, selectedIndex, table)
            }

            return selectedContext
        }

    }

    return Utils

})