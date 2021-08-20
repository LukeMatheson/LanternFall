function onclick() {
    let newuser = document.getElementsByName("user-change")[0].value;
    let olduser = sessionStorage.getItem("username");
    let err = document.getElementById("error-msg");

    while (err.firstChild) {
        err.remove(err.firstChild);
    }

    //TODO: add fetch api call for a /userchange?olduser=${olduser}&newuser=${newuser} route
    //TODO: add /userchange route to server.js file
}

let button = document.getElementById("submit-button");
button.addEventListener("click", onclick);