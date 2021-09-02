
if (sessionStorage.getItem("username") != null) {

    let username = sessionStorage.getItem("username");

    fetch(`/topRecentKills`).then(function (response) {
        return response.json();
    }).then(function (data) {

        const styleMap = new google.maps.StyledMapType(
            [
                {
                    "featureType": "all",
                    "elementType": "geometry",
                    "stylers": [
                        {
                            "lightness": "0"
                        },
                        {
                            "color": "#070d06"
                        },
                        {
                            "gamma": "1.00"
                        }
                    ]
                },
                {
                    "featureType": "all",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "visibility": "on"
                        }
                    ]
                },
                {
                    "featureType": "all",
                    "elementType": "geometry.stroke",
                    "stylers": [
                        {
                            "visibility": "on"
                        },
                        {
                            "weight": "2.06"
                        }
                    ]
                },
                {
                    "featureType": "all",
                    "elementType": "labels.text.fill",
                    "stylers": [
                        {
                            "gamma": 0.01
                        },
                        {
                            "lightness": 20
                        },
                        {
                            "visibility": "on"
                        },
                        {
                            "color": "#000000"
                        }
                    ]
                },
                {
                    "featureType": "all",
                    "elementType": "labels.text.stroke",
                    "stylers": [
                        {
                            "saturation": -31
                        },
                        {
                            "lightness": -33
                        },
                        {
                            "gamma": 0.8
                        },
                        {
                            "color": "#828282"
                        }
                    ]
                },
                {
                    "featureType": "all",
                    "elementType": "labels.icon",
                    "stylers": [
                        {
                            "visibility": "off"
                        }
                    ]
                },
                {
                    "featureType": "landscape",
                    "elementType": "geometry",
                    "stylers": [
                        {
                            "lightness": 30
                        },
                        {
                            "saturation": 30
                        }
                    ]
                },
                {
                    "featureType": "poi",
                    "elementType": "geometry",
                    "stylers": [
                        {
                            "saturation": 20
                        }
                    ]
                },
                {
                    "featureType": "poi.park",
                    "elementType": "geometry",
                    "stylers": [
                        {
                            "lightness": 20
                        },
                        {
                            "saturation": -20
                        }
                    ]
                },
                {
                    "featureType": "road",
                    "elementType": "geometry",
                    "stylers": [
                        {
                            "lightness": 10
                        },
                        {
                            "saturation": -30
                        }
                    ]
                },
                {
                    "featureType": "road",
                    "elementType": "geometry.stroke",
                    "stylers": [
                        {
                            "saturation": 25
                        },
                        {
                            "lightness": 25
                        }
                    ]
                },
                {
                    "featureType": "water",
                    "elementType": "all",
                    "stylers": [
                        {
                            "lightness": -20
                        }
                    ]
                }
            ]
        )

        const map = new google.maps.Map(document.getElementById("map"), {
            disableDefaultUI: true,
            center: { lat: 39.952583, lng: -75.165222 },
            zoom: 8,
        });

        map.mapTypes.set("styled_map", styleMap);
        map.setMapTypeId("styled_map");

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
            let date = new Date(data.info[x].date);

            const marker = new google.maps.Marker({
                position: { lat: data.info[x].loc_lat, lng: data.info[x].loc_lon },
                map,
                title: `${data.info[x].username} killed ${data.info[x].nickname} on ${date.getMonth()}/${date.getDay()}/${date.getFullYear()}`
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
    anime({
        targets: ".kill-rect",
        keyframes: [
            {
                height: "100%",
                top: 0,
                left: "45%",
                width: "10%"
            },
            {
                backgroundColor: "rgb(69 69 69)",
                left: 0,
                width: "100%"
            }
        ],
        easing: "easeInOutQuint",
        duration: 1000
    })
    setTimeout(() => {
        location.href = "/kill.html";
    }, 1100);
});

sessionStorage.setItem("previousPage", "map.html");
// documentation for showing current location: https://developers.google.com/maps/documentation/javascript/geolocation
// documentation for dropping a pin/marker: https://developers.google.com/maps/documentation/javascript/adding-a-google-map

