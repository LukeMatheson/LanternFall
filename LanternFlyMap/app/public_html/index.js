let login = document.getElementById("login-button");

login.addEventListener("click", function () {
    
    error.textContent = "";

    var userEmail = document.getElementById("email").value;
    var userPassword = document.getElementById("pwd").value;
    var url = `http://localhost:3000/login?email=${userEmail}&password=${userPassword}`

    const data = { email: userEmail, password: userPassword };

    fetch(url, {
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
            sessionStorage.setItem("token", data.token);
            location.href = "map.html";
        }
    })
    .catch((error) => {
        console.error(error);
    });

}); 