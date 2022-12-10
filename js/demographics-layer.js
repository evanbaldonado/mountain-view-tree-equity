// The demographics layers operate differently than other layers in this project.
// In order to allow for multiple demographics to be displayed at once, we need to calculate the color ourselves.
// Adding opacities does not work. For example: 70% and 20% would be equal to 0.7 + (1 - 0.7) * 0.2 = 0.76 != 90%.

function displayCombinedDemographics(combinedDemographics) {
    // Remove the layer if it already exists.
    if (map.getLayer("mountain-view-combined-demographic")) {
        map.removeLayer("mountain-view-combined-demographic-labels");
        map.removeLayer("mountain-view-combined-demographic");
    }

    // Only add the layer if we have demographics to display.
    if (combinedDemographics.length <= 0) {
        document.getElementById("demographics-legend").style.display = "none";
        return;
    }

    // Display the legend.
    document.getElementById("demographics-legend").style.display = "inline-block";

    // Calculate the color of our layer, using Mapbox Expressions. Also, keep track of the total percent.
    let layer100PercentRed = 254;
    let layer100PercentGreen = 221;
    let layer100PercentBlue = 92;
    let totalPercent = 0;

    let layerFillRGB = {"red": 0, "green": 0, "blue": 0};
    for (const censusDemographic of combinedDemographics) {
        layerFillRGB["red"] = ["+", layerFillRGB["red"], ["*", layer100PercentRed, ["case", ["to-boolean", ["get", censusDemographic]], ["/", ["get", censusDemographic], 100], 0]]];
        layerFillRGB["green"] = ["+", layerFillRGB["green"], ["*", layer100PercentGreen, ["case", ["to-boolean", ["get", censusDemographic]], ["/", ["get", censusDemographic], 100], 0]]];
        layerFillRGB["blue"] = ["+", layerFillRGB["blue"], ["*", layer100PercentBlue, ["case", ["to-boolean", ["get", censusDemographic]], ["/", ["get", censusDemographic], 100], 0]]];
        // textFillRGB["red"] = ["+", textFillRGB["red"], ["*", layer100PercentRed, ["case", ["to-boolean", ["get", censusDemographic]], ["-", 1, ["/", ["get", censusDemographic], 100]], 100]]];
        // textFillRGB["green"] = ["+", textFillRGB["green"], ["*", layer100PercentGreen, ["case", ["to-boolean", ["get", censusDemographic]], ["-", 1, ["/", ["get", censusDemographic], 100]], 100]]];
        // textFillRGB["blue"] = ["+", textFillRGB["blue"], ["*", layer100PercentBlue, ["case", ["to-boolean", ["get", censusDemographic]], ["-", 1, ["/", ["get", censusDemographic], 100]], 100]]];
        //
        totalPercent = ["+", totalPercent, ["case", ["to-boolean", ["get", censusDemographic]], ["get", censusDemographic], 0]];
    }

    let textFillRGB = {"red": 0, "green": 0, "blue": 0};
    textFillRGB["red"] = ["*", ["-", 1, ["round", ["/", totalPercent, 100]]], 255];
    textFillRGB["green"] = ["*", ["-", 1, ["round", ["/", totalPercent, 100]]], 255];
    textFillRGB["blue"] = ["*", ["-", 1, ["round", ["/", totalPercent, 100]]], 255];

    totalPercent = ["concat", ["to-string", ["round", totalPercent]], "%"];

    // Determine where anyone lives in the given area.
    let doPeopleLiveHere = 0;
    for (let censusDemographic in censusDemographicIDs) {
        doPeopleLiveHere = ["+", doPeopleLiveHere, ["case", ["to-boolean", ["get", censusDemographic]], ["get", censusDemographic], 0]];
    }
    doPeopleLiveHere = [">=", doPeopleLiveHere , 0.5];

    // Create our layer.
    layerId = "mountain-view-combined-demographic";
    map.addLayer({
        "id": layerId,
        "type": "fill",
        "source": "mountain-view-census-block-data",
        "layout": { },
        "paint": {
            "fill-color": [
                "rgb",
                [
                    "case",
                    doPeopleLiveHere,
                    layerFillRGB["red"],
                    184
                ],
                [
                    "case",
                    doPeopleLiveHere,
                    layerFillRGB["green"],
                    58
                ],
                [
                    "case",
                    doPeopleLiveHere,
                    layerFillRGB["blue"],
                    75
                ]
            ],
            "fill-opacity": [
                "case",
                doPeopleLiveHere,
                1,
                0.2
            ]
        },
        "layout": {
            "visibility": "visible"
        }
    });

    // Create a label layer.
    map.addLayer({
        "id": "mountain-view-combined-demographic-labels",
        "type": "symbol",
        "source": "mountain-view-census-block-data",
        "layout": {
            "text-field": [
                "case",
                doPeopleLiveHere,
                totalPercent,
                "N/A"
            ],
            "text-justify": "auto",
            "icon-image": ["get", "icon"]
        },
        "paint": {
            // display as black/white if >0% or N/A, otherwise display as red
            "text-color": [
                "case",
                ["!", doPeopleLiveHere],
                "black",
                [
                    "case",
                    ["==", totalPercent, "0%"],
                    "#B83A4B", // --stanford-cardinal-red-light
                    [
                        "rgb",
                        textFillRGB["red"],
                        textFillRGB["green"],
                        textFillRGB["blue"]
                    ]
                ]
            ],
            "text-opacity": [
                "case",
                doPeopleLiveHere,
                1,
                1 // TODO: 0
            ]
        },
        "minzoom": 13
    });

    // Move other layers in front of our layers.
    for (const toggleableLayerGroupKey in toggleableLayerGroups) {
        const toggleableLayerGroup = toggleableLayerGroups[toggleableLayerGroupKey];
        for (const toggleableLayer of toggleableLayerGroup) {
            if (map.getLayer(toggleableLayer["layer"]) && !["mountain-view-income", "mountain-view-background"].includes(toggleableLayer["layer"])) {
                map.moveLayer(toggleableLayer["layer"]);
            }
        }
    }
}
