 let token = sessionStorage.getItem("token");
 let date = document.getElementById("date");
 let latitude = document.getElementById("latitude");
 let longitude = document.getElementById("longitude");
 let nickname = document.getElementById("kill-name");
 let description = document.getElementById("description");
 let image = document.getElementById("image-file");
 let message = document.getElementById("message");

function onclick() {
    message.textContent = "";

    let formData = new FormData();
    let imageExists = "false";

    if (image.value != "") {
        formData.append("photo", image.files[0]);
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