	    BASEPATH = "http://webviewer-api.navionics.com/"; 
		BASEMAP = BASEPATH + "getmap";
		OpenLayers.ProxyHost = "http://openlayers.org/dev/examples/proxy.cgi?url=";
		var measureControls;
		var map = null;
        var wms_layer = null;
        var maxOpacity = 0.9;
        var minOpacity = 0.1;
		key = 'Navionics_webapi_00127';
		//for bing maps
		var apiKey = "AqTGBsziZHIJYYxgivLBf0hVdrAk9mWO5cQcb8Yux8sW5M8c8opEC2lZqKR1ZZXf";

		geocoder = new google.maps.Geocoder();
       /////////Layer Creation Section///////////////////
			var google_hybrid = new OpenLayers.Layer.Google(
				"Google Hybrid",
				{type: google.maps.MapTypeId.HYBRID}
				);

		 
			var navionicsOverlay = new NavionicsLayer("NAVIONICS WMS overlay",
				BASEMAP + "?", { transparent: false }, { 
									isBaseLayer: false,
									visibility: false,
									visible: false,
									navkey: 'Navionics_webapi_00127'
							   });

		///Create test layer
			var test = new OpenLayers.Layer.Vector('Test');
			
			
		//// Create station layer
		var stations = new OpenLayers.Layer.Vector.OWMStations("Stations");
    
		//// Create weather layer 
		var city = new OpenLayers.Layer.Vector.OWMWeather("Weather");
		
        //Bing Maps Layer
        var road = new OpenLayers.Layer.Bing({
            name: "Bing Maps",
            key: apiKey,
            type: "Road"
        });
		var vector_layer = new OpenLayers.Layer.Vector('Editable Vectors');
			
                map = new OpenLayers.Map( 'map', {
                    controls: [
						new OpenLayers.Control.Navigation({}),
                        new OpenLayers.Control.PanZoom(),
                        new OpenLayers.Control.LayerSwitcher(),
						new OpenLayers.Control.Permalink(),
						new OpenLayers.Control.MousePosition({}),
						new OpenLayers.Control.ScaleLine(),
						new OpenLayers.Control.OverviewMap(),
						new OpenLayers.Control.KeyboardDefaults()
						
                    ]
                });
				
			////Feature info/////
			
			
        info = new OpenLayers.Control.WMSGetFeatureInfo({
            url: 'http://webviewer-api.navionics.com/getmap?navkey=Navionics_webapi_00127', 
            title: 'Identify features by clicking',
            queryVisible: true,
            eventListeners: {
                getfeatureinfo: function(event) {
                    map.addPopup(new OpenLayers.Popup.FramedCloud(
                        "chicken", 
                        map.getLonLatFromPixel(event.xy),
                        null,
                        event.text,
                        null,
                        true
                    ));
                }
            }
           });
		map.addControl(info);
        info.activate();
        

        var lakes = new OpenLayers.Layer.WMS(

        "Lakes",

        "http://localhost:8088/geoserver/wms",

            {layers: 'govhack2014:lakes'});
        
				//Add a vector editing control
			map.addControl(new OpenLayers.Control.EditingToolbar(vector_layer));
            
			map.addLayers([google_hybrid,vector_layer,navionicsOverlay,stations,city,road,lakes]);
			selectControl = new OpenLayers.Control.SelectFeature(stations);
			map.addControl(selectControl);
			selectControl.activate();
					
			if(!map.getCenter()){
						map.zoomToMaxExtent();
				 }
				 
				 
///////////////////Opacity Slider Function/////////////////
 function changeOpacity(byOpacity) {
            var newOpacity = (parseFloat(OpenLayers.Util.getElement('opacity').value) + byOpacity).toFixed(1);
            newOpacity = Math.min(maxOpacity,
                                  Math.max(minOpacity, newOpacity));
            OpenLayers.Util.getElement('opacity').value = newOpacity;
            wms_layer.setOpacity(newOpacity);
			}
			    
