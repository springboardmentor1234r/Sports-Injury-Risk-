import React from "react";

function AnomalyTable({ anomalies }) {
  if (!anomalies || anomalies.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-icon">⚠️</span>
          <h3>Movement Anomalies</h3>
        </div>

        <p className="empty-text">
          No movement anomalies detected.
        </p>
      </div>
    );
  }

  const getSeverityClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "risk-high";
      case "medium":
        return "risk-medium";
      default:
        return "risk-low";
    }
  };

  return (
    <div className="card anomaly-card">

      <div className="card-header">
        <span className="card-icon">⚠️</span>
        <h3>Movement Anomalies</h3>
      </div>

      <div className="anomaly-list">

        {anomalies.map((item, index) => (

          <div
            key={index}
            className="anomaly-item"
          >

            <div className="anomaly-top">

              <div className="anomaly-title">
                🦴 {item.joint}
              </div>

              <span
                className={`prediction-badge ${getSeverityClass(item.severity)}`}
              >
                {item.severity}
              </span>

            </div>

            <div className="anomaly-content">

              <p>
                <strong>Issue:</strong> {item.issue}
              </p>

              <p>
                <strong>Recommendation:</strong>{" "}
                {item.recommendation}
              </p>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}

export default AnomalyTable;