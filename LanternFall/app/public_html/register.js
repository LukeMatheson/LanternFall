function onclick() {
    let username = document.getElementsByName("Username")[0].value;
    let email = document.getElementsByName("Email")[0].value;
    let password = document.getElementsByName("Pass")[0].value;
    let confirm = document.getElementsByName("Confirm")[0].value;
    let err = document.getElementById("error-msg");

    while (err.firstChild) {
        err.removeChild(err.firstChild);
    }

    if (password === confirm) {
        let values = {
            email: email,
            username: username,
            password: password
        }
        let code = 200;

        fetch('/create', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(values),
        }).then(function (response) {
            code = response.status;
            return response.json();
        }).then(function (data) {
            if (code === 200) {
                let div = document.createElement("div");
                div.textContent = data.success;
                err.append(div);
            } else {
                let div = document.createElement("div");
                div.textContent = data.error;
                err.append(div);
            }
        }).catch(function (error) {
            console.log(error);
            let div = document.createElement("div");
            div.textContent = "Something went wrong";
            err.append(div);
        });
    } else {
        let div = document.createElement("div");
        div.textContent = "Passwords must match";
        err.append(div);
    }
}

let button = document.getElementById("signup-button");
button.addEventListener("click", onclick);