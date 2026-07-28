import React from "react";
import "../styles/CoachDashboard.css";

function CoachDashboard() {

    const recentActivity = [
        {
            athlete: "Rahul Sharma",
            risk: "High"
        },
        {
            athlete: "Amit Kumar",
            risk: "Medium"
        },
        {
            athlete: "Rohit Verma",
            risk: "Low"
        }
    ];

    return (

        <div className="coach-page">

            <div className="coach-header">

                <h1>Coach Dashboard</h1>

                <p>
                    Monitor athlete performance and injury risk.
                </p>

            </div>

            {/* Statistics */}

            <div className="coach-cards">

                <div className="coach-card">
                    <h3>Total Athletes</h3>
                    <h2>24</h2>
                </div>

                <div className="coach-card">
                    <h3>Videos Uploaded</h3>
                    <h2>82</h2>
                </div>

                <div className="coach-card">
                    <h3>High Risk Athletes</h3>
                    <h2>4</h2>
                </div>

                <div className="coach-card">
                    <h3>Reports Generated</h3>
                    <h2>53</h2>
                </div>

            </div>

            {/* Athlete Activity */}

            <div className="coach-table">

                <h2>Recent Athlete Activity</h2>

                <table>

                    <thead>

                        <tr>

                            <th>Athlete</th>

                            <th>Current Risk</th>

                        </tr>

                    </thead>

                    <tbody>

                        {recentActivity.map((athlete, index) => (

                            <tr key={index}>

                                <td>{athlete.athlete}</td>

                                <td>{athlete.risk}</td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>

    );

}

export default CoachDashboard;