(() => {
    "use strict";
    const startShell = () => {
        sap.ui.require([
            "sap/ui/core/Core",
            "sap/ushell/Container"
        ], function(
            Core,
            Container
        ) {
            Core.ready().then(async () => {
                const oContent = await Container.createRendererInternal(null);
                oContent.placeAt("content");
            });
        });
    };

    startShell()
})();