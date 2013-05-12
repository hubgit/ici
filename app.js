var app = new function() {
  var map, titles = {}, positions = {};

  this.init = function() {
    map = L.mapbox.map("map", "hubbox.map-u557d78b");

    map
      .on("dragend", function(e) {
        var center = map.getCenter();
        $.bbq.pushState({ lat: center.lat, lon: center.lng });
        display();
      })
      .on("zoomend", function(e) {
        $.bbq.pushState({ zoom: map.getZoom() });
      });

    if ($.bbq.getState("lat") && $.bbq.getState("lon") && $.bbq.getState("zoom")) {
      return display();
    }

    if (Modernizr.geolocation) {
      navigator.geolocation.getCurrentPosition(location, null, { timeout: 10000 });
    } else {
      alert("Geolocation needed!");
    }
  };

  var location = function(pos) {
      $.bbq.pushState({
        lat: parseInt(pos.coords.latitude * 10000) / 10000,
        lon: parseInt(pos.coords.longitude * 10000) / 10000,
        zoom: 15
      });

      display();
  };

  var display = function() {
    var lat = $.bbq.getState("lat");
    var lon = $.bbq.getState("lon");
    var zoom = $.bbq.getState("zoom");

    map.setView([lat, lon], zoom);

    var pos = lat + ":" + lon;

    if (!positions[pos]) {
      positions[pos] = true;
      fetch(lon, lat);
    }
  };

  var fetch = function(lon, lat) {
    var options = {
      limit: 20,
      radius: 5000,
      images: true,
      summaries: true
    };

    geojson([lon, lat], options, displayResults);
  };

  var displayResults = function(results) {
    $.each(results.features, displayResult);
  };

  var displayResult = function(index, article) {
    var title = article.properties.name;

    if (!titles[title]) {
      titles[title] = true;
      addMarker(article);
    }
  };

  var addMarker = function(article) {
    if (!article.geometry || !article.geometry.coordinates) {
      return;
    }

    var coords = article.geometry.coordinates;
    var hasImage = article.properties.image;

    var marker = L.marker([coords[1], coords[0]], {
      title: article.properties.name,
      icon: L.AwesomeMarkers.icon({
        icon: hasImage ? "book" : "icon-camera-retro",
        color: hasImage ? "blue" : "red"
      })
    });

    marker.addTo(map);
    attachPopup(marker, article, 500);
  };

  var attachPopup = function(marker, article, maxLength) {
    var popup = $("<div/>").addClass("summary");
    $("<a/>", { target: "_new", href: article.id, text: article.properties.name }).appendTo(popup);

    var summary = article.properties.summary;
    $("<div/>", { html: summary.length > maxLength ? summary.substring(0, maxLength) + "…" : summary }).appendTo(popup);

    marker.bindPopup(popup.html());
  };
};
