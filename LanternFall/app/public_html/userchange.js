function onclick() {
    let newuser = document.getElementsByName("user-change")[0].value;
    let olduser = sessionStorage.getItem("username");
    let err = document.getElementById("error-msg");
    let code = 200;

    while (err.firstChild) {
        err.remove(err.firstChild);
    }

    let values = {
        olduser: olduser,
        newuser: newuser
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
            err.append(div);
        } else {
            div.textContent = data.error;
            err.append(div);
        }
    });
}

let button = document.getElementById("submit-button");
button.addEventListener("click", onclick);

//NOTES: Should perform a query call in the server.js file, return a json body with the element success if successful or error if it is not.