////////////////////Measurement Functions//////////////////
				
            // style the sketch fancy
            var sketchSymbolizers = {
                "Point": {
                    pointRadius: 4,
                    graphicName: "square",
                    fillColor: "white",
                    fillOpacity: 1,
                    strokeWidth: 1,
                    strokeOpacity: 1,
                    strokeColor: "#333333"
                },
                "Line": {
                    strokeWidth: 3,
                    strokeOpacity: 1,
                    strokeColor: "#666666",
                    strokeDashstyle: "dash"
                },
                "Polygon": {
                    strokeWidth: 2,
                    strokeOpacity: 1,
                    strokeColor: "#666666",
                    fillColor: "white",
                    fillOpacity: 0.3
                }
            };
            var style = new OpenLayers.Style();
            style.addRules([
                new OpenLayers.Rule({symbolizer: sketchSymbolizers})
            ]);
            var styleMap = new OpenLayers.StyleMap({"default": style});
            
            // allow testing of specific renderers via "?renderer=Canvas", etc
            var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
            renderer = (renderer) ? [renderer] : OpenLayers.Layer.Vector.prototype.renderers;

            measureControls = {
                line: new OpenLayers.Control.Measure(
                    OpenLayers.Handler.Path, {
                        persist: true,
                        handlerOptions: {
                            layerOptions: {
                                renderers: renderer,
                                styleMap: styleMap
                            }
                        }
                    }
                ),
                polygon: new OpenLayers.Control.Measure(
                    OpenLayers.Handler.Polygon, {
                        persist: true,
                        handlerOptions: {
                            layerOptions: {
                                renderers: renderer,
                                styleMap: styleMap
                            }
                        }
                    }
                )
            };
            
            var control;
            for(var key in measureControls) {
                control = measureControls[key];
                control.events.on({
                    "measure": handleMeasurements,
                    "measurepartial": handleMeasurements
                });
                map.addControl(control);
            }
            
           
            
       document.getElementById('noneToggle').checked = true;
        
        
        function handleMeasurements(event) {
            var geometry = event.geometry;
            var units = event.units;
            var order = event.order;
            var measure = event.measure;
            var element = document.getElementById('output');
            var out = "";
            if(order == 1) {
                out += "measure: " + measure.toFixed(3) + " " + units;
            } else {
                out += "measure: " + measure.toFixed(3) + " " + units + "<sup>2</" + "sup>";
            }
            element.innerHTML = out;
        }

        function toggleControl(element) {
            for(key in measureControls) {
                var control = measureControls[key];
                if(element.value == key && element.checked) {
                    control.activate();
                } else {
                    control.deactivate();
                }
            }
        }
        
        function toggleGeodesic(element) {
            for(key in measureControls) {
                var control = measureControls[key];
                control.geodesic = element.checked;
            }
        }
        
        function toggleImmediate(element) {
            for(key in measureControls) {
                var control = measureControls[key];
                control.setImmediate(element.checked);
            }
			}
        
///////////////Measurement Functions Ended///////////////////    

//////////////GeoCoder//////////////////////////////////////

    function submitform() {
        var queryString = document.forms[0].query.value;
        codeAddress(queryString);
    }

  function codeAddress(address) {
        geocoder.geocode({ 'address': address }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                var temp = results[0].geometry.location.toString().replace("(", "").replace(")", "").trim();
                var lon = parseFloat(temp.split(",")[1].trim());
                var lat = parseFloat(temp.split(",")[0].trim());

                var fromProjection = new OpenLayers.Projection("EPSG:4326");   // Transform from WGS 1984
                var toProjection = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection
                var position = new OpenLayers.LonLat(lon, lat).transform(fromProjection, toProjection);


                map.setCenter(position, 10);
                
            } else {
                alert("Geocode was not successful for the following reason: " + status);
            }
        });
    }	

			
        
				