async function loginUser() {

    const data = {
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
    };

    try {

        const response = await fetch("http://127.0.0.1:8000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        document.getElementById("result").innerHTML =
            result.message || result.detail;

        if (response.ok) {

            localStorage.setItem("username", result.user);

            setTimeout(() => {
                window.location = "/home";
            }, 1000);

        }

    } catch (error) {

        console.error(error);

        document.getElementById("result").innerHTML =
            "Login failed. Please try again.";

    }
}
