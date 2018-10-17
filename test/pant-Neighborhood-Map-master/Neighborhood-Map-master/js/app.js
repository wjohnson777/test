'use strict';

var map;

/*----Map ViewModel----*/
function MapViewModel (){
    /*Declare global infoWindow object to close an inactive infowindow automatically -
        (as per Google Maps best practices - https://developers.google.com/maps/documentation/javascript/infowindows) */
    var infoWindow = new google.maps.InfoWindow();
    /*Marker animation controller*/
    var markerAnim = null;
    
    /*--Trail location object constructor--*/
    function Trail(obj) {
        var self = this;
        self.title = obj.title;
        self.latitude = obj.location.lat;
        self.longitude = obj.location.lng;
        self.distance = obj.distance;
        self.fourSquareVenueId = obj.fsVenueId;
        self.fourSquareContent = null;
        
        /*FourSquare URL Maker*/
        var fourSquareURL = "https://api.foursquare.com/v2/venues/"+self.fourSquareVenueId+"?&client_id=PUG4F3ZBQON10GMS2DNSFKTTPREXDREPPDMMHOEWIFUW2DG1&client_secret=NJJCQJT52QU5BXQU4SPJGWY2M5BBJMYBSU1JHAKZFDMBNA1G&v=20161219"
        /*--Create map marker--*/
        /*--Default icon for a trail listing on the map--*/
        var defaultIcon = makeMarkerIcon('e74c3c');
        /*--Highlighted icon on mouse hover--*/
        var highlightedIcon = makeMarkerIcon('f1c40f');

        self.trailMarker = new google.maps.Marker({
            title: self.title,
            position: {lat: self.latitude, lng: self.longitude},
            map: map,
            icon: defaultIcon
        });
        
        function makeMarkerIcon(markerColor) {
            var markerImage = new google.maps.MarkerImage(
                'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
                '|40|_|%E2%80%A2',
                new google.maps.Size(21, 34),
                new google.maps.Point(0, 0),
                new google.maps.Point(10, 34),
                new google.maps.Size(21,34));
            return markerImage;
        }
        /*Mouse-events handlers for a trail marker*/
        self.trailMarker.addListener('mouseover', function() {
            this.setIcon(highlightedIcon);
        });
        self.trailMarker.addListener('mouseout', function() {
            this.setIcon(defaultIcon);
        });
        
        Trail.prototype.markerAnim === null;
        
        /*Pan to the clicked trail marker*/
        self.panToLoc = function (){
            map.panTo({lat: self.latitude, lng: self.longitude});
        };
                
        /*Click handler for a trail marker*/
        self.trailMarker.addListener('click', function() {
            self.panToLoc();
            self.populateInfoWindow(self.trailMarker, infoWindow);
            
         });

        /*--Populate info window with marker information--*/
        self.populateInfoWindow = function(marker, infoWindow) {
          /* Check to make sure the infowindow is not already opened on this marker.*/
          if (infoWindow.marker != marker) {
              infoWindow.marker = marker;
              if (markerAnim) {
                    if(markerAnim != marker){
                        markerAnim.setAnimation(null);
                    }        
              }
              /*Add bounce Animation*/
              marker.setAnimation(google.maps.Animation.BOUNCE);
              markerAnim = marker;
              
              /*Build initial content for this trail marker*/
              var contentString = '<h2 class="trail-title">' + self.title + '</h2>' + '<p class="trail-distance">Distance: ' + self.distance +'</p>';
              
              /*Set content to initial content*/
              infoWindow.setContent(contentString);
              
                            
              /*-------Load FourSquare content-------*/
              
              /*First check to see if there exists any FourSquare content for this trail marker*/
              if (!self.fourSquareContent) {
                  var initialContent = infoWindow.getContent();
                  var loadingMsg =  initialContent + '<div id="foursquarePhotos"><h3>Loading photos...</h3></div>';
                  infoWindow.setContent(loadingMsg);
                  $.ajax({
                      url: fourSquareURL,
                      dataType: 'json',
                      success: function (data) {
                          /*Remove loading message for FourSquare content*/
                          infoWindow.setContent(initialContent);
                          /*Build content for FourSquare content*/
                          var content = initialContent + '<div id="foursquarePhotos">';
                          content += '<p>FourSquare Photos</p>';
                          /*FourSquare photos for respective trail*/
                          var photos = data.response.venue.photos.groups[0].items;
                          /*Get FourSquare page URL for respective trail*/
                          var fourSquareURL = data.response.venue.canonicalUrl;
                          /*Loop through trailPhotos array and get first 4 photos, and link each photo to respective FS URL*/
                          for (var i =0; i < 4; i++){
                                content += '<div class="fsphoto"><a target="_blank" href="'+fourSquareURL+'"><img src="' + photos[i].prefix + '40x40' +photos[i].suffix + '"></a></div>';
                          }
                          content += '</div>'
                          infoWindow.setContent(content);
                      },
                      /*Error handler*/
                      error: function () {
                          var errorMessage = '<h3>Error loading FourSquare data : Failed!</h3>';
                          infoWindow.setContent(errorMessage);
                      }
                      
                  });
                  
              }

              /* Make sure the marker property is cleared if the infowindow is closed.*/
              infoWindow.addListener('closeclick', function() {
                  infoWindow.marker = null;
                  marker.setAnimation(null);
              });

               /*--Display info window for a correct trail marker--*/
              infoWindow.open(map, marker);

          }
        };
    }
    
  /*---------------------------------------------------------------------------------------------------------------------------*/  

    /*--Knockout implementation--*/
    var self = this;
    self.trails = ko.observableArray([]);
    self.searchFilter = ko.observable('');
    self.isVisible = ko.observable(false);
    
    
    /*Trails listing - Create array of trails using locations data and loop through the trails and display all of them*/
    function displayTrailsListings(data) {
      /*Create a new trail var*/
        var trail;
        /*Create a new blank array for all the trails markers.*/
        var trailListings = [];
        var bounds = new google.maps.LatLngBounds();
        for(var i = 0; i < data.length; i++){
            trail = new Trail(data[i]);
            trailListings.push(trail);
            /*Extend the boundaries of the map for each trail marker and display it*/
            bounds.extend(trail.trailMarker.position);
        }
        /*Update trails for KO observable array*/
        self.trails(trailListings);
        /*Set the viewport to contain the given bounds(all trail markers).*/
        map.fitBounds(bounds);
        /*Add responsiveness - Resize map whenever window is resized*/
        google.maps.event.addDomListener(window, 'resize', function() {
            map.fitBounds(bounds);
        }); 
    }
    /*Filter through the trails listing and return matched search query*/
    self.searchResults = ko.computed(function () {
        var matchedTrails = [];
        /*Build search query*/
        var searchQuery = new RegExp(self.searchFilter(), 'i');
        /*Loop through all the trails and if there is a match with search query store it in matchedTrails*/
        for (var i = 0; i < self.trails().length; i++) {
            if(self.trails()[i].title.search(searchQuery) !== -1) {
                matchedTrails.push(self.trails()[i]);
                self.trails()[i].trailMarker.setVisible(true);
                self.trails()[i].panToLoc();
            } else {
                self.trails()[i].trailMarker.setVisible(false);
                infoWindow.close();
            }
        }
        return matchedTrails;

    });
    
    /*Display all trails markers on the map*/
    displayTrailsListings(locationsData);
    
    /*Clicking a list item invokes this function to display corresponding trail marker on the map*/
    self.onClick = function (trail){
        trail.panToLoc();
        trail.populateInfoWindow(trail.trailMarker, infoWindow);
         if (window.innerWidth < 1024) {
            self.isVisible(false);
        }

    };
    
    /*Display toggler for the list*/
    self.toggleDisplay = function() {
        self.isVisible(!self.isVisible());
    };

}

/*Initialize Map*/
function initMap() {
  /*Create a new map to display San Diego */
  var sanDiego = {lat: 32.7157, lng: -117.1611};
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 14,
    center: sanDiego,
    mapTypeControl: false
  });

  /*Apply knockout bindings*/  
  ko.applyBindings(new MapViewModel());
}
/*Error handler for map */
function errorOnLoad() {
    alert('Loading Google Maps API : Failed!');
}