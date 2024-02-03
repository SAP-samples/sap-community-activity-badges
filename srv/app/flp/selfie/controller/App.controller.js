/* eslint-disable no-undef */
/*eslint-env es6 */
"use strict";
sap.ui.define([
    "selfie/controller/BaseController",
    "sap/m/MessageToast",
    "sap/ui/core/Core"
],
    function (BaseController, MessageToast, oCore) {

        return BaseController.extend("selfie.controller.App", {
            uploadPressed: async function (oEvent) {
                let view = this.getView()
                let oFileUploader = view.byId("fileToUpload")
                if (!oFileUploader.getValue()) {
                    MessageToast.show("Choose a file first")
                    return
                }
                let oInput = view.byId("carouselSample")
                if (!oInput.getActivePage()) {
                    MessageToast.show("Please Select a template")
                    return
                }
                let param = view.byId("uploadParam")
                param.setValue(oInput.getActivePage())
                oFileUploader.getParameters()
                oFileUploader.setAdditionalData(JSON.stringify({
                    selectedPic: oInput.getActivePage()
                }))
                oFileUploader.upload()
            },

            uploadStart: async function (oEvent) {
                let view = this.getView()
                let controller = view.getController()
                controller.startBusy()
            },

            uploadComplete: async function (oEvent){
                let view = this.getView()
                let controller = view.getController()
                let dataURL = "data:image/png;base64,"  + oEvent.getParameters().responseRaw
                let oImageEditor = view.byId("image")
                await oImageEditor.setSrc(dataURL)
                controller.endBusy(controller)
            },

            onSaveAsPress: async function() {
                let view = this.getView()
                let oImageEditor = view.byId("image")    
                oImageEditor.openSaveDialog()
            },
            onImageLoaded: async function(oEvent){
                let view = this.getView()

                let panel1 = view.byId("carouselContainer")
                panel1.setExpanded(false)
                let panel2 = view.byId("fileUploadContainer")
                panel2.setExpanded(false)


            }
        })
    }
)