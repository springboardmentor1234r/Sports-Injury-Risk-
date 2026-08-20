import React, { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/History.css";

function History() {

    const [history, setHistory] = useState([]);
    const [search, setSearch] = useState("");

    const user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {

        fetchHistory();

    }, []);

    const fetchHistory = async () => {

        try {

            const response = await api.get("/history");

            let data = response.data;

            // Athlete should only see their own history
            if (user.role === "athlete") {

                data = data.filter(

                    item =>
                        item.athlete_email === user.email

                );

            }

            setHistory(data);

        }

        catch (error) {

            console.error(error);

        }

    };

    const filteredHistory = history.filter(

        item =>

            item.athlete_name
                .toLowerCase()
                .includes(search.toLowerCase()) ||

            item.video
                .toLowerCase()
                .includes(search.toLowerCase())

    );

    return (

        <div className="history-page">

            <h1>Analysis History</h1>

            <p>
                View all saved AI analyses.
            </p>

            <input

                className="history-search"

                type="text"

                placeholder="Search athlete or video..."

                value={search}

                onChange={(e) =>
                    setSearch(e.target.value)
                }

            />

            {

                filteredHistory.length === 0 ?

                    (

                        <div className="empty-history">

                            <h2>No Analysis History</h2>

                            <p>

                                Upload a video to create your first analysis.

                            </p>

                        </div>

                    )

                    :

                    filteredHistory.map((item, index) => (

                        <div
                            className="history-card"
                            key={index}
                        >

                            <div className="history-info">

                                <h2>

                                    {item.athlete_name}

                                </h2>

                                <p>

                                    {item.video}

                                </p>

                                <div className="history-meta">

                                    <span>

                                        {

                                            item.risk_score
                                                .risk_level

                                        }

                                        {" "}Risk

                                    </span>

                                    <span>

                                        {

                                            item.risk_score
                                                .overall_score

                                        }

                                        /100

                                    </span>

                                    <span>

                                        {item.date}

                                    </span>

                                </div>

                            </div>

                            <div className="history-actions">

                                <a

                                    href={`http://127.0.0.1:8000/${item.report}`}

                                    target="_blank"

                                    rel="noreferrer"

                                >

                                    <button className="view-btn">

                                        View Report

                                    </button>

                                </a>

                            </div>

                        </div>

                    ))

            }

        </div>

    );

}

export default History;