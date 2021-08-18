function onclick() {
    let username = document.getElementsByName("Username")[0].value;
    let email = document.getElementsByName("Email")[0].value;
    let password = document.getElementsByName("Pass")[0].value;
    let confirm = document.getElementsByName("Confirm")[0].value;
    let error = document.getElementById("error-msg");

    while (error.firstChild) {
        error.removeChild(error.firstChild);
    }

    if (password === confirm) {
        fetch('/create', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            
        })
    }
}

let button = document.getElementById("signup-button");
button.addEventListener("click", onclick);