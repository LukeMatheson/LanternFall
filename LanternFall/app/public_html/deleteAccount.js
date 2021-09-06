let token = sessionStorage.getItem("token");
let yesButton = document.getElementById("yes-button");
let noButton = document.getElementById("no-button");
let message = document.getElementById("message");

if (sessionStorage.getItem("token") != null) {
    yesButton.addEventListener("click", onclick);

    noButton.addEventListener("click", function() {
        location.href = "/settings.html";
    });
}
else {
    location.href = "index.html";
}

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
                message.textContent = "Deleted. Returning in 5 seconds";
                let timer = 4;
                yesButton.style.display = "none";
                noButton.style.display = "none";

                setInterval(function () {
                    message.textContent = `Deleted. Returning in ${timer--} seconds`;
                }, 1000);

                setTimeout(function () {
                    location.href = "/index.html";
                }, 5000);
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
