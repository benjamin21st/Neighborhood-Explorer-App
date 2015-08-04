$(function(){
  // Cache a global lat, lng so that they can be used by all view functions;
  var glat, glng;

  // Create global variable gMarkers to store all markers created
  var gMarkers = [];

  // Create global variable activeMarker to bind marker with a listItem
  var activeMarker;

  // views
  function MapViewModel() {
    var self = this;

    self.mapCanvas = document.getElementById('map-canvas');
    self.defaultLatLng = new google.maps.LatLng(-25.363882,131.044922);
    self.defaultOptions = {
      center: self.defaultLatLng,
      zoom: 4
    };

    self.map = new google.maps.Map(self.mapCanvas, self.defaultOptions);

    self.marker = new google.maps.Marker({
      position: self.myLatlng,
      map: self.map,
      title: 'Starting point of your wonderful journey'
    });

    self.markers = gMarkers;

    self.addressInput = document.getElementById('address-search');

    self.searchBox = new google.maps.places.SearchBox((self.addressInput));

    // A clear Marker function that clears all markers currently on the map
    self.clearMarkers = function () {
      // first remove all markers
      for (var i = 0; i < gMarkers.length; i++) {
        gMarkers[i].setMap(null);
      }

      // Then clear up the gMarkers global variable
      gMarkers = [];
      self.markers = gMarkers;
    };

    // Add event listener to search box,
    // When there is a new search, clear exsiting markers
    google.maps.event.addListener(self.searchBox, 'places_changed', function () {
      // Clear existing markers on the map
      self.clearMarkers();
      // Change "open now" to false
      listView.filterOpenedPlacesOnly(false);

      var places = self.searchBox.getPlaces();

      if (places.length === 0) {
        return;
      }
      for (var i = 0, marker; i < self.markers.length; i++) {
        marker = self.markers[i];
        marker.setMap(null);
      }

      // For each place, get the icon, place name, and location
      self.markers = [];
      var bounds = new google.maps.LatLngBounds();
      for (var j = 0, place, image; j < places.length; j++) {
        place = places[j];

        // Create a marker for each place
        marker = new google.maps.Marker({
          map: self.map,
          title: place.name,
          position: place.geometry.location
        });

        self.markers.push(marker);

        // Meanwhile, if this is the first in the array, set its location value to the global glat, glng
        if (j === 0) {
          glat = marker.position.lat();
          glng = marker.position.lng();
        }

        bounds.extend(place.geometry.location);
      }

      self.map.fitBounds(bounds);
    });
    // Bias the SearchBox results towards places that are within the bounds of the
    // current map's viewport.
    google.maps.event.addListener(self.map, 'bounds_changed', function() {
      var bounds = self.map.getBounds();
      self.searchBox.setBounds(bounds);
    });
  }


  function FourSquareListViewModel() {
    // Using the FourSquare Api to get a list of fun places to hang out in this neighborhood.
    var self = this;

    // I know it's a bad idea to store id and secrets in front end code, will never do this in a production environment
    var client_id = "JAUTTNQVMTOSQQNZTECBTMKH1RZ0KMJEPYX4QSMAR5XNFAPG",
        client_secret = "3QIH4R0RP4LFUWVDIX1MFDWADNJOS10L21CWXTPFI2H3O31K",
        version,
        today,
        $checkPlacesButton = $('#check-places');

    today = new Date();
    month = (today.getMonth() + 1);
    day = (today.getDate());
    // The two tertiary operator checks to see if we need to add a "0" before the single digit
    version = String(today.getFullYear()) + String(month > 10 ? month : "0" + month) + String( day > 10 ? day : "0" + day );

    // Bind with Knockout stuff
    self.locationFourSquareData = ko.observable();
    self.alertText = ko.observable();
    self.filterOpenedPlacesOnly = ko.observable(false);

    // Define listData which will later be retrieved from an api call
    self.listData = {};

    self.getData = function () {
      // If global lat and lng are missing, ask user to enter a search first for their location of interest
      if (!glat || !glng) {
        self.alertText('Please enter your search first');
        $('.alert.modal').modal('show');
        return false;
      }

      // Construct a url for foursquare api call
      var url = 'https://api.foursquare.com/v2/venues/explore?ll=' + glat + ',' + glng + '&client_id=' + client_id + '&client_secret=' + client_secret + '&v=' + version + '&limit=10';

      // Add the loading state of the button
      $checkPlacesButton.addClass('loading');

      // Make API call
      $.get(url, function (data) {
        // Store data for later access
        self.listData = data.response.groups[0];
        // Then we can forEach in listData.items
        self.locationFourSquareData(self.listData);
        // Remove the loading state of the button
        $checkPlacesButton.removeClass('loading');
        // Enable the list toggle button for mobile devices
        $('.list-container .show-places').removeClass('mobile-hidden');
        // Then make the accordion working as expected
        $('.places-list.accordion').accordion();
        // Show filter group
        $('.filter-group').removeClass('hidden');

        return self.placeMarkers(self.listData.items);
      }).
      fail(function () {
        // if request fails, pop up a warning
        self.alertText('There was an error when requesting your data, please try again later.');
        $('.alert.modal').modal('show');
        $checkPlacesButton.removeClass('loading');

        return false;
      });
    };

    self.placeMarkers = function (listData) {
      // Place markers for the places that are successfully retrieved
      var places = listData,
          name,
          lat, lng,
          iconUrl,
          bounds,
          item;

      // Clear markers before placing new ones
      mapView.clearMarkers();

      // Define bounds to be extended later
      bounds = new google.maps.LatLngBounds();

      for (var i = 0; i < places.length; i++) {
        name = places[i].venue.name;
        lat = places[i].venue.location.lat;
        lng = places[i].venue.location.lng;
        geoLocation = new google.maps.LatLng(lat, lng);

        // Create a marker for each place
        marker = new google.maps.Marker({
          map: mapView.map,
          title: name,
          position: geoLocation
        });

        // Adjust bounds to include all results shown
        gMarkers.push(marker);
        bounds.extend(geoLocation);
        mapView.map.fitBounds(bounds);

        // Add click event listener to marker, when clicked, it shows details of that specific location in the list view
        google.maps.event.addListener(marker, 'click', (function (marker, i) {
          return function() {
            // Highlight the currently active marker
            activeMarker = marker;
            self.highlightMarker();

            // When this marker is clicked, show more info about this location
            self.showListItemDetails(i);
          };
        })(marker, i));
      }
    };

    // A clear list View function to hide the listView when there is a new search
    self.resetSearch = function () {
      // Meanwhile, reset the list data
      self.locationFourSquareData({items: []});
      $('.filter-group').addClass('hidden');
      $('#check-places').removeClass('loading');
    };

    self.showListItemDetails = function (index) {
      // Open the details pane for that specific item
      $('.places-list.accordion').accordion('open', index);
    };

    self.highlightMarker = function (listItem) {
      // body...
      var thisListItem = listItem,
          index;

      // First reset all highlighted colors
      for (var i = 0; i < gMarkers.length; i++) {
        if (gMarkers[i].getAnimation()) {
          gMarkers[i].setAnimation(null);
        }
      }

      // When this function is called from the DOM
      // Match the list item with a new marker
      // It should be the same nth in the gMarkers array
      if (thisListItem) {
        index = self.listData.items.indexOf(thisListItem);
        activeMarker = gMarkers[index];
      }

      // Add a nice little bouncing animation to the marker selected so that user know which one they just clicked
      activeMarker.setAnimation(google.maps.Animation.BOUNCE);
    };

    self.showFunPlaces = function () {
      $('.list-container .places-list').removeClass('mobile-hidden');
      $('.list-container .hide-places').removeClass('mobile-hidden');
      $('.list-container .show-places').addClass('mobile-hidden');
    };

    self.hideFunPlaces = function () {
      $('.list-container .places-list').addClass('mobile-hidden');
      $('.list-container .hide-places').addClass('mobile-hidden');
      $('.list-container .show-places').removeClass('mobile-hidden');
    };

    self.showOpenedPlacesOnly = function () {
      // When the "show opened places only" toggle is checked, grab the opened places and load this new data as new list
      var newData = {},
          openedPlacesList,
          isOpen;

      if (self.filterOpenedPlacesOnly()) {
        openedPlacesList = [];

        self.listData.items.forEach(function (place) {
          if (place.venue.hours) {
            isOpen = place.venue.hours.isOpen;
          } else {
            // Set isOpen to false by default
            isOpen = false;
          }

          if (isOpen) {
            openedPlacesList.push(place);
          }
        });

        if (openedPlacesList.length === 0) {
          alert("There are no places open in this area, please try again in a few hours or try another place.");
          return false;
        }

        newData = {
          type: self.listData.type,
          name: self.listData.name,
          items: openedPlacesList
        };
        // Load this new data back to the list view
        self.locationFourSquareData(newData);
        // And re-place the markers
        self.placeMarkers(openedPlacesList);
        // Show the newly updated list
        $('.list-container .show-places').removeClass('mobile-hidden');
        // Then make the accordion working as expected
        // $('.places-list.accordion').accordion();

      } else {
        // Load this new data back to the list view
        self.locationFourSquareData(self.listData);
        // And re-place the markers
        self.placeMarkers(self.listData.items);
        // Show the newly updated list
        $('.list-container .show-places').removeClass('mobile-hidden');
        // Then make the accordion working as expected
        // $('.places-list.accordion').accordion();
      }
      return true;
    };
  }


  // start application
  var mapView = new MapViewModel();
  var listView = new FourSquareListViewModel();

  // Apply bindings to the listView to take advantage of Knockout JS's nice little features.
  ko.applyBindings(listView);

});
