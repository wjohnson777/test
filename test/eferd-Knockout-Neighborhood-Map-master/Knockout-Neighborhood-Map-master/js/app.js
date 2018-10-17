// Park Model
function Park(park) {
	var self = this;

	self.park = park;

	//Park Data from Places Library
	self.name = ko.observable(park.name);
	self.address = ko.observable(park.formatted_address);
	self.website = ko.observable(park.website);
	self.rating = ko.observable(park.rating);
	self.position = ko.observable(park.geometry.location);
	self.phone = ko.computed(function() {
		if (park.formatted_phone_number) {
			return park.formatted_phone_number;
		} else {
			return "";
		}
	}, self);
	self.photo = ko.computed(function() {
		if (park.photos) {
			return park.photos[0].getUrl({'maxHeight': 50, maxWidth: 200});
		} else {
			return "";
		}
	}, self);

	//Park Marker
	var marker = new google.maps.Marker({ //create the marker
	    position: self.position(),
	});

	self.marker = ko.observable(marker);

	//Info Window Content String
	self.content = ko.computed(function() {
		var info = '<div class="gm-title">' + self.name() + '</div>'
					+ '<div class="gm-addr">' + self.address() + '</div>'
					+ '<div class="gm-site"><a href="' + self.website() + '">' + 'Visit Site' + '</a></div>'
					+ '<div>' + self.phone() + '</div>'
					+ '<img class="gm-img" src=' + '"' + self.photo() + '" />' ;
  		return info;
	}, self);
}

// ViewModel
function ViewModel() {
	var self = this;

	// Initialize a Google Map    
	var map = new google.maps.Map(document.getElementById('map'), {
			zoom: 11,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			center: {lat: 37.83493, lng: -122.12969},
	});

	self.map = map;

	//Create a list of Park objects
	self.parkList = ko.observableArray();

	// Get place data from Google Places Library
	var service = new google.maps.places.PlacesService(map);

	//Populate parkList with park model objects 
	data.parks.forEach(function(park, index) {
		var request = park.pid;
		service.getDetails(request, 
			function(place, status) {
				if (status == google.maps.places.PlacesServiceStatus.OK) {
					// Populate Park list with Park objects
					self.parkList.push( new Park(place) );
				}
			});
	});

	//Search filter
	self.filter = ko.observable("");

	//InfoWindow
	var infowindow = new google.maps.InfoWindow({maxWidth: 200});
	self.infowindow = infowindow;
	
	//display InfoWindow with content
	self.displayInfo = function(clickedItem) {
		var marker = clickedItem.marker();

		infowindow.setContent(clickedItem.content());
		infowindow.open(map, marker);
		marker.setAnimation(google.maps.Animation.BOUNCE);
    	setTimeout(function(){ marker.setAnimation(null); }, 710);
	}

	this.currentPark = ko.observable();
}

// Binding Handler for Markers
ko.bindingHandlers.marker = {

	init: function(element, valueAccessor, allBindings, viewModel, bindingContext)  {
		var marker = valueAccessor(); 		//marker reference
		var map = bindingContext.$root.map; //map reference
		var markerName = allBindings().name(); 				//park name
		var infowindow = bindingContext.$root.infowindow; 	//info window
		var content = allBindings().content();

		marker().setMap(map); 				//Add marker to the map

		//Marker Click Handler 
		google.maps.event.addListener(marker(), 'click', function() {
		    infowindow.setContent(content);
		    infowindow.open(map, this);
		    marker().setAnimation(google.maps.Animation.BOUNCE);
    		setTimeout(function(){ marker().setAnimation(null); }, 710);
	    });
	},

	update: function(element, valueAccessor, allBindings, viewModel, bindingContext)  {
		var marker = valueAccessor(); 						//marker reference
		var map = bindingContext.$root.map; 				//map reference
		var markerName = allBindings().name(); 				//park name
		var filter = bindingContext.$root.filter(); 		//user input

		// Filter Markers based on user input 
		if (markerName.toLowerCase().indexOf(filter) < 0 ) {
			marker().setMap(null);	//remove marker from view
		} else {
			marker().setMap(map); 	//replace marker
		}
	}
}

ko.applyBindings(new ViewModel()); 