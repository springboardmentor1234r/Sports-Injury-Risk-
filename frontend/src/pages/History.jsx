import React, { useContext } from "react";
import { AnalysisContext } from "../context/AnalysisContext";

import "../styles/History.css";

function History() {
  const { history, deleteHistory } = useContext(AnalysisContext);

  if (history.length === 0) {
    return (
      <div className="history-page">
        <h1>🕒 Analysis History</h1>

        <div className="empty-history">
          <h2>No Analysis History</h2>
          <p>
            Upload a video to create your first analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">

      <h1>🕒 Analysis History</h1>

      <p>
        View all AI injury analyses performed in this session.
      </p>

      {history.map((item) => (

        <div
          className="history-card"
          key={item.id}
        >

          <div className="history-info">

            <h2>{item.filename}</h2>

            <div className="history-meta">

              <span>
                🟢 {item.risk_score.risk_level} Risk
              </span>

              <span>
                📊 {item.risk_score.overall_score}/100
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
                📄 View Report
              </button>
            </a>

            <button
              className="delete-btn"
              onClick={() => deleteHistory(item.id)}
            >
              🗑 Delete
            </button>

          </div>

        </div>

      ))}

    </div>
  );
}

export default History;