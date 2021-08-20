let err = document.getElementById("error-msg");

while (err.firstChild) {
    err.remove(err.firstChild);
}

//TODO: add fetch api call for a /leaderboard route
//TODO: add a /leaderboard route to server.js