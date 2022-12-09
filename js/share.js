let shareUrl;
let urlWithoutParameters;

let shareButton;
if (instructionsButton = document.getElementById("share-button")) {
    instructionsButton.onclick = function () {
        urlWithoutParameters = location.protocol + "//" + location.host + location.pathname;
        const shareParameters = {};

        // Store zoom, longitude, and latitude
        shareParameters["zoom"] = map.getZoom();
        const center = map.getCenter();
        shareParameters["longitude"] = center["lng"];
        shareParameters["latitude"] = center["lat"];

        // Store visible layers
        for (const toggleableLayerGroupKey in toggleableLayerGroups) {
            const toggleableLayerGroup = toggleableLayerGroups[toggleableLayerGroupKey];
            for (const toggleableLayer of toggleableLayerGroup) {
                if (combinedDemographics.includes(toggleableLayer["layer"].replace("mountain-view-demographic-", "")) || (!toggleableLayer["layer"].includes("mountain-view-demographic-") && map.getLayoutProperty(toggleableLayer["layer"], "visibility") == "visible")) {
                    shareParameters[toggleableLayer["layer"]] = "";
                }
            }
        }

        // Prepare URL
        shareParametersArray = [];
        for (const shareParametersKey in shareParameters) {
            if (shareParameters.hasOwnProperty(shareParametersKey)) {
                if (shareParameters[shareParametersKey] == "") {
                    shareParametersArray.push(shareParametersKey);
                } else {
                    shareParametersArray.push(shareParametersKey + "=" + shareParameters[shareParametersKey]);
                }
            }
        }

        shareUrl = urlWithoutParameters + "?" + shareParametersArray.join("&");

        let shareContainer;
        if (shareContainer = document.getElementById("share-container")) {
            shareContainer.style.display = "flex";
            let shareUrlCustom;
            if (shareUrlCustom = document.getElementById("share-url-custom")) {
                shareUrlCustom.value = shareUrl;
            }

            let shareUrlGeneric;
            if (shareUrlGeneric = document.getElementById("share-url-generic")) {
                shareUrlGeneric.value = urlWithoutParameters;
            }
        }
    };
}

// Button to close the share window.
let shareCloseButton;
if (shareCloseButton = document.getElementById("share-close-button")) {
    shareCloseButton.onclick = function () {
        let shareContainer;
        if (shareContainer = document.getElementById("share-container")) {
            shareContainer.style.display = "none";
        }
    };
}

// Button to copy the custom link.
let shareCustomLinkButton;
if (shareCustomLinkButton = document.getElementById("share-url-custom-copy-link")) {
    shareCustomLinkButton.onclick = function () {
        navigator.clipboard.writeText(shareUrl).then(function() {
            console.log("Copied!");
        }, function() {
            console.log("Copy error");
        });
    };
}

// Button to copy the generic link.
let shareGenericLinkButton;
if (shareGenericLinkButton = document.getElementById("share-url-generic-copy-link")) {
    shareGenericLinkButton.onclick = function () {
        navigator.clipboard.writeText(urlWithoutParameters).then(function() {
            console.log("Copied!");
        }, function() {
            console.log("Copy error");
        });
    };
}
