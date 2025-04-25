// Dynamically determine the socket.io server URL based on hostname
const getServerUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000';  // Use HTTP for localhost
  } else {
    return 'https://nckh-1-c67b.onrender.com';  // Use production server otherwise
  }
};

// Initialize socket connection with the appropriate URL
const socket = io(getServerUrl());

// Optional: Log connection information
console.log(`Socket.IO connecting to: ${getServerUrl()}`);

// Optional: Add event listeners for connection status
socket.on('connect', () => {
  console.log('Connected to server successfully');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

function initAutocomplete() {
  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 21.027763, lng: 105.834160 },
    zoom: 13,
    mapTypeId: "roadmap",
  });
  // Create the search box and link it to the UI element.
  const input = document.getElementById("pac-input");
  const searchBox = new google.maps.places.SearchBox(input);
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);
  // Bias the SearchBox results towards current map's viewport.
  map.addListener("bounds_changed", () => {
    searchBox.setBounds(map.getBounds());
  });
  let markers = [];
  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
  searchBox.addListener("places_changed", () => {
    const places = searchBox.getPlaces();

    if (places.length == 0) {
      return;
    }
    // Clear out the old markers.
    markers.forEach((marker) => {
      marker.setMap(null);
    });
    markers = [];
    // For each place, get the icon, name and location.
    const bounds = new google.maps.LatLngBounds();
    places.forEach((place) => {
      if (!place.geometry) {
        console.log("Returned place contains no geometry");
        return;
      }
      const icon = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25),
      };
      // Create a marker for each place.
      markers.push(
        new google.maps.Marker({
          map,
          icon,
          title: place.name,
          position: place.geometry.location,
        })
      );

      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    map.fitBounds(bounds);
  });
const trafficmap = document.getElementById("trafficmap");
trafficmap.addEventListener("click", () => {
  const trafficLayer = new google.maps.TrafficLayer();
  trafficLayer.setMap(map);
});
const cameras = document.getElementById("cameras");
cameras.addEventListener("click", () => {
  setMarkers(map);});
  
}
const camaras = [
  ["lê hồng phong",20.830276, 106.721581,18.13],
  ["Bùi Viện",20.828569, 106.720807,18.13],
  ["ngã tư sở",21.0042554,105.8184733,20.19]
];
 function setMarkers(map) {                                               
      // Adds markers to the map.
      // Marker sizes are expressed as a Size of X,Y where the origin of the image
      // (0,0) is located in the top left of the image.
      // Origins, anchor positions and coordinates of the marker increase in the X
      // direction to the right and in the Y direction down.
      const image = {
        url:
          "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png",
        // This marker is 20 pixels wide by 32 pixels high.
        size: new google.maps.Size(60, 82),
        // The origin for this image is (0, 0).
        origin: new google.maps.Point(0, 0),
        // The anchor for this image is the base of the flagpole at (0, 32).
        anchor: new google.maps.Point(0, 32),
      };
      // Shapes define the clickable region of the icon. The type defines an HTML
      // <area> element 'poly' which traces out a polygon as a series of X,Y points.
      // The final coordinate closes the poly by connecting to the first coordinate.
      const shape = {
        coords: [1, 1, 1, 20, 18, 20, 18, 1],
        type: "poly",
      };
    
      for (let i = 0; i < camaras.length; i++) {
        const camara = camaras[i];
        const marker1 = new google.maps.Marker({
          position: { lat: camara[1], lng: camara[2] },
          map,
          icon: image,
          shape: shape,
          title: camara[0],
          zIndex: camara[3],
        });
        google.maps.event.addListener(marker1, "click", function (lat,lng) {
          lat=camara[1];
          lng=camara[2];
          if(lat==20.830276&lng==106.721581){
           
            $(document).ready(function(){
              $("#video").show();});
          }
          if(lat==20.828569&lng==106.720807){  
            $(document).ready(function(){
              $("#video1").show();}); 
        }
        if(lat==21.0042554&lng==105.8184733){
          document.getElementById('video2').style.display='block'
        }
      });
      }
      infowindow.open(map);
    }
$(document).ready(function(){
  $("#video").hide();
  $("#video1").hide();
  $("#video2").hide();
  $("#canvas").click(()=>{
    $(".cam").removeClass("cam");
    $("canvas").removeClass("cameras");
    $(".cam").addClass("fixcam");
    $("canvas").addClass("fixcamera");
  });
  $(".close").click(()=>{;
    $("#video2").addClass("cam");
    $("canvas").addClass("cameras");
    $(".cam").removeClass("fixcam");
    $("canvas").removeClass("fixcamera")

  })
})
