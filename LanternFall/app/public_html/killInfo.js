let token = sessionStorage.getItem("token");
let kill_id = sessionStorage.getItem("kill_id");
let previousPage = sessionStorage.getItem("previousPage");
let nickname = document.getElementById("nickname");
let time = document.getElementById("time");
let photo = document.getElementById("photo");
let description = document.getElementById("description");
let returnButton = document.getElementById("return-button");
let deleteButton = document.getElementById("delete-button");

if (sessionStorage.getItem("token") != null) {
    fetch(`/killInfo/${kill_id}`).then(async function (response) {
        if (response.status === 200) {
            await response.json().then(function (data) {
                let date = new Date(data.info.date);

                nickname.textContent = data.info.nickname;
                time.textContent = (date.getMonth() + 1) + "/" + date.getDate() + "/" + (date.getFullYear() % 100) + " " + get2D(date.getHours()) + ":" + get2D(date.getMinutes());
                
                if (data.info.description === "") {
                    description.style.display = "none";
                } else {
                    description.textContent = data.info.description;
                }

                if (data.info.img_exist === false) {
                    photo.style.display = "none";
                } else {
                    fetch(`/image/${kill_id}`).then(async function (response) {
                        if (response.status === 200) {
                            await response.blob().then(function (data) {
                                var image = document.createElement("img");
                                image.src = URL.createObjectURL(data);
                                image.classList.add("image");
                                photo.appendChild(image);
                            });
                        } else {
                            console.log("error");
                        }
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
                }
            });
        } else {
            console.log("error");
        }
    })
    .catch(function (error) {
        console.log(error);
    });

    fetch("/imageUser", {
        method: 'POST', // or 'PUT'
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({token: token, kill: kill_id}),
    }).then(async function (response) {
        if (response.status === 200) {
            await response.json().then(function (data) {
                if (data.success === "false") {
                    deleteButton.style.display = "none";
                }
            });
        } else {
            deleteButton.style.display = "none";
            console.log("error");
        }
    })
    .catch(function (error) {
        deleteButton.style.display = "none";
        console.log(error);
    });

    if (previousPage === null) {
        returnButton.addEventListener("click", function() {
            location.href = "/map.html";
        });
    } else {
        returnButton.addEventListener("click", function() {
            location.href = `/${previousPage}`;
        });
    }

    deleteButton.addEventListener("click", function() {
        fetch("/deletePost", {
            method: 'POST', // or 'PUT'
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({token: token, kill: parseInt(kill_id)}),
        }).then(async function (response) {
            if (response.status === 200) {
                if (previousPage === null) {
                    location.href = "/map.html";
                } else {
                    location.href = `/${previousPage}`;
                }
            }
        })
        .catch(function (error) {
            console.log(error);
        });
    });
}
else {
    location.href = "index.html";
}

// http://sstut.com/javascript/add-zeros-in-front-of-numbers-after-decimal-point.php
function get2D(num) {
    if (num.toString().length < 2) 
        return "0" + num;
    return num.toString();
}