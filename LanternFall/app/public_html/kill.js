const IMAGE_QUALITY = 0.50;
const MAX_WIDTH = 1080;
const MAX_HEIGHT = 1080;

let token = sessionStorage.getItem("token");
let nickname = document.getElementById("kill-name");
let description = document.getElementById("description");
let image = document.getElementById("image-file");
let message = document.getElementById("message");

let latitude = null;
let longitude = null;

// https://www.w3schools.com/html/html5_geolocation.asp
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition, showError);
} else {
    message.textContent = "Geolocation is not supported by this browser";
}

async function onclick() {
    message.textContent = "";

    let formData = new FormData();
    let imageExists = "false";

    if (image.value != "") {
        // https://medium.com/swlh/boost-server-performance-with-client-side-image-compression-cdefba1c1c0d#5a44
        let uploadedImage = image.files[0];

        const inputPreview = document.createElement("img");
        inputPreview.src = URL.createObjectURL(uploadedImage);

        const {height, width} = await getImageDimensions(inputPreview);

        const widthRatioBlob = await compressImage(inputPreview, MAX_WIDTH / width, width, height);
        const heightRatioBlob = await compressImage(inputPreview, MAX_HEIGHT / height, width, height);

        const compressedBlob = widthRatioBlob.size > heightRatioBlob.size ? heightRatioBlob : widthRatioBlob;
        const optimalBlob = compressedBlob.size < uploadedImage.size ? compressedBlob : uploadedImage; 

        console.log(`Inital Size: ${uploadedImage.size}. Compressed Size: ${optimalBlob.size}`);
        formData.append("photo", optimalBlob);
        imageExists = "true";
    }

    let values = {
        token: token,
        latitude: latitude,
        longitude: longitude,
        nickname: nickname.value,
        description: description.value,
        image: imageExists 
    };
    
    formData.append("user", JSON.stringify(values)); 

    fetch("/kill", {
		method: "POST",
		body: formData
	}).then(async function (response) {
        if (response.status === 200) {
            await response.json().then(function (data) {
                message.textContent = data.success;
            });
        } else {
            await response.json().then(function (error) {
                message.textContent = error.error;
            });
        }
    })
	.catch(function (error) {
		console.log(error);
        message.textContent = "Something went wrong";
	});
}

let killButton = document.getElementById("kill-button");
killButton.addEventListener("click", onclick);

let returnButton = document.getElementById("return-button");
returnButton.addEventListener("click", function() {
    location.href = "/map.html"
});

// https://medium.com/swlh/boost-server-performance-with-client-side-image-compression-cdefba1c1c0d#5a44
function getImageDimensions(image){
    return new Promise((resolve, reject) => {
        image.onload = function(e){
            const width = this.width;
            const height = this.height;
            resolve({height, width});
        }
    });
}

// https://medium.com/swlh/boost-server-performance-with-client-side-image-compression-cdefba1c1c0d#5a44
function compressImage(image, scale, initalWidth, initalHeight){
    return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");

        canvas.width = scale * initalWidth;
        canvas.height = scale * initalHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        
        ctx.canvas.toBlob((blob) => {
            resolve(blob);
        }, "image/jpeg", IMAGE_QUALITY); 
    }); 
}

// https://www.w3schools.com/html/html5_geolocation.asp
function showPosition(position) {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
}

// https://www.w3schools.com/html/html5_geolocation.asp
function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message.textContent = "Please allow location";
            break;
        case error.POSITION_UNAVAILABLE:
            message.textContent = "Location information is unavailable";
            break;
        case error.TIMEOUT:
            message.textContent = "The request to get user location timed out";
            break;
        case error.UNKNOWN_ERROR:
            message.textContent = "An unknown error occurred";
            break;
  }
}