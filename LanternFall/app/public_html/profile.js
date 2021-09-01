let user = sessionStorage.getItem("username");
let code = 200;
let err = document.getElementById("error-msg");
let body = document.getElementById("body");
let date, kill, lat, long, desc;

while (err.firstChild) {
    err.removeChild(err.firstChild);
}

while (body.firstChild) {
    body.removeChild(body.firstChild);
}

fetch(`/history/${user}`).then(function (response) {
    code = response.status;
    return response.json();
}).then(function (data) {
    
    if (code === 200) {
        for (let i = 0; i < data.info.length; i++) {
            date = data.info[i].date;
            kill = data.info[i].nickname;
            lat = data.info[i].loc_lat;
            long = data.info[i].loc_lon;
            desc = data.info[i].description;

            let tr = document.createElement("tr");
            tr.setAttribute("id", i);

            let td = document.createElement("td");
            td.textContent = date;
            td.classList.add("cell");
            tr.append(td);

            td = document.createElement("td");
            td.textContent = kill;
            td.classList.add("cell");
            tr.append(td);

            td = document.createElement("td");
            td.textContent = lat;
            td.classList.add("cell");
            tr.append(td);

            td = document.createElement("td");
            td.textContent = long;
            td.classList.add("cell");
            tr.append(td);

            td = document.createElement("td");
            td.textContent = desc;
            td.classList.add("cell");
            tr.append(td);

            td = document.createElement("td");
            let button = document.createElement("button");
            button.textContent = "Delete";
            button.addEventListener("click", function () {
                fetch("/deletePost", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({"token": sessionStorage.getItem("token"), "kill": i}),
                }).then(function (response) {
                    code = response.status;
                    return response.json();
                }).then(function (data) {
                    if (code === 200) {
                        body.deleteChild(body.childNodes[i]);
                    } else {
                        console.log("Couldn't delete");
                    }
                }).catch(function (error) {
                    console.log(error.stack);
                })
            });

            body.append(tr);
        }
    } else {
        console.log(data.error);
        let div = document.createElement("div");
        div.textContent = data.error;
        err.append(div);
    }
});