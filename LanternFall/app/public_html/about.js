if (sessionStorage.getItem("token") != null) {
    let kills = document.getElementById("kills");

    fetch(`/totalKills`).then(async function (response) {
        if (response.status === 200) {
            await response.json().then(function (data) {
                kills.textContent = `${data.info} lantern flies have been killed so far!`;
            });
        } 
        else {
            kills.textContent = "0";
        }
    })
    .catch(function (error) {
        kills.textContent = "0";
        console.log(error.stack);
    });
}
else {
    location.href = "index.html";
}