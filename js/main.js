var token = 'pk.eyJ1IjoibWp1b3BwZXJpIiwiYSI6Imk1WGZtdlEifQ.ZlnVLTU08a_BPDFf4A8pNA';

var currentLocation = [60.260, 24.805];

function createMap() {
    var layer = L.tileLayer('http://api.tiles.mapbox.com/v4/mjuopperi.cc767e91/{z}/{x}/{y}.png?access_token=' + token, {
        attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
    });
    return L.map('map').addLayer(layer).setView(currentLocation, 13);
}

$(function() {

    var weatherIcon = L.MakiMarkers.icon({icon: "marker", color: "#03a9f4", size: "m"});
    var imageIcon = L.MakiMarkers.icon({icon: "camera", color: "#b0b", size: "m"});

    function searchLocation(query) {
        $.ajax({
            dataType: 'json',
            type: 'GET',
            url: 'http://api.geonames.org/searchJSON?q=' + query + '&maxRows=1&username=mjuopperi'
        }).done(function(locationData) {
            if (locationData.geonames.length > 0) {
                var location = locationData.geonames[0];
                setCoordinates([location.lat, location.lng])
            }
        })
    }

    function setCoordinates(coords) {
        currentLocation = coords;
        map.panTo(coords);
    }

    function getWeatherData(coords) {
        var url = 'http://api.geonames.org/weatherJSON' +
            '?north=' + coords.getNorth() +
            '&south=' + coords.getSouth() +
            '&east=' + coords.getEast() +
            '&west=' + coords.getWest() +
            '&maxRows=20' +
            '&username=mjuopperi';
        $.ajax({
            dataType: 'json',
            type: 'GET',
            url: url
        }).done(function(weatherInfo) {
            weatherMarkers.clearLayers();
            weatherInfo.weatherObservations.forEach(placeWeatherMarker)
        })
    }

    function placeWeatherMarker(weatherInfo) {
        var marker = L.marker([weatherInfo.lat, weatherInfo.lng], {icon: weatherIcon}).addTo(weatherMarkers);
        marker.bindPopup('<b>' + weatherInfo.stationName + '</b><br>' + weatherInfo.temperature + ' °C, ' + weatherInfo.clouds);
    }

    function placeImageMarker(photo) {
        var marker = L.marker([photo.latitude, photo.longitude], {icon: imageIcon}).addTo(imageMarkers);
        marker.bindPopup('<b>' + photo.photo_title + '</b><br>' + photo.upload_date);
    }

    function addImage(url) {
        var image = $('<img>', { src: url}).appendTo(imageContainer);
        if (image.is(':first-child')) visibleImage = image;
        else image.hide();
        return image
    }

    function showImage(image) {
        visibleImage.hide();
        image.show();
        visibleImage = image;
    }

    function showNextImage() {
        if (typeof visibleImage !== 'undefined') {
            if (visibleImage.next().is('img')) showImage(visibleImage.next())
            else showImage(imageContainer.children().first())
        }
    }

    function showPrevImage() {
        if (typeof visibleImage !== 'undefined') {
            if (visibleImage.prev().is('img')) showImage(visibleImage.prev())
            else showImage(imageContainer.children().last())
        }
    }

    function clearImages() {
        imageContainer.empty();
    }

    function toUrl(photo) {
        return photo.photo_file_url;
    }

    function getImagesByLocation(location) {
        var url = 'http://www.panoramio.com/map/get_panoramas.php?set=public&from=0&to=20' +
            '&minx=' + location.getWest() +
            '&miny=' + location.getSouth() +
            '&maxx=' + location.getEast() +
            '&maxy=' + location.getNorth() +
            '&size=medium' +
            '&mapfilter=true' +
            '&callback=?';
        $.getJSON(url, function(data) {
            clearImages();
            imageMarkers.clearLayers();
            data.photos.forEach(placeImageMarker);
            $.map(data.photos, toUrl).forEach(addImage)
        })
    }

    function getImagesInBounds() { getImagesByLocation(map.getBounds()) }

    function panToImageLocation() {
        var marker = imageMarkers.getLayers()[visibleImage.index()];
        setCoordinates(marker._latlng);
        marker.openPopup();
    }

    var map = createMap();
    var weatherMarkers = new L.FeatureGroup();
    map.addLayer(weatherMarkers);
    var imageMarkers = new L.FeatureGroup();
    map.addLayer(imageMarkers);

    var imageContainer = $('#imageContainer');
    var visibleImage;
    getImagesByLocation(map.getBounds());

    $('#next-image').click(showNextImage);
    $('#prev-image').click(showPrevImage);

    $('#location-search').submit(function(event) {
        var location = $('#location').val();
        searchLocation(location);
        event.preventDefault();
    });

    $('#get-images').click(getImagesInBounds);
    $('#pan-to-image').click(panToImageLocation);

    // Update weather markers on pan and zoom
    map.on('moveend', function() {
        getWeatherData(map.getBounds());
    });

});
