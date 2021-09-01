let token = sessionStorage.getItem("token");
let yesButton = document.getElementById("yes-button");
let noButton = document.getElementById("no-button");
let message = document.getElementById("message");

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
                let timer = 5;
                yesButton.style.display = "none";
                noButton.style.display = "none";

                setTimeout(function () {
                    setInterval(function () {
                        message.textContent = `Returning in ${timer--} seconds`;
                    }, 1000);

                    setTimeout(function () {
                        location.href = "/index.html";
                    }, 6000);
                }, 2000);
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

yesButton.addEventListener("click", onclick);

noButton.addEventListener("click", function() {
    location.href = "/settings.html";
});