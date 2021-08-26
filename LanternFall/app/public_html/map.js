
if (sessionStorage.getItem("username") != null) {

  let username = sessionStorage.getItem("username");

  fetch(`/history?username=${username}`).then(function (response) {
    return response.json();
  }).then(function (data) {

    const map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: 0, lng: 0 },
      zoom: 5,
    });

  const locationButton = document.createElement("button");
  locationButton.textContent = "Pan to Current Location";
  locationButton.classList.add("custom-map-control-button");
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);
  locationButton.addEventListener("click", () => {
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          map.setCenter(pos);
        },
        () => {
          let infoWindow = new google.maps.InfoWindow();
          handleLocationError(true, infoWindow, map.getCenter());
        }
      );
    } else {
      // Browser doesn't support Geolocation
      let infoWindow = new google.maps.InfoWindow();
      handleLocationError(false, infoWindow, map.getCenter());
    }
  });

  for (let x = 0; x < data.info.length; x++) {
    infoWindow = new google.maps.InfoWindow();
    
    const marker = new google.maps.Marker({
      position: { lat: data.info[x].loc_lat, lng: data.info[x].loc_lon},
      map,
      title: `${username} killed ${data.info[x].nickname}, date: ${data.info[x].date.substring(0, 10)}`
    });

    marker.addListener("click", () => {
      infoWindow.close();
      infoWindow.setContent(marker.getTitle());
      infoWindow.open(marker.getMap(), marker);
    });
  }

    
  })
  .catch(function (error) {
    console.error(error);
  });

}

else {
  location.href = "index.html";
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);
}

let button = document.getElementById("kill-button");
button.addEventListener("click", function () {
  location.href = "/kill.html";
});

// documentation for showing current location: https://developers.google.com/maps/documentation/javascript/geolocation
// documentation for dropping a pin/marker: https://developers.google.com/maps/documentation/javascript/adding-a-google-map

