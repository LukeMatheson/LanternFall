function onclick() {
    let username = document.getElementsByName("user-search")[0].value;
    let code = 200;
    let err = document.getElementById("error-msg");
    let body = document.getElementById("body");

    while (err.firstChild) {
        err.removeChild(err.firstChild);
    }

    while (body.firstChild) {
        body.removeChild(body.firstChild);
    }

    fetch(`/history?username=${username}`).then(function (response) {
        code = response.status;
        return response.json();
    }).then(function (data) {
        if (code === 200) {
            for (let i = 0; i < data.info.length; i++) {
                let date = data.info[i].date;
                let kill = data.info[i].nickname;
                let lat = data.info[i].loc_lat;
                let long = data.info[i].loc_lon; 
                let desc = data.info[i].description;
    
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
    
                body.append(tr);
            }
        } else {
            console.log(data.error);
            let div = document.createElement("div");
            div.textContent = "Something went wrong";
            err.append(div);
        }
    });
}

let button = document.getElementById("search-button");
button.addEventListener("click", onclick);