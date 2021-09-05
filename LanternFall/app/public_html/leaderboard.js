let table = document.getElementById("body");

fetch('/leaderboard').then(async function (response) {
    if (response.status === 200) {
        await response.json().then(function (data) {
            if (data.info.length !== 0) {
                for (let i = 0; i < data.info.length; i++) {
                    let tr = document.createElement("tr");
                    tr.classList.add("body-row");

                    let td = document.createElement("td");
                    td.textContent = data.info[i].username;
                    td.classList.add("cell");
                    tr.append(td);

                    td = document.createElement("td");
                    td.textContent = data.info[i].total_kills;
                    td.classList.add("cell");
                    tr.append(td);

                    tr.addEventListener("click", function() {
                        sessionStorage.setItem("userSelected", data.info[i].username);
                        location.href = "history.html";
                    });
                                
                    table.append(tr);
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