let table = document.getElementById("body");
let err = document.getElementById("error-msg");
let code = 200;

while (err.firstChild) {
    err.removeChild(err.firstChild);
}

fetch('/leaderboard').then(function (response) {
    code = response.status;
    return response.json();
}).then(function (data) {
    if (code === 200) {
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
    } else {
        let div = document.createElement("div");
        div.textContent = "Failed to fetch leaderboard";
        err.append(div);
    }
}).catch(function (error) {
    console.log(error);
    let div = document.createElement("div");
    div.textContent = "Something went wrong";
    err.append(div);
})