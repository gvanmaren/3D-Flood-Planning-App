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
    "esri/layers/ElevationLayer",
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
    ElevationLayer,
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

            startApp: function () {

                /* water symbol */
                var waterRenderer = {
                    type: "simple", // autocasts as new SimpleRenderer()
                    symbol: {
                      type: "mesh-3d", // autocasts as new MeshSymbol3D()
                      symbolLayers: [{
                        type: "fill", // autocasts as new FillSymbol3DLayer()
                        material: {
                          color: "#4CA3FF",
                          colorMixMode: "replace"
                        }
                      }]
                    }
                  };

                // Create new map
                my_map = new Map({
                    basemap: "dark-gray",
                    ground: "world-elevation",
                    layers: [
                        new SceneLayer({
                            id: "buildings",
                            //url: "https://tiles.arcgis.com/tiles/Imiq6naek6ZWdour/arcgis/rest/services/MDC_Bldgs3D_SLR/SceneServer"
                            //url: "https://tiles.arcgis.com/tiles/kNxiwRZHjxrUW86Z/arcgis/rest/services/MDCSLRBuildings/SceneServer"
                            //url: "https://tiles.arcgis.com/tiles/wdgKFvvZvYZ3Biji/arcgis/rest/services/Baltimore_Buildings_test_area1/SceneServer"
                            url: "https://services7.arcgis.com/wdgKFvvZvYZ3Biji/arcgis/rest/services/Baltimore_SLR/SceneServer"
                            //url: "https://tiles.arcgis.com/tiles/wdgKFvvZvYZ3Biji/arcgis/rest/services/Baltimore_buildings_slr2/SceneServer"
                        }),
                        new GroupLayer({
                            id: "coast",
                            layers: [
                                "https://tiles.arcgis.com/tiles/wdgKFvvZvYZ3Biji/arcgis/rest/services/Baltimore_test_area1_slr_0f_3D/SceneServer",
                                "https://tiles.arcgis.com/tiles/wdgKFvvZvYZ3Biji/arcgis/rest/services/Baltimore_test_area1_slr_1f_3D/SceneServer",
                                "https://tiles.arcgis.com/tiles/wdgKFvvZvYZ3Biji/arcgis/rest/services/Baltimore_test_area1_slr_2f_3D/SceneServer",
                                "https://tiles.arcgis.com/tiles/wdgKFvvZvYZ3Biji/arcgis/rest/services/Baltimore_test_area1_slr_3f_3D/SceneServer",
                                "https://tiles.arcgis.com/tiles/wdgKFvvZvYZ3Biji/arcgis/rest/services/Baltimore_test_area1_slr_4f_3D/SceneServer",
                                "https://tiles.arcgis.com/tiles/wdgKFvvZvYZ3Biji/arcgis/rest/services/Baltimore_test_area1_slr_5f_3D/SceneServer",
                                "https://tiles.arcgis.com/tiles/wdgKFvvZvYZ3Biji/arcgis/rest/services/Baltimore_test_area1_slr_6f_3D/SceneServer"].map(function (element) {
                                return new SceneLayer({
                                    url: element,
                                    opacity: 0,
                                    renderer: waterRenderer
                                })
                            })
                        })
                    ]
                });

                var elevLyr = new ElevationLayer({
                    // Custom elevation service
                    url: "https://tiles.arcgis.com/tiles/wdgKFvvZvYZ3Biji/arcgis/rest/services/Depth_SLR6ft_min10/ImageServer"
                  });
                  // Add elevation layer to the map's ground.
                  my_map.ground.layers.add(elevLyr);

                // Create the SceneView and Map
                var view = new SceneView({
                    container: "map",
                    map: my_map,
                    environment: {
                        atmosphere: { // creates a realistic view of the atmosphere
                            quality: "high"
                        },
                        lighting: {
                            date: new Date("Sun Mar 15 2015 09:00:00 GMT-0500 (CET)"),
                            directShadowsEnabled: true,
                            cameraTrackingEnabled: false
                        }
                      },
                });
                
                // Configure UI listeners
                view.when(function () {
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

                    // Update time
                    on(dom.byId("timeOfDaySelect"), "change", updateTimeOfDay);

                    // Update shadows
                    on(dom.byId("directShadowsInput"), "change", updateDirectShadows);

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
                view.ui.add(basemapToggle,"bottom-right");
                view.ui.add("menu", "bottom-left");

                function highlightBuildings() {
                    //
                    var HIGHTLIGHTED = "#FF0000";
                    var NOT_HIGHTLIGHTED = "#FFFFFF";
                    // Slider value
                    var floodSliderValue = Number(dom.byId("SLRLevelSlider").value);
                    
                    // Create the renderer and configure visual variables
                    view.map.findLayerById("buildings").renderer = new SimpleRenderer({
                        symbol: {
                            type: "mesh-3d",
                            symbolLayers: [{
                                type: "fill",
                                material: {
                                    color: "#ffffff",
                                    colorMixMode: "replace"
                                },
                                edges: {
                                    type: "solid", // autocasts as new SolidEdges3D()
                                    color: [50, 50, 50, 0.5],
                                    size: 1
                                }        
                            }],
                        },
                        visualVariables: [{
                            // Set Opacity
                            // specifies a visual variable of continuous color
                            type: "color",
                            field: "NOAA_SeaLevelRise_Flooding_SLR",
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

                        //console.log(i)
                        //console.log(floodSliderValue)
                        //console.log(e.opacity)
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

                // Create the event's callback functions
                function updateTimeOfDay(ev) {
                    var select = ev.target;
                    var date = select.options[select.selectedIndex].value;

                    view.environment.lighting.date = new Date(date);
                }

                function updateDirectShadows(ev) {
                    view.environment.lighting.directShadowsEnabled = !!ev.target.checked;
                }    
            },
        });
    });
