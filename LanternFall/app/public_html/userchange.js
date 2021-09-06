let button = document.getElementById("submit-button");
let returnButton = document.getElementById("return-button");

if (sessionStorage.getItem("token") != null) {
    button.addEventListener("click", onclick);

    returnButton.addEventListener("click", function() {
        location.href = "/settings.html";
    });
}
else {
    location.href = "index.html";
}

function onclick() {
    let newuser = document.getElementsByName("user-change")[0].value;
    let err = document.getElementById("error-msg");
    let token = sessionStorage.getItem("token");
    let code = 200;

    while (err.firstChild) {
        err.removeChild(err.firstChild);
    }

    let values = {
        token: token,
        username: newuser
    };

    fetch('/changeUsername', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
    }).then(function (response) {
        code = response.status;
        return response.json();
    }).then(function (data) {
        let div = document.createElement("div");
        if (code === 200) {
            div.textContent = data.success;
            sessionStorage.setItem("username", data.info);
            err.append(div);
        } else {
            div.textContent = data.error;
            err.append(div);
        }
    });
}