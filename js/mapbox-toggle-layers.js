// Code modified from https://docs.mapbox.com/mapbox-gl-js/example/toggle-layers/

// After the last frame rendered before the map enters an "idle" state.
map.on("idle", () => {

    let layerNumber = 0;

    // Set up the corresponding toggle button for each layer.
    for (const toggleableLayerGroupKey in toggleableLayerGroups) {
        layerNumber++;
        const hyphenatedAndLowerCaseKey = toggleableLayerGroupKey.replaceAll(" ", "-").toLowerCase();

        // Skip dropdowns that already have buttons set up
        if (document.getElementById("dropdown-" + hyphenatedAndLowerCaseKey)) { continue; }

        const toggleableLayerGroup = toggleableLayerGroups[toggleableLayerGroupKey];

        const dropdownContent = document.createElement("div");
        dropdownContent.className = "dropdown-content";

        for (const toggleableLayer of toggleableLayerGroup) {
            const id = toggleableLayer["layer"];
            const layerName = toggleableLayer["name"];

            // Skip layers that do not exist or already have a button set up (exception for demographics layers).
            if ((!map.getLayer(id) || document.getElementById(id + "-toggle-button")) && !id.includes("mountain-view-demographic")) { continue; }

            // Create a link.
            const link = document.createElement("a");
            link.id = id + "-toggle-button";
            link.layerId = id;
            link.href = "#";
            link.textContent = layerName;
            let layerColor = null;
            if (toggleableLayer.hasOwnProperty("layer-color")) {
                layerColor = toggleableLayer["layer-color"];
            } else {
                try {
                    let heatmapColor = map.getPaintProperty(id, "heatmap-color");
                    // If there is a heatmap color, grab the first hex value it has.
                    for (const item of heatmapColor) {
                        if (typeof item !== "string" && ! (item instanceof String)) { continue; }
                        let hexRegex = /^#([0-9a-f]{3}){1,2}$/i;
                        if (hexRegex.test(item)) {
                            layerColor = item;
                            break;
                        }
                    }
                    if (layerColor == null) {
                        throw "no heatmap color found";
                    }
                }
                catch {
                    try {
                        layerColor = map.getPaintProperty(id, "fill-color");
                    }
                    catch {
                        try {
                            layerColor = map.getPaintProperty(id, "circle-color");
                        }
                        catch {
                            layerColor = "grey"; // default to grey
                        }
                    }
                }
            }

            // Update the in-menu color to match the layer color.
            link.style.borderLeftColor = layerColor;

            // Set the active status of the link.
            if (combinedDemographics.includes(id.replace("mountain-view-demographic-", "") || map.getLayoutProperty(id, "visibility") === "visible")) {
                link.className = "active";
            } else {
                link.className = "inactive";
            }

            // Show or hide layer when the toggle is clicked.
            link.onclick = function (e) {
                const clickedLayer = this.layerId;
                e.preventDefault();
                e.stopPropagation();

                // Handle demographics.
                if (toggleableLayerGroupKey === "Demographics") {
                    let justTheDemographic = id.replace("mountain-view-demographic-", "");
                    if (combinedDemographics.includes(justTheDemographic)) {
                        combinedDemographics = combinedDemographics.filter(demographic => demographic !== justTheDemographic);
                        this.className = "inactive";
                    } else {
                        combinedDemographics.push(justTheDemographic);
                        this.className = "active";
                    }
                    displayCombinedDemographics(combinedDemographics);
                    return;
                }

                // Handle other layers.
                let visibility = map.getLayoutProperty(clickedLayer, "visibility");
                if (visibility === "visible" || visibility === undefined) {
                    map.setLayoutProperty(clickedLayer, "visibility", "none");
                    this.className = "inactive";
                    // Handle income legend/labels.
                    if (clickedLayer === "mountain-view-income") {
                        document.getElementById("income-legend").style.display = "none";
                        map.setLayoutProperty("income-labels", "visibility", "none");
                    }
                } else {
                    this.className = "active";
                    map.setLayoutProperty(clickedLayer, "visibility", "visible");
                    // Handle income legend/labels.
                    if (clickedLayer === "mountain-view-income") {
                        document.getElementById("income-legend").style.display = "inline-block";
                        map.setLayoutProperty("income-labels", "visibility", "visible");
                    }
                }
            };

            dropdownContent.appendChild(link);
        }

        // Create the dropdown element.
        const dropdownElement = document.createElement("div");
        dropdownElement.className = "dropdown";
        dropdownElement.id = "dropdown-" + hyphenatedAndLowerCaseKey;

        // Create the dropdown button.
        const dropdownButton = document.createElement("div");
        dropdownButton.classList.add("dropdown-button");
        if (layerNumber === 1) {
            dropdownButton.classList.add("first-dropdown-button");
        }
        if (layerNumber === numberOfLayerGroups) {
            dropdownButton.classList.add("last-dropdown-button");
        }
        dropdownButton.innerText = toggleableLayerGroupKey;

        // Populate the dropdown.
        dropdownElement.appendChild(dropdownButton);
        dropdownElement.appendChild(dropdownContent);

        const menuElement = document.getElementById("menu");
        menu.appendChild(dropdownElement);
    }
});
