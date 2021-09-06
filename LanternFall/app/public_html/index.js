let token = sessionStorage.getItem("token");
let login = document.getElementById("login-button");

sessionStorage.clear();

login.addEventListener("click", function () {

    error.textContent = "";

    var userEmail = document.getElementById("email").value;
    var userPassword = document.getElementById("pwd").value;

    const data = { email: userEmail, password: userPassword };

    fetch(`/login`, {
    method: 'POST', // or 'PUT'
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        let error = document.getElementById("error");
        
        if (data.error) {
            error.textContent = "Invalid email or password";
        }
        else {
            anime.timeline({
                targets: ".center-block",
                opacity: 0,
                easing: "easeOutCirc",
                duration: 300
            })
            .add({
                targets: ".center-grid-page",
                backgroundColor: "rgb(0,0,0)",
                easing: "easeOutCirc",
                duration: 300
            })
            .add({
                delay: 200,
                targets: ".green-split",
                easing: 'easeInElastic',
                duration: 500,
                height: "100%",
                top: 0
            });
            setTimeout(() => {
                sessionStorage.setItem("token", data.token);
                sessionStorage.setItem("username", data.username);
                location.href = "map.html";
            }, 1500);
        }
    })
    .catch((error) => {
        console.error(error);
    });

}); 

let register = document.getElementById("register-button");
register.addEventListener("click", function() {
    location.href = "/register.html";
});