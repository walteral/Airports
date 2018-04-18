var hideLabel = function(label){ label.labelObject.style.opacity = 0;};
var showLabel = function(label){ label.labelObject.style.opacity = 1;};
var labelEngine = new labelgun.default(hideLabel, showLabel);
var labels = [];

// 18. define the coordinate reference system (CRS)
mycrs = new L.Proj.CRS('EPSG:2991',
    '+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=23 +lon_0=-96 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs' ,
    {
        resolutions: [8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1] // example zoom level resolutions
    }
);

// 1. Create a map object.

var mymap = L.map('map', {
    crs: mycrs,  // 19. assign the custom crs to the crs option. change the zoom levels due to the change of projection.
    center: [39.9, -95.47],
    zoom: 1,
    maxZoom: 14,
    minZoom: 1,
    detectRetina: true});

// 2. Add a base map.
// 20. comment off the base map, because the publicly shared base map usually cannot reprojected
// L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png').addTo(mymap);

// 3. Add cell towers GeoJSON Data
// Null variable that will hold cell tower data
var airports = null;


// 4. build up a set of colors from colorbrewer's dark2 category
var colors = ['black','red']

// 5. dynamically append style classes to this page. This style classes will be used for colorize the markers.
for (i = 0; i < 9; i++) {
    $('head').append($("<style> .marker-color-" + (i + 1).toString() + " { color: " + colors[i] + "; font-size: 15px; text-shadow: 0 0 3px #ffffff;} </style>"));
}

// Get GeoJSON and put on it on the map when it loads
airports = L.geoJson.ajax("assets/airports.geojson", {
    // assign a function to the onEachFeature parameter of the cellTowers object.
    // Then each (point) feature will bind a popup window.
    // The content of the popup window is the value of `feature.properties.company`
    onEachFeature: function (feature, layer) {
        layer.bindPopup(feature.properties.AIRPT_NAME);
    },
    pointToLayer: function (feature, latlng) {
        var id = 0;
        if (feature.properties.CNTL_TWR== "Y") { id = 0; }
        else { id = 1;}
        return L.marker(latlng, {icon: L.divIcon({className: 'fa fa-plane marker-color-' + (id + 1).toString() })});
    },
    attribution: 'Airport Map &copy; Map Cruzin | United States &copy; Oregon Explorer | Base Map &copy; CartoDB | Made By Alex Walters'
}).addTo(mymap);


// 6. Set function for color ramp
colors = chroma.scale('OrRd').colors(5); //colors = chroma.scale('OrRd').colors(5);

function setColor(density) {
    var id = 0;
    if (density > 59) { id = 4; }
    else if (density > 26 && density <= 58) { id = 3; }
    else if (density > 15 && density <= 25) { id = 2; }
    else if (density > 8 &&  density <= 14) { id = 1; }
    else  { id = 0; }
    return colors[id];
}


// 7. Set style function that sets fill color.md property equal to cell tower density
function style(feature) {
    return {
        fillColor: setColor(feature.properties.count),
        fillOpacity: 0.4,
        weight: 2,
        opacity: 1,
        color: '#b4b4b4',
        dashArray: '4'
    };
}

// 8. Add county polygons
// create counties variable, and assign null to it.
// 15. Create a label for each county.
var states = null;
states = L.geoJson.ajax("assets/us-states.geojson", {
    style: style,
    onEachFeature: function (feature, label) {
        label.bindTooltip(feature.properties.name, {className: 'feature-label', permanent:true, direction: 'center'});
        labels.push(label);
    }
}).addTo(mymap);


// 9. Create Leaflet Control Object for Legend
var legend = L.control({position: 'topright'});

