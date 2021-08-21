function onclick() {
    let token = sessionStorage.getItem("token");
    let date = document.getElementsByName("date")[0].value;
    let latitude = document.getElementsByName("latitude")[0].value;
    let longitude = document.getElementsByName("longitude")[0].value;
    let nickname = document.getElementsByName("kill-name")[0].value;
    let description = document.getElementById("description").value;
    let image = document.getElementById("image-file");

    let formData = null;
    try {
        formData = new FormData();
        formData.append("myimage.png", image.files[0]);
        imageExists = "true";
    } catch (err) {
        console.log(err)
        imageExists = "false";
    }
    
    let err = document.getElementById("error-msg");
    let code = 200;

    while (err.firstChild) {
        err.remove(err.firstChild);
    }

    let values = {
        token: token,
        date: date,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        nickname: nickname,
        description: description,
        image: imageExists 
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