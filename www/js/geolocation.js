/* Take your pick of API-based or local Map solutions */
var API_KEY = "AIzaSyBBdTd_SZqlQ-K37-2c9psnK8CFnFvGuXY"; //Google Maps: https://developers.google.com/maps/documentation/javascript/get-api-key


/* *************************************************************** *
 * UTILITIES                                                       *
 * *************************************************************** */
 
/**
 * addScript
 *   Adds a new script to the page dynamically, so it is only loaded if needed.
 *@param src  path to the JS file to load via appending of <script> tag
 */
function addScript(src) {
	var s = document.createElement("script");
 	s.setAttribute("src", src);
 	document.body.appendChild(s);
 }

/**
 * loadDoc
 *   Loads a Document (i.e. JSON or HTML) into a Text string
 *
 *@example
 *   loadDoc('data.json'); //located on same server or passed through a Proxy
 *
 *@param docURL String  a link to the Document to load
 *@return responseText
 */
function loadDoc(docURL) {
    var xhr;
    if (window.XMLHttpRequest) {
        xhr = new XMLHttpRequest(); // FireFox, Opera, Chrome, Safari
    } else {
        xhr = new ActiveXObject("Microsoft.XMLHTTP"); // Internet Explorer
    }
    xhr.open("GET", docURL, false);
	try {
		xhr.setRequestHeader("Content-type", "text/plain; charset=utf-8"); //try to force response type
	} catch(ex)	{
		console.log("ERROR loading remote data: " + ex);
	}
    xhr.send();
    return xhr.responseText;
}

/**
 * Google Maps API  - Initialize and add the map
 */
function initMap(latitude, longitude) {
alert('Inside initMap');
  // The location to show
  var coordinates = {lat: latitude, lng: longitude};
  // The map, centered at Uluru
  var map = new google.maps.Map(
      document.getElementById('map'), {zoom: 4, center: coordinates});
  // The marker, positioned at Uluru
  var marker = new google.maps.Marker({position: coordinates, map: map});
}

/**
 * showMap
 *   shows a Static Map by the Service's URL format
 */
function showMap(location, latitude, longitude) {
alert('Inside showMap');
    var alternateMessage = "";
	var mapURL = "";
	if (typeof location !== "undefined" && location !== null && location !== "") {
		var latlon = latitude + "," + longitude;
console.debug('Trying to load Static Map');
		//load a static map until the dynamic one is ready
		mapURL = "https://maps.googleapis.com/maps/api/staticmap?center="+latlon+"&zoom=14&size=400x300&sensor=false&key="+API_KEY; //Google's Maps guide: https://developers.google.com/maps/documentation/maps-static/intro
	    document.getElementById("map").innerHTML = "<img alt=\""+alternateMessage+"\" src=\""+mapURL+"\" />";
console.debug('Should have loaded Static Map: ' + mapURL);
console.debug('Trying to load Dynamic Map');
		//load a dynamic map that supports Markeres, Directions, etc
		addScript("https://maps.googleapis.com/maps/api/js?key="+API_KEY+"&callback=showMap");
		setTimeout(initMap(latitude, longitude), 3000);
console.debug('Should have loaded Dynamic Map');
		alternateMessage = "Map of '" + location + "'";
	} else {
		alternateMessage = "Unable or not allowed to find your location";
		alert(alternateMessage);
	}
}



/* *************************************************************** *
 * GeoIP                                                           *
 * *************************************************************** */
/**
 * There's no guarantee that a successful response object has any particular property, so we need to code defensively. 
 */
var onSuccessGeoIP = (function(geoipResponse) {	
	if (!geoipResponse.country.iso_code) {
		return;
	}

	//ISO country codes are in upper case
	var countryCode = geoipResponse.country.iso_code || "USA";
	var region = geoipResponse.subdivisions[0].iso_code || "CA";
	var cityName = geoipResponse.city.names.en || "San Francisco";
	var location = cityName + ", " + region + " " + countryCode;
	
	//GeoNames API - geocoding lookup
	var data = JSON.parse(loadDoc("http://api.geonames.org/searchJSON?q="+encodeURIComponent(location)+"&maxRows=10&username="+GEO_API_KEY));
	var latitude = data.geonames[0].lat;
	var longitude = data.geonames[0].lng;
	
	//still update the Map but this time falling back to GeoIP --> GeoNames (GeoLocation) --> Map
	showMap(location, latitude, longitude);	
});

/**
 * We don't really care what the error is, just show an error map placeholder image. 
 */
var onErrorGeoIP = (function(error) {	
	showMap();
});

/**
 * MaxMind-specific API call for getting GeoIP data, with success and failure handlers
 */
var fallbackGeoIP = (function() {
	geoip2.city(onSuccessGeoIP, onErrorGeoIP);
});


/* *************************************************************** *
 * Geolocation                                                     *
 * *************************************************************** */
function getLocation() {
	if (navigator.geolocation) { 
		navigator.geolocation.getCurrentPosition(showPosition, showError);
	}
}

/**
 * showPosition
 *  Triggered when a particular event happens (in this case user has loaded this page).
 */
function showPosition(position) {
	var latitude = position.coords.latitude;
	var longitude = position.coords.longitude;	
	
	console.debug("Found Geolocation of '" + latitude + ", " + longitude+"'");
	showMap("your Geolocation", latitude, longitude);
}

/**
 * showError
 *  Triggered in the case of an error performing an HTML5 Geolcation lookup.
 */
function showError(error) {
	switch(error.code) {
		case error.PERMISSION_DENIED:
			console.warn("Request for Geolocation denied by the user.");
			//fallback to GeoIP (MaxMind API)
			addScript("http://js.maxmind.com/js/apis/geoip2/v2.1/geoip2.js"); //MaxMind JS API: https://dev.maxmind.com/geoip/geoip2/javascript/
			setTimeout(fallbackGeoIP, 3000);
			break;
		case error.POSITION_UNAVAILABLE:
			console.error("Location information unavailable.");
			break;
		case error.TIMEOUT:
			console.error("Location request timed out.");
			break;
		case error.UNKNOWN_ERROR:
			console.error("UNKNOWN_ERROR.");
			break;
	}
}
