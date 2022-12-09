mapboxgl.accessToken = "pk.eyJ1IjoiZXZhbmJhbGRvbmFkbyIsImEiOiJjbGIzaDNudXgwNTltM3ZubG9idW5mdXVmIn0.O02jLywfkudHcQ8oSVxA0Q"; // Use of this code is restricted to evanbaldonado.com.

// Check for WebGL availability (function from Three.js).
function webglAvailable() {
    try {
        var canvas = document.createElement("canvas");
        return !!
            window.WebGLRenderingContext &&
            (canvas.getContext("webgl") ||
                canvas.getContext("experimental-webgl"));
    } catch(e) {
        return false;
    }
}

if (!webglAvailable()) {
    let errorMessage = "It appears your browser does not support WebGL.";
    alert(errorMessage);
    document.documentElement.innerHTML = errorMessage;
    window.stop();
}

// Extract parameters from the URL.
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

// Store load options from the URL parameters.
const loadOptions = {};
urlParams.forEach((value, key) => {
    loadOptions[key] = value;
});

// Longitude, latitude, and zoom require validation and have default values.
loadOptions["longitude"] = (urlParams.has("longitude") && !Number.isNaN(Number.parseFloat(urlParams.get("longitude")))) ? Number.parseFloat(urlParams.get("longitude")) : -122.08; // If longitude is set and is valid, use that. Otherwise, use the default longitude.
loadOptions["latitude"] = (urlParams.has("latitude") && !Number.isNaN(Number.parseFloat(urlParams.get("latitude")))) ? Number.parseFloat(urlParams.get("latitude")) : 37.41; // If latitude is set and is valid, use that. Otherwise, use the default latitude.
loadOptions["zoom"] = (urlParams.has("zoom") && !Number.isNaN(Number.parseFloat(urlParams.get("zoom")))) ? Number.parseFloat(urlParams.get("zoom")) : 12; // If zoom is set and is valid, use that. Otherwise, use the default zoom.

// Create the map.
const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/" + ["streets-v12", "satellite-streets-v12", "light-v11"][0], // This line can be updated to change the base layer.
    center: [loadOptions["longitude"], loadOptions["latitude"]],
    zoom: loadOptions["zoom"],
    pitch: 0
});

// Add controls to the map (zoom, rotate, etc).
map.addControl(new mapboxgl.NavigationControl());

// Enumerate ids of the layers.
let toggleableLayerGroups = {"City": [{"layer": "mountain-view-boundaries", "name": "City boundary"}, {"layer": "mountain-view-background", "name": "City background"}, {"layer": "everything-except-mountain-view", "name": "City highlight"}], "Income": [{"layer": "mountain-view-income", "name": "Median household income (2021 inflation-adjusted)"}], "Trees": [{"layer": "mountain-view-tree-canopy", "name": "Tree canopy"}, {"layer": "mountain-view-trees", "name": "City trees"}, {"layer": "mountain-view-trees-heatmap", "name": "Heatmap of city trees"}, {"layer": "mountain-view-treeless-heatmap", "name": "Heatmap of areas without city trees"}]};

toggleableLayerGroups["Zoning"] = [];
const zoningDistricts = [["RMH", "mobile homes", "#009AB4"], ["R3", "multi-family", "#016895"], ["R1", "single-family", "#67AFD2"]];
for (zoningDistrict of zoningDistricts) {
    toggleableLayerGroups["Zoning"].push({"layer": "mountain-view-zoning-district-" + zoningDistrict[0], "name": zoningDistrict[1].charAt(0).toUpperCase() + zoningDistrict[1].slice(1)});
}

toggleableLayerGroups["Demographics"] = [];
const censusDemographics = [["PCT_P0020002", "Hispanic or Latino"], ["PCT_P0020005", "White (not Hispanic or Latino)"], ["PCT_P0020006", "Black or African American (not Hispanic or Latino)"], ["PCT_P0020007", "American Indian or Alaska Native (not Hispanic or Latino)"], ["PCT_P0020008", "Asian (not Hispanic or Latino)"], ["PCT_P0020009", "Native Hawaiian and Other Pacific Islander (not Hispanic or Latino)"], ["PCT_P0020010", "Other (not Hispanic or Latino)"], ["PCT_P0020011", "Two or More Races (not Hispanic or Latino)"]];
let censusDemographicIDs = {}; // Create an object containing the IDs of the census demographics.
for (censusDemographic of censusDemographics) {
    toggleableLayerGroups["Demographics"].push({"layer": "mountain-view-demographic-" + censusDemographic[0], "name": censusDemographic[1], "layer-color": "#FEDD5C"});
    censusDemographicIDs[censusDemographic[0]] = true;
}

// Create an array of the demographics we wish to map (based on URL parameters).
let combinedDemographics = [];
urlParams.forEach((value, key) => {
    let justTheDemographic = key.replace("mountain-view-demographic-", "");
    if (censusDemographicIDs.hasOwnProperty(justTheDemographic)) {
        combinedDemographics.push(justTheDemographic);
    }
});

const numberOfLayerGroups = Object.keys(toggleableLayerGroups).length;

