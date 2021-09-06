let user = sessionStorage.getItem("username");
let body = document.getElementById("body");

if (sessionStorage.getItem("token") != null) {
    sessionStorage.setItem("previousPage", "profile.html");

    fetch(`/history/${user}`).then(async function (response) {
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
                        td.textContent = user;
                        td.classList.add("cell");
                        tr.append(td);

                        td = document.createElement("td");
                        td.textContent = kill;
                        td.classList.add("cell");
                        tr.append(td);

                        td = document.createElement("td");
                        td.textContent = (date.getMonth() + 1) + "/" + date.getDate() + "/" + (date.getFullYear() % 100);
                        td.classList.add("cell");
                        tr.append(td);
            
                        tr.addEventListener("click", function() {
                            sessionStorage.setItem("kill_id", data.info[i].id)
                            location.href = "killInfo.html"
                        })
            
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
            });
        }
    })
    .catch(function (error) {
        console.log(error.stack);
    })
}
else {
    location.href = "index.html";
}