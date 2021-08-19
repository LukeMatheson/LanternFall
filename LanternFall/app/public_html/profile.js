let user = sessionStorage.getItem("username");
let code = 200;
let err = document.getElementById("error-msg");
let date, kill, lat, long, desc;

while (err.firstChild) {
    err.remove(err.firstChild);
}

fetch(`/history?username=${user}`).then(function (response) {
    code = response.status;
    return response.json();
}).then(function (data) {
    if (code === 200) {
        for (let i = 0; i < data.info.date.length; i++) {
            date = data.info.date[i];
            kill = data.info.nickname[i];
            lat = data.info.loc_lat[i];
            long = data.info.loc_lon[i];
            desc = data.info.description[i];

            let tr = document.createElement("tr");

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

            document.getElementById("profile-table").append(tr);
        }
    } else {
        console.log(data.error);
        let div = document.createElement("div");
        div.textContent = data.error;
        err.append(div);
    }
});