if (sessionStorage.getItem("token") != null) {
    let changeButton = document.getElementById("change-button");
    changeButton.addEventListener("click", function() {
        location.href = "/userchange.html";
    });

    let deleteButton = document.getElementById("delete-button");
    deleteButton.addEventListener("click", function() {
        location.href = "/deleteAccount.html";
    });
}
else {
    location.href = "index.html";
}