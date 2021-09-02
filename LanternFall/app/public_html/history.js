let userSelected = sessionStorage.getItem("userSelected");
let err = document.getElementById("error-msg");
let body = document.getElementById("body");

if (userSelected !== null) {
    document.getElementsByName("user-search")[0].value = userSelected;
    onclick();
    sessionStorage.removeItem("userSelected");
}

function onclick() {
    let username = document.getElementsByName("user-search")[0].value;
    err.textContent = "";

    while (body.firstChild) {
        body.removeChild(body.firstChild);
    }

    fetch(`/history/${username}`).then(async function (response) {
        if (response.status === 200) {
            await response.json().then(function (data) {
                if (data.info.length !== 0) {
                    for (let i = 0; i < data.info.length; i++) {
                        let time = data.info[i].date;
                        let kill = data.info[i].nickname;
                        let desc = data.info[i].description;
            
                        let tr = document.createElement("tr");

                        let date = new Date(time);
            
                        let td = document.createElement("td");
                        td.textContent = date.getMonth() + "/" + date.getDay() + "/" + date.getFullYear() + " " + get2D(date.getHours()) + ":" + get2D(date.getMinutes());
                        td.classList.add("cell");
                        tr.append(td);
            
                        td = document.createElement("td");
                        td.textContent = kill;
                        td.classList.add("cell");
                        tr.append(td);
            
                        td = document.createElement("td");
                        td.textContent = desc;
                        td.classList.add("cell");
                        tr.append(td);

                        tr.addEventListener("click", function() {
                            sessionStorage.setItem("kill_id", data.info[i].id);
                            location.href = "killInfo.html";
                        });
            
                        body.append(tr);
                    }
                }
            });
        } else {
            await response.json().then(function (error) {
                err.textContent = "Something went wrong";
                console.log(error.stack);
            });
        }
    })
}

// http://sstut.com/javascript/add-zeros-in-front-of-numbers-after-decimal-point.php
function get2D(num) {
    if (num.toString().length < 2) 
        return "0" + num;
    return num.toString();
}

let button = document.getElementById("search-button");
button.addEventListener("click", onclick);

sessionStorage.setItem("previousPage", "history.html");