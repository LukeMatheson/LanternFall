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
                if (data.info !== "false") {
                    for (let i = 0; i < data.info.length; i++) {
                        let time = data.info[i].date;
                        let kill = data.info[i].nickname;
            
                        let tr = document.createElement("tr");
                        tr.classList.add("body-row");

                        let date = new Date(time);
                
                        let td = document.createElement("td");
                        td.textContent = username;
                        td.classList.add("cell");
                        tr.append(td);

                        td = document.createElement("td");
                        td.textContent = kill;
                        td.classList.add("cell");
                        tr.append(td);

                        td = document.createElement("td");
                        td.textContent = date.getMonth() + "/" + date.getDay() + "/" + date.getFullYear();
                        td.classList.add("cell");
                        tr.append(td);
            
                        tr.addEventListener("click", function() {
                            sessionStorage.setItem("kill_id", data.info[i].id);
                            location.href = "killInfo.html";
                        });
            
                        body.append(tr);
                    }
                }
                
                else {
                    let tr = document.createElement("tr");

                    let td = document.createElement("td");
                    td.textContent = "No kills yet";
                    td.classList.add("cell");
                    td.colSpan = "3";
                    tr.append(td);

                    body.append(tr);
                }
            });
        } else {
            await response.json().then(function (error) {
                err.textContent = "Something went wrong";
                console.log(error.error);
                let tr = document.createElement("tr");

                let td = document.createElement("td");
                td.textContent = "User not found";
                td.classList.add("cell");
                td.colSpan = "3";
                tr.append(td);

                body.append(tr);
            });
        }
    })
    .catch(function (error) {
        let tr = document.createElement("tr");

        let td = document.createElement("td");
        td.textContent = "Enter a user";
        td.classList.add("cell");
        td.colSpan = "3";
        tr.append(td);

        body.append(tr);
    });
}

let button = document.getElementById("search-button");
button.addEventListener("click", onclick);

sessionStorage.setItem("previousPage", "history.html");