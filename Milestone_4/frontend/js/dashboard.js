let angleChart;
window.onload = function () {
    const username = localStorage.getItem("username");

    if (username) {
    document.getElementById("name").textContent = username;
    }

    document.getElementById("risk").textContent = "NOT ANALYZED";

    document.getElementById("scoreText").textContent = "--";

    document.getElementById("score").value = 0;

    document.getElementById("riskCircle").className =
        "risk-circle risk-empty";

};
document.getElementById("name").textContent = "john";
document.getElementById("sport").textContent = "Football";
document.getElementById("age").textContent = "21";

// Upload Video
document.getElementById("uploadBtn").addEventListener("click", function () {
    document.getElementById("videoFile").click();
});

document.getElementById("videoFile").addEventListener("change", async function () {

    const file = this.files[0];

    if (!file) return;
    document.getElementById("analysisStatus").textContent =
    "📤 Uploading Video...";
    const preview = document.getElementById("videoPreview");

    preview.src = URL.createObjectURL(file);

    preview.style.display = "block";

    const formData = new FormData();
    formData.append("file", file);

    try {

        const response = await fetch("http://127.0.0.1:8000/upload-video", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        alert(result.message);

    } catch (error) {

        alert("Upload Failed");

        console.log(error);

    }

});

// Analyze Video
document.getElementById("analyzeBtn").addEventListener("click", async function () {

    document.getElementById("analysisStatus").textContent =
        "🤖 AI is Analyzing Pose...";

    const analyzeBtn = document.getElementById("analyzeBtn");

    analyzeBtn.innerText = "Analyzing...";
    analyzeBtn.disabled = true;

    try {

        const response = await fetch("http://127.0.0.1:8000/analyze-video", {
            method: "POST"
        });

        const result = await response.json();

        document.getElementById("analysisStatus").textContent =
            "📄 Generating Report...";

        if (result.status === "success") {

            await loadDashboard();

            setTimeout(() => {
                document.getElementById("analysisStatus").textContent =
                    "✅ Analysis Completed";
            }, 1000);

            alert(result.message);

        } else {

            document.getElementById("analysisStatus").textContent =
                "❌ Analysis Failed";

            alert(result.message);
        }

    } catch (error) {

        document.getElementById("analysisStatus").textContent =
            "❌ Analysis Failed";

        alert("Analysis Failed");

        console.log(error);

    } finally {

        analyzeBtn.innerText = "Analyze Video";
        analyzeBtn.disabled = false;

    }

});
// Download Report
document.getElementById("downloadBtn").addEventListener("click", function () {

    window.open(
    "http://127.0.0.1:8000/download-report",
    "_blank"
);
});
async function loadDashboard() {

    try {

        const response = await fetch("http://127.0.0.1:8000/dashboard-data");

        const data = await response.json();

        console.log(data);   // Add this line

        if (data.status === "success") {

            document.getElementById("rknee").textContent = data.right_knee + "°";
            document.getElementById("lknee").textContent = data.left_knee + "°";
            document.getElementById("relbow").textContent = data.right_elbow + "°";
            document.getElementById("lelbow").textContent = data.left_elbow + "°";
            document.getElementById("rhip").textContent = data.right_hip + "°";
            document.getElementById("lhip").textContent = data.left_hip + "°";
            const ctx = document.getElementById("angleChart").getContext("2d");

            if (angleChart) {
                angleChart.destroy();
            }

            angleChart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: [
                        "R Knee",
                        "L Knee",
                        "R Elbow",
                        "L Elbow",
                        "R Hip",
                        "L Hip"
                    ],
                    datasets: [{
                        label: "Joint Angles",
                        data: [
                            data.right_knee,
                            data.left_knee,
                            data.right_elbow,
                            data.left_elbow,
                            data.right_hip,
                            data.left_hip
                            ],
                            backgroundColor: [
                            "#4CAF50",
                            "#2196F3",
                            "#FFC107",
                            "#FF5722",
                            "#9C27B0",
                            "#00BCD4"
                            ],
                            borderRadius: 10,
                            borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 180
                        }
                    }
                }
            });
            console.log("Risk from Backend:", data.risk);
            console.log("Score from Backend:", data.score);

            const risk = document.getElementById("risk");

            risk.textContent = data.risk;
            const circle = document.getElementById("riskCircle");
            const scoreText = document.getElementById("scoreText");

            const score = data.score;

            if (data.risk === "LOW RISK") {
                circle.className = "risk-circle risk-low";
            }
            else if (data.risk === "MEDIUM RISK") {
                circle.className = "risk-circle risk-medium";
            }
            else {
                circle.className = "risk-circle risk-high";
            }

            scoreText.textContent = score + "%";
            document.getElementById("score").value = score;

            if (data.risk === "LOW RISK") {
                risk.style.color = "green";
            }
            else if (data.risk === "MEDIUM RISK") {
                risk.style.color = "orange";
            }
            else {
                risk.style.color = "red";
            }
            const recommendations = document.getElementById("recommendations");

            recommendations.innerHTML = "";

            // Detected Issues
            recommendations.innerHTML += "<li><b>Detected Issues</b></li>";

            data.issues.forEach(issue => {
                recommendations.innerHTML += `<li>⚠ ${issue}</li>`;
            });

            // Space
            recommendations.innerHTML += "<br>";

            // Exercises
            recommendations.innerHTML += "<li><b>Recommended Exercises</b></li>";

            data.exercises.forEach(exercise => {
                recommendations.innerHTML += `<li>🏋 ${exercise}</li>`;
            });


            document.getElementById("status").textContent = "Completed";

            document.getElementById("riskLevel").textContent = data.risk;

            // Temporary value
            document.getElementById("frames").textContent = "248";

            document.getElementById("updated").textContent =
            new Date().toLocaleTimeString();
            // -----------------------------
            // Analysis History
            // -----------------------------
            const tableBody = document.querySelector("#historyTable tbody");

            const row = `
            <tr>
                <td>${new Date().toLocaleString()}</td>
                <td>${data.risk}</td>
                <td>${data.score}%</td>
            </tr>
            `;

            tableBody.insertAdjacentHTML("afterbegin", row);

        }

    } catch (error) {
        console.log(error);
    }

}
// -----------------------------
// Dark / Light Mode
// -----------------------------
const themeBtn = document.getElementById("themeBtn");

themeBtn.addEventListener("click", function () {

    document.body.classList.toggle("dark-mode");

    if(document.body.classList.contains("dark-mode")){
        themeBtn.textContent = "☀ Light Mode";
    }
    else{
        themeBtn.textContent = "🌙 Dark Mode";
    }

});
