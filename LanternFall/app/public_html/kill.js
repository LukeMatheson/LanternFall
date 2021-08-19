function onclick() {
    let username = document.getElementsByName("username")[0].value;
    let date = document.getElementsByName("date")[0].value;
    let lat = document.getElementsByName("latitude")[0].value;
    let long = document.getElementsByName("longitude")[0].value;
    let name = document.getElementsByName("kill-name")[0].value;
    let comments = document.getElementById("description").value;
    let image = document.getElementsByName("image")[0];
    
    let err = document.getElementById("error-msg");
    let code = 200;

    while (err.firstChild) {
        err.remove(err.firstChild);
    }

    let values = {
        user: username,
        date: date,
        latitude: lat,
        longitude: long,
        name: name,
        comments: comments,
        image: image
    };

    fetch('/kill', {
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
    })
}

let button = document.getElementById("kill-button");
button.addEventListener("click", onclick);