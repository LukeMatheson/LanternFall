let message = document.getElementById("message");
let token = sessionStorage.getItem("token");

function onclick() {
    message.textContent = "";

    let values = {
        token: token
    };

    fetch("/deleteAccount", {
		method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
		body: JSON.stringify(values)
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

let yesButton = document.getElementById("yes-button");
yesButton.addEventListener("click", onclick);

let noButton = document.getElementById("no-button");
noButton.addEventListener("click", function() {
    location.href = "/settings.html";
});