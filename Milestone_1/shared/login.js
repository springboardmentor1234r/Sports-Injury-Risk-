async function loginUser() {

    const data = {
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
    };

    const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    document.getElementById("result").innerHTML = result.message;
    if (response.ok) {
        setTimeout(() => {
            window.location= "player.html";
            }, 1500);
        }
    }