map.on("load", () => {
    // Add data sources.
    map.addSource("mountain-view-boundaries", {
        "type": "vector",
        "url": "mapbox://evanbaldonado.cl9gjdf1b0p4927ppqo7x0blv-9k3wv"
    });

    map.addSource("everything-except-mountain-view", {
        "type": "vector",
        "url": "mapbox://evanbaldonado.cla0kda4u09og27lcuomzs8vf-2kf8e"
    });

    // Source: https://data-mountainview.opendata.arcgis.com/datasets/trees/
    map.addSource("mountain-view-trees", {
        "type": "geojson",
        "data": "https://evanbaldonado.com/mountain-view-tree-equity/raw-data/mountain-view-trees.geojson "
    });

    // Source: https://data-mountainview.opendata.arcgis.com/datasets/tree-canopy/
    map.addSource("mountain-view-tree-canopy-simplified", {
        "type": "geojson",
        "data": "https://evanbaldonado.com/mountain-view-tree-equity/raw-data/mountain-view-tree-canopy-simplified.geojson"
    });

    // Source: https://data-mountainview.opendata.arcgis.com/datasets/zoning-districts/
    map.addSource("mountain-view-zoning-districts", {
        "type": "vector",
        "url": "mapbox://evanbaldonado.cla1jih5z0i1d22mtsyqorsht-3n6tg"
    });

    // Source: https://livingatlas-dcdev.opendata.arcgis.com/maps/esri::california-census-2020-redistricting-blocks
    // Documentation: https://www.arcgis.com/home/item.html?id=903453c84ade4f11aa3bce393af172d3
    map.addSource("mountain-view-census-block-data", {
        "type": "geojson",
        "data": "https://evanbaldonado.com/mountain-view-tree-equity/raw-data/mountain-view-census-block-data.geojson"
    });

    // Source 1: https://data-mountainview.opendata.arcgis.com/datasets/MountainView::census-block-group-cmv/ (block groups)
    // Source 2: Table B19013 ("MEDIAN HOUSEHOLD INCOME IN THE PAST 12 MONTHS (IN 2021 INFLATION-ADJUSTED DOLLARS)"): https://data.census.gov/table?q=B19013&g=0500000US06085$1500000
    // I merged these sources using a Python script.
    map.addSource("mountain-view-income-block-group-data", {
        "type": "geojson",
        "data": "https://evanbaldonado.com/mountain-view-tree-equity/raw-data/mountain-view-income-block-groups.geojson"
    });

    // Add layers.
    let layerId;

    // Background
    layerId = "mountain-view-background";
    map.addLayer({
        "id": layerId,
        "type": "fill",
        "source": "mountain-view-boundaries",
        "source-layer": "Mountain_View_Boundaries",
        "layout": { },
        "paint": {
            "fill-color": "#000000",
            "fill-opacity": 0.8
        },
        "layout": {
            "visibility": urlParams.has(layerId) ? "visible" : "none"
        }
    });

    // Currently used as an additional layer underneath demographic data (not displayed by itself).
    layerId = "mountain-view-fully-opaque-background";
    map.addLayer({
        "id": layerId,
        "type": "fill",
        "source": "mountain-view-boundaries",
        "source-layer": "Mountain_View_Boundaries",
        "layout": { },
        "paint": {
            "fill-color": "#000000",
            "fill-opacity": 1
        },
        "layout": {
            "visibility": urlParams.has(layerId) ? "visible" : "none"
        }
    });

    // Income
    layerId = "mountain-view-income";
    map.addLayer({
        "id": layerId,
        "type": "fill",
        "source": "mountain-view-income-block-group-data",
        "paint": {
            "fill-color": [
                "case",
                ["==", ["get", "income"], -1],
                "#B83A4B", //  --stanford-cardinal-red-light
                ["rgb", ["*", 255, ["/", ["get", "income"], 250000]], ["*", 255, ["/", ["get", "income"], 250000]], ["*", 255, ["/", ["get", "income"], 250000]]]
            ],
            "fill-opacity": [
                "case",
                ["==", ["get", "income"], -1],
                0.2,
                1
            ] // fade layers where income is not -1 (not available)
        },
        "layout": {
            "visibility": urlParams.has(layerId) ? "visible" : "none"
        }
    });

    map.addLayer({
        "id": "income-labels",
        "type": "symbol",
        "source": "mountain-view-income-block-group-data",
        "layout": {
            "text-field": [
                "case",
                // display income as "N/A" if it is unavailable
                ["==", ["get", "income"], -1],
                "N/A",
                [
                    "case",
                    // display income as "$250,000+" if it is 250000
                    ["==", ["get", "income"], 250000],
                    "$250,000+",
                    // display income normally
                    [
                        "concat",
                        "$",
                        ["number-format",
                            ["get", "income"],
                            { }
                        ]
                    ]
                ]
            ],
            "text-justify": "auto",
            "icon-image": ["get", "icon"],
            "visibility": urlParams.has("mountain-view-income") ? "visible" : "none"
        },
        "paint": {
            // text color is either black or white (whichever is furthest from the background)
            "text-color": [
                "case",
                ["==", ["get", "income"], -1],
                "white",
                ["rgb", ["*", 255, ["round", ["-", 1, ["/", ["get", "income"], 250000]]]], ["*", 255, ["round", ["-", 1, ["/", ["get", "income"], 250000]]]], ["*", 255, ["round", ["-", 1, ["/", ["get", "income"], 250000]]]]]
            ],
        },
    });

    if (urlParams.has("mountain-view-income")) {
        document.getElementById("income-legend").style.display = "inline-block";
    } else {
        document.getElementById("income-legend").style.display = "none";
    }

    // Demographics/census data
    displayCombinedDemographics(combinedDemographics);

    // Tree data
    layerId = "mountain-view-tree-canopy";
    map.addLayer({
        "id": layerId,
        "type": "fill",
        "source": "mountain-view-tree-canopy-simplified",
        "paint": {
            "fill-color": " #6FA287",  // bay // "#620059", // this is --stanford-plum
        },
        "layout": {
            "visibility": urlParams.has(layerId) ? "visible" : "none"
        }
    });

    layerId = "mountain-view-treeless-heatmap";
    map.addLayer({
        "id": layerId,
        "type": "heatmap",
        "source": "mountain-view-trees",
        "paint": {
            "heatmap-color": ["interpolate",["exponential", 50],["heatmap-density"],0,"#350D36",0.01,"#350D36",0.3,"#350D36",0.5,"#350D36",0.7,"#350D36",0.99,"#350D36",1,"rgba(0, 0, 0, 0)"], // treeless areas only

            "heatmap-opacity": {
                "default": 1,
                "stops": [
                    [14, 0.75],
                    [15, 0.25]
                ]
            },
            "heatmap-radius": {
                "base": 2,
                "stops": [
                    [10, 2],
                    [19, 400]
                ]
            }
        },
        "layout": {
            "visibility": urlParams.has(layerId) ? "visible" : "none"
        }
    });

    layerId = "mountain-view-trees-heatmap";
    map.addLayer({
        "id": layerId,
        "test": "test",
        "type": "heatmap",
        "source": "mountain-view-trees",
        "paint": {
            "heatmap-color": ["interpolate",["exponential", 50],["heatmap-density"],0,"rgba(0, 0, 0, 0)",0.01,"rgba(0, 0, 0, 0)",0.3,"rgba(0, 0, 0, 0)",0.5,"rgba(0, 0, 0, 0)",0.7,"rgba(0, 0, 0, 0)",0.99,"rgba(0, 0, 0, 0)",1,"#734675"], // regular heatmap

            "heatmap-opacity": {
                "default": 1,
                "stops": [
                    [14, 0.75],
                    [15, 0.25]
                ]
            },
            "heatmap-radius": {
                "base": 2,
                "stops": [
                    [10, 2],
                    [19, 400] // You can increase the second number to be more aggressive with the heatmap.
                ]
            },
        },
        "layout": {
            "visibility": urlParams.has(layerId) ? "visible" : "none",
        },
    });

    // Boundaries and outer layer
    layerId = "mountain-view-boundaries";
    map.addLayer({
        "id": layerId,
        "type": "line",
        "source": "mountain-view-boundaries",
        "source-layer": "Mountain_View_Boundaries",
        "layout": {
            "line-join": "round",
            "line-cap": "round"
        },
        "paint": {
            "line-color": "slategrey",
            "line-width": 4
        },
        "layout": {
            "visibility": urlParams.has(layerId) ? "visible" : "none"
        }
    });

    layerId = "everything-except-mountain-view";
    map.addLayer({
        "id": layerId,
        "type": "fill",
        "source": "everything-except-mountain-view",
        "source-layer": "everything-except-mountain-view",
        "layout": { },
        "paint": {
            "fill-color": "#000000",
            "fill-opacity": 0.8
        },
        "layout": {
            "visibility": urlParams.has(layerId) ? "visible" : "none"
        }
    });

    // Zoning districts
    for (const zoningDistrict of zoningDistricts) {
        layerId = "mountain-view-zoning-district-" + zoningDistrict[0];
        map.addLayer({
            "id": layerId,
            "type": "fill",
            "source": "mountain-view-zoning-districts",
            "source-layer": "mountain-view-zoning-districts",
            "paint": {
                "fill-color": zoningDistrict[2],
                "fill-opacity": 0.5
            },
            "layout": {
                "visibility": urlParams.has(layerId) ? "visible" : "none"
            }
        });

        map.setFilter(layerId, ["==", ["get", "ZONECLASS"], zoningDistrict[0]]);
    }

    // More trees
    layerId = "mountain-view-trees";
    map.addLayer({
        "id": layerId,
        "type": "circle",
        "source": "mountain-view-trees",
        "paint": {
            "circle-color": "#E04F39", // --stanford-spirited
            "circle-radius": {
                "base": 1.75,
                "stops": [
                    // Future implementation: can size to the tree width using https://stackoverflow.com/a/37794326/14167361
                    [0, 0],
                    [20, 35]
                ]
            },
        },
        "layout": {
            "visibility": urlParams.has(layerId) ? "visible" : "none"
        },
    });
});
