let token = sessionStorage.getItem("token");
let date = document.getElementById("date");
let latitude = document.getElementById("latitude");
let longitude = document.getElementById("longitude");
let nickname = document.getElementById("kill-name");
let description = document.getElementById("description");
let image = document.getElementById("image-file");
let message = document.getElementById("message");
const IMAGE_QUALITY = 0.50;

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

        const MAX_WIDTH = 1080;
        const MAX_HEIGHT = 1080;

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
        date: date.value,
        latitude: parseFloat(latitude.value),
        longitude: parseFloat(longitude.value),
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

let button = document.getElementById("kill-button");
button.addEventListener("click", onclick);

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