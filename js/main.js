 /* Copyright 2017 Esri

   Licensed under the Apache License, Version 2.0 (the "License");

   you may not use this file except in compliance with the License.

   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software

   distributed under the License is distributed on an "AS IS" BASIS,

   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

   See the License for the specific language governing permissions and

   limitations under the License.
   ​
   */

/*
 * Title: Main
 * Author: GvM
 * Date: 12/04/18
 * Description: starts the application
 */

/* define the module and its dependencies */
define([
    "dojo/_base/declare",
    "dojo/html",
    "dojo/dom",
    "dojo/on",

    "esri/Map",
    "esri/views/SceneView",
    "esri/layers/SceneLayer",
    "esri/layers/TileLayer",
    "esri/layers/GroupLayer",
    "esri/renderers/SimpleRenderer",
    "esri/symbols/MeshSymbol3D",
    "esri/widgets/BasemapToggle",
], function (
    declare,
    html,
    dom,
    on,
    Map,
    SceneView,
    SceneLayer,
    TileLayer,
    GroupLayer,
    SimpleRenderer,
    MeshSymbol3D,
    BasemapToggle
) {
        // application settings
        var settings_demo = {
            name: "Demo",
            url: "http://zurich.maps.arcgis.com",           // portal URL for config
            webscene: "0af10b5e35ed4a5bbe095aa76b14b786",   // portal item ID of the webscene
            usagename: "usage",                             // usage attribute (string)
            floorname: "floorID",                           // floor attribute (int)
            OIDname: "OBJECTID",                            // objectid
            buildingIDname: "buildingID",                   // building attribute (int)
            areaname: "unitarea",                           // area attribute (float)
        };
    
    
        return declare(null, {

            /* contructor method so we can use this key word */
            constructor: function () {
                
            },

            /* define the logic of the welcome module */
            init: function () {

                this.startApp();


            },

            /* create UI for the welcome page */
            startApp: function () {
                // Create the SceneView and Map
                var view = new SceneView({
                    container: "map",
                    map: new Map({
                        basemap: "dark-gray",
                        ground: "world-elevation",
                        layers: [
                            new SceneLayer({
                                id: "buildings",
                                //url: "https://tiles.arcgis.com/tiles/Imiq6naek6ZWdour/arcgis/rest/services/MDC_Bldgs3D_SLR/SceneServer"
                                url: "https://tiles.arcgis.com/tiles/kNxiwRZHjxrUW86Z/arcgis/rest/services/MDCSLRBuildings/SceneServer"
                            }),
                            new GroupLayer({
                                id: "coast",
                                layers: ["http://tiles.arcgis.com/tiles/C8EMgrsFcRFL6LrL/arcgis/rest/services/slr_0ft/MapServer",
                                    "http://tiles.arcgis.com/tiles/C8EMgrsFcRFL6LrL/arcgis/rest/services/slr_1ft/MapServer",
                                    "http://tiles.arcgis.com/tiles/C8EMgrsFcRFL6LrL/arcgis/rest/services/slr_2ft/MapServer",
                                    "http://tiles.arcgis.com/tiles/C8EMgrsFcRFL6LrL/arcgis/rest/services/slr_3ft/MapServer",
                                    "http://tiles.arcgis.com/tiles/C8EMgrsFcRFL6LrL/arcgis/rest/services/slr_4ft/MapServer",
                                    "http://tiles.arcgis.com/tiles/C8EMgrsFcRFL6LrL/arcgis/rest/services/slr_5ft/MapServer",
                                    "http://tiles.arcgis.com/tiles/C8EMgrsFcRFL6LrL/arcgis/rest/services/slr_6ft/MapServer"].map(function (e) {
                                    return new TileLayer({
                                        url: e,
                                        opacity: 0
                                    })
                                })
                            })
                        ]
                    })
                });
                
                // Configure UI listeners
                view.then(function () {
                    // Update map when floodLevelSlider changes
                    on(dom.byId("SLRLevelSlider"), "change", function () {
                        highlightBuildings();
                    });

                    // Update map when buildingOpacitySlider changes
                    on(dom.byId("buildingOpacitySlider"), "change", function () {
                        updateBuildingOpacity();
                    });

                    // Update map when waterOpacitySlider changes
                    on(dom.byId("waterOpacitySlider"), "change", function () {
                        updateWaterOpacity();
                    });
                });
                
                // When the building layer has loaded
                view.map.findLayerById("buildings").on("layerview-create", function(e){
                    // Update building renderer and transparency.
                    highlightBuildings();
                    updateBuildingOpacity();
                    
                    // Set extent to entire building layer.
                    view.extent= e.layerView.layer.fullExtent;
                    
                    // Animate the view to that it tilts over 2.5 seconds
                    view.goTo({
                        tilt: 60
                    },{
                        duration: 2500
                    });
                });
                
                // When the water layer has loaded
                view.map.findLayerById("coast").on("layerview-create", function(e){
                    // Update water transparency
                    updateWaterOpacity();
                });
                

                // Add sea level rise menu and basemap toggle
                var basemapToggle = new BasemapToggle({
                    view: view,           // view that provides access to the map's 'topo' basemap
                    nextBasemap: "hybrid" // allows for toggling to the 'hybrid' basemap
                });
                view.ui.add(basemapToggle,"top-right");
                view.ui.add("menu", "bottom-left");

                function highlightBuildings() {
                    //
                    var HIGHTLIGHTED = "#FF0000";
                    var NOT_HIGHTLIGHTED = "#FFFFFF";
                    // Slider value
                    var floodSliderValue = Number(dom.byId("SLRLevelSlider").value);
                    
                    // Create the renderer and configure visual variables
                    
                    view.map.findLayerById("buildings").renderer = new SimpleRenderer({
                        symbol: new MeshSymbol3D(),
                        visualVariables: [{
                            // Set Opacity
                            // specifies a visual variable of continuous color
                            type: "color",
                            field: "SLRLevel",
                            // Color ramp from white to red buildings impacted by SLR will be
                            // assigned a color proportional to the min and max colors specified below
                            // Values for Sea LevelRise SliderSlider for Sea Level Rise
                            // Slider for Sea Level Rise
                            stops: [{
                                value: null,
                                color: NOT_HIGHTLIGHTED
                            }, {
                                value: 0,
                                color: floodSliderValue >= 0 ? HIGHTLIGHTED : NOT_HIGHTLIGHTED
                            },  { 
                                value: 1,
                                color: floodSliderValue >= 1 ? HIGHTLIGHTED : NOT_HIGHTLIGHTED
                            }, {
                                value: 2,
                                color: floodSliderValue >= 2 ? HIGHTLIGHTED : NOT_HIGHTLIGHTED
                            }, {
                                value: 3,
                                color: floodSliderValue >= 3 ? HIGHTLIGHTED : NOT_HIGHTLIGHTED
                            },  {
                                value: 4,
                                color: floodSliderValue >= 4 ? HIGHTLIGHTED : NOT_HIGHTLIGHTED
                            }, {
                                value: 5,
                                color: floodSliderValue >= 5 ? HIGHTLIGHTED : NOT_HIGHTLIGHTED
                            }, {
                                value: 6,
                                color: floodSliderValue >= 6 ? HIGHTLIGHTED : NOT_HIGHTLIGHTED
                            }]
                        }]
                    });
                    
                    // Update FloodLayer
                    view.map.findLayerById("coast").layers.forEach(function (e, i) {
                        e.opacity = i === floodSliderValue ? 1 : 0;
                    });

                    // Update UI
                    html.set(dom.byId("SLRSliderMessage"), "Sea Level Rise : " + floodSliderValue + "ft");
                }
                
                // Update water transparency
                function updateWaterOpacity(){
                    var opacity = Number(dom.byId("waterOpacitySlider").value);
                    view.map.findLayerById("coast").opacity = opacity;
                    html.set(dom.byId("waterOpacityMessage"), "Water Opacity: " + opacity);
                }
                
                // Update building transparency
                function updateBuildingOpacity(){
                    var opacity = Number(dom.byId("buildingOpacitySlider").value);
                    view.map.findLayerById("buildings").opacity = opacity;
                    html.set(dom.byId("buildingOpacityMessage"), "Building Opacity: " + opacity);
                }
            },
        });
    });


function getJsonFromUrl() {
    var query = location.search.substr(1);
    var result = {};
    query.split("&").forEach(function (part) {
        var item = part.split("=");
        result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
}