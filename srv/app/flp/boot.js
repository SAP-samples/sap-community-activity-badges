sap.ui.define([
    "sap/ui/core/Core",
    "sap/ui/core/Theming",

], function (Core, Theming, Container) {
    "use strict";
    Core.ready().then(function () {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            Theming.setTheme("sap_horizon_dark");
        }
    });
});