// 10. Function that runs when legend is added to map
legend.onAdd = function () {

    // Create Div Element and Populate it with HTML
    var div = L.DomUtil.create('div', 'legend');
    div.innerHTML += '<b>Density of Airports</b><br />';
    div.innerHTML += '<i style="background: ' + colors[4] + '; opacity: 0.5"></i><p>59+</p>';
    div.innerHTML += '<i style="background: ' + colors[3] + '; opacity: 0.5"></i><p>26-58</p>';
    div.innerHTML += '<i style="background: ' + colors[2] + '; opacity: 0.5"></i><p>15-25</p>';
    div.innerHTML += '<i style="background: ' + colors[1] + '; opacity: 0.5"></i><p> 8-14</p>';
    div.innerHTML += '<i style="background: ' + colors[0] + '; opacity: 0.5"></i><p> 0-7</p>';
    div.innerHTML += '<i class = "fa fa-plane marker-color-1"></i><p>with control tower </p>'
    div.innerHTML += '<i class = "fa fa-plane marker-color-2"></i><p>with control tower </p>'
    // Return the Legend div containing the HTML content
    return div;
};

// 11. Add a legend to map
legend.addTo(mymap);

// 12. Add a scale bar to map
// 21. comment off the scale bar, because in same project, scalebar does not make sense.
L.control.scale({position: 'bottomleft'}).addTo(mymap);


// 13. Add a latlng graticules.
L.latlngGraticule({
    showLabel: true,
    opacity: 0.2,
    color: "#747474",
    zoomInterval: [
        {start: 1, end: 14, interval: 10},
        {start: 1, end: 11, interval: 10}
    ]
}).addTo(mymap);


// 16. create an addLabel function to dynamically update the visible labels, aiming to avoid the lable overlap.

function addLabel(layer, id) {

    // This is ugly but there is no getContainer method on the tooltip :(
    var label = layer.getTooltip()._source._tooltip._container;
    if (label) {
        // We need the bounding rectangle of the label itself
        var rect = label.getBoundingClientRect();

        // We convert the container coordinates (screen space) to Lat/lng
        var bottomLeft = mymap.containerPointToLatLng([rect.left, rect.bottom]);
        var topRight = mymap.containerPointToLatLng([rect.right, rect.top]);
        var boundingBox = {
            bottomLeft : [bottomLeft.lng, bottomLeft.lat],
            topRight   : [topRight.lng, topRight.lat]
        };

        // Ingest the label into labelgun itself
        labelEngine.ingestLabel(
            boundingBox,
            id,
            parseInt(Math.random() * (5 - 1) + 1), // Weight
            label,
            label.innerText,
            false
        );

        // If the label hasn't been added to the map already
        // add it and set the added flag to true
        if (!layer.added) {
            layer.addTo(mymap);
            layer.added = true;
        }
    }
}

// 17. We will update the visualization of the labels whenever you zoom the map.
mymap.on("zoomend", function(){
    var i = 0;
    states.eachLayer(function(label){
        addLabel(label, ++i);
    });
    labelEngine.update();
});


// 16. create an addLabel function to dynamically update the visible labels, aiming to avoid the lable overlap.

function addLabel(layer, id) {

    // This is ugly but there is no getContainer method on the tooltip :(
    var label = layer.getTooltip()._source._tooltip._container;
    if (label) {
        // We need the bounding rectangle of the label itself
        var rect = label.getBoundingClientRect();

        // We convert the container coordinates (screen space) to Lat/lng
        var bottomLeft = mymap.containerPointToLatLng([rect.left, rect.bottom]);
        var topRight = mymap.containerPointToLatLng([rect.right, rect.top]);
        var boundingBox = {
            bottomLeft : [bottomLeft.lng, bottomLeft.lat],
            topRight   : [topRight.lng, topRight.lat]
        };

        // Ingest the label into labelgun itself
        labelEngine.ingestLabel(
            boundingBox,
            id,
            parseInt(Math.random() * (5 - 1) + 1), // Weight
            label,
            label.innerText,
            false
        );

        // If the label hasn't been added to the map already
        // add it and set the added flag to true
        if (!layer.added) {
            layer.addTo(mymap);
            layer.added = true;
        }
    }
}

// 17. We will update the visualization of the labels whenever you zoom the map.
mymap.on("zoomend", function(){
    var i = 0;
    counties.eachLayer(function(label){
        addLabel(label, ++i);
    });
    labelEngine.update();
});