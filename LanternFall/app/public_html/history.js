let userSelected = sessionStorage.getItem("userSelected");
let button = document.getElementById("search-button");
let body = document.getElementById("body");

sessionStorage.setItem("previousPage", "history.html");

if (userSelected !== null) {
    document.getElementsByName("user-search")[0].value = userSelected;
    onclick();
    sessionStorage.removeItem("userSelected");
}

function onclick() {
    let username = document.getElementsByName("user-search")[0].value;

    while (body.firstChild) {
        body.removeChild(body.firstChild);
    }

    fetch(`/history/${username}`).then(async function (response) {
        if (response.status === 200) {
            await response.json().then(function (data) {
                if (data.info !== "false") {
                    for (let i = data.info.length - 1; i >= 0; i--) {
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
                        td.textContent = date.getMonth() + "/" + date.getDay() + "/" + (date.getFullYear() % 100);
                        td.classList.add("cell");
                        tr.append(td);
            
                        tr.addEventListener("click", function() {
                            sessionStorage.setItem("userSelected", username);
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
        console.log(error.stack);
        let tr = document.createElement("tr");

        let td = document.createElement("td");
        td.textContent = "Enter a user";
        td.classList.add("cell");
        td.colSpan = "3";
        tr.append(td);

        body.append(tr);
    });
}

button.addEventListener("click", onclick);
