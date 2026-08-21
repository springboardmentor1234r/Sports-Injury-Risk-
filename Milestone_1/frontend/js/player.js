async function addPlayer() {

    const name = document.getElementById("name").value;
    const height = document.getElementById("height").value;
    const weight = document.getElementById("weight").value;

    const data = {
        name: name,
        age: 0,
        height: parseFloat(height),
        weight: parseFloat(weight),
        sport: "Not specified"
    };

    const response = await fetch("http://127.0.0.1:8000/player", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    document.getElementById("result").innerHTML =
        result.message + " (Player ID: " + result.id + ")";
}