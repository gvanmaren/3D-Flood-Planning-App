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
    "esri/WebScene",
    "esri/views/SceneView",
    "esri/layers/SceneLayer",
    "esri/layers/TileLayer",
    "esri/layers/GroupLayer",
    "esri/layers/ElevationLayer",
    "esri/renderers/SimpleRenderer",
    "esri/symbols/MeshSymbol3D",
    "esri/widgets/BasemapToggle",
    "esri/widgets/Search",
    "esri/widgets/Expand"

], function (
    declare,
    html,
    dom,
    on,
    Map,
    WebScene, 
    SceneView,
    SceneLayer,
    TileLayer,
    GroupLayer,
    ElevationLayer,
    SimpleRenderer,
    MeshSymbol3D,
    BasemapToggle,
    Search,
    Expand
) {
        // temporary application settings
        // TODO: load via congif file
        var settings_demo = {
            name: "Demo Sea Level Rise Flooding",
            url: "http://awesome3d.maps.arcgis.com",                    // portal URL for config
            webscene: "ec8a197abf8b41f5b759c5c6e352f6c2",               // portal item ID of the webscene
            buildingLayerName: "Baltimore Buildings SLR",               // name of the buildng layer in the webscene
            floodlevelGroupLayerName: "Flood levels",                   // name of the buildng layer in the webscene
            level_name: "SLR_table_SLRLevel",                           // SLR level attribute (int)
            damage_name: "NOAA_SeaLevelRise_Flooding_damage",           // to fix: damage estimate attribute (float)
            OIDname: "NOAA_SeaLevelRise_Flooding_OBJECTID",             // to fix: objectid (int)
            buildingIDname: "NOAA_SeaLevelRise_Flooding_buildingID"     // to fix: building FID (string)
        };
        
        return declare(null, {

            /* contructor method so we can use this key word */
            constructor: function () {
                
            },

            /* */
            init: function () {
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

                // get settings from choice on welcome page
                this.settings = this.getSettingsFromUser();

                // load scene with portal ID
                this.scene = new WebScene({
                    portalItem: {
                        id: this.settings.webscene
                    },
                    basemap: "topo"
                });

                // Create the SceneView and Map
                view = new SceneView({
                    container: "map",
                    map: this.scene,
                    basemap: "satellite",
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

                // Add sea level rise menu and basemap toggle
                var basemapToggle = new BasemapToggle({
                    view: view,           // view that provides access to the map's 'topo' basemap
                    container: document.createElement("basemap_div"),
                    nextBasemap: "hybrid" // allows for toggling to the 'hybrid' basemap
                });

                view.ui.add("menu", "bottom-left");

                // create search widget
                var searchWidget = new Search({
                    view: view,
                    container: document.createElement("search_div")
                });

                view.ui.add([
                    {
                        component: searchWidget,
                        position: "bottom-right",
                        index: 0
                    }, {
                        component: basemapToggle,
                        position: "bottom-right",
                        index: 1
                    }
                ]);

                var _this = this

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

                    // When the building layer has loaded: find it and set the ID               
                    var buildingLayer = view.map.allLayers.find(function(l) {
                        return l.title === settings_demo.buildingLayerName;
                    });

                    buildingLayer.id = "my_buildings"

                    var floodlevelsGroupLayer = view.map.allLayers.find(function(l) {
                        return l.title === settings_demo.floodlevelGroupLayerName;
                    });

                    // When the flood level group layer has loaded: find it and set the ID  
                    floodlevelsGroupLayer.id = "my_flood_levels"

                    // set flo0d levels water renderer
                    var flood_levels = view.map.findLayerById("my_flood_levels");

                    flood_levels.layers.forEach(element => {
                        element.renderer = waterRenderer;            
                    });

                    // when buildings have loaded...
                    buildingLayer.on("layerview-create", function(e){
                        // Update building renderer and transparency.
                        highlightBuildings(buildingLayer);
                        updateBuildingOpacity(buildingLayer);
                        
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
                    view.map.findLayerById("my_flood_levels").on("layerview-create", function(e){
                        // Update water transparency
                        updateWaterOpacity();
                    }); 
                    
                }.bind(this)).otherwise(function (err) {
                    console.error(err);
                });

                // functions that are called when layers have loaded / user changes sliders
                function highlightBuildings(localLayer) {
                    //
                    var HIGHTLIGHTED = "#FF0000";
                    var NOT_HIGHTLIGHTED = "#FFFFFF";
                    // Slider value
                    var floodSliderValue = Number(dom.byId("SLRLevelSlider").value);

                    // Create the renderer and configure visual variables
                    theLayer = view.map.findLayerById("my_buildings"); 
                    theLayer.renderer = new SimpleRenderer({
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
                            field: settings_demo.level_name,
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
                    view.map.findLayerById("my_flood_levels").layers.forEach(function (e, i) {
                        e.opacity = i === floodSliderValue ? 1 : 0;

                        // console.log("counter: " + i)
                        // console.log("slider value: " + floodSliderValue)
                        // console.log("opacity: " + e.opacity)
                        // console.log("layer name: " + e.title)
                    });

                    // Update UI
                    html.set(dom.byId("SLRSliderMessage"), "Sea Level Rise : " + floodSliderValue + "ft");
                }
                
                // Update water transparency
                function updateWaterOpacity(){
                    var opacity = Number(dom.byId("waterOpacitySlider").value);
                    view.map.findLayerById("my_flood_levels").opacity = opacity;
                    html.set(dom.byId("waterOpacityMessage"), "Water Opacity: " + opacity);
                }
                
                // Update building transparency
                function updateBuildingOpacity(){
                    var opacity = Number(dom.byId("buildingOpacitySlider").value);
                    view.map.findLayerById("my_buildings").opacity = opacity;
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

            getSettingsFromUser: function (settings) {
                return settings_demo;
            }            
        });
    });
