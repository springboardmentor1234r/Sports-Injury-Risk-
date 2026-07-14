async function addPlayer() {

    const data = {
        name: document.getElementById("name").value,
        age: parseInt(document.getElementById("age").value),
        height: parseFloat(document.getElementById("height").value),
        weight: parseFloat(document.getElementById("weight").value),
        sport: document.getElementById("sport").value
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