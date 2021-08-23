function onclick() {
    let code = 200;
    let err = document.getElementById("error-msg");
    let div = document.createElement("div");

    while (err.firstChild) {
        err.removeChild(err.firstChild);
    }

    fetch('/deleteAccount').then(function (response) {
        code = response.status;
        return response.json();
    }).then(function (data) {
        if (code === 200) {
            div.textContent = data.success;
            err.append(div);
        } else {
            div.textContent = data.error;
            err.append(div);
        }
    }).catch(function (error) {
        console.log(error);
        div.textContent = "Something went wrong...";
        err.append(div);
    });
}

let yesButton = document.getElementById("yes-button");
yesButton.addEventListener("click", onclick);

let noButton = document.getElementById("no-button");
noButton.addEventListener("click", function() {
    location.href = "/settings.html";
});