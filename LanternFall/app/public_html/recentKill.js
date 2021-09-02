let user = sessionStorage.getItem("username");
let err = document.getElementById("error-msg");
let body = document.getElementById("body");

err.textContent = "";

while (body.firstChild) {
    body.removeChild(body.firstChild);
}

sessionStorage.setItem("previousPage", "recentKill.html");

fetch(`/topRecentKills`).then(async function (response) {
    if (response.status === 200) {
        await response.json().then(function (data) {
            if (data.info.length !== 0) {
                for (let i = 0; i < data.info.length; i++) {
                    let time = data.info[i].date;
                    let kill = data.info[i].nickname;
                    let user = data.info[i].username;
        
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
                    td.textContent = date.getMonth() + "/" + date.getDay() + "/" + date.getFullYear() + " " + get2D(date.getHours()) + ":" + get2D(date.getMinutes());
                    td.classList.add("cell");
                    tr.append(td);

                    tr.addEventListener("click", function() {
                        sessionStorage.setItem("kill_id", data.info[i].id)
                        location.href = "killInfo.html"
                    })
        
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

// http://sstut.com/javascript/add-zeros-in-front-of-numbers-after-decimal-point.php
function get2D(num) {
    if (num.toString().length < 2) 
        return "0" + num;
    return num.toString();
}
