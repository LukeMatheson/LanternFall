function onclick() {
    let username = document.getElementsByName("user-search")[0].value;
    let code = 200;
    let values = {
        date: [],
        name: [],
        lat: [],
        long: [],
        desc: []
    };
    let err = document.getElementById("error-msg");

    while (err.firstChild) {
        err.remove(err.firstChild);
    }

    fetch("/history?user=" + username).then(function (response) {
        code = response.status;
        return response.json();
    }).then(function (data) {
        if (code === 200) {
            console.log(data);
        } else {
            console.log(data.error);
            let div = document.createElement("div");
            div.textContent = "Something went wrong";
            err.append(div);
        }
    });
}

let button = document.getElementById("search-button");
button.addEventListener("click", onclick);