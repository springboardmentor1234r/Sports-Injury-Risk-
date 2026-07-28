import React from "react";

function AnomalyTable({ anomalies }) {
  if (!anomalies || anomalies.length === 0) {
    return (
      <div className="card anomaly-card">
        <div className="card-header">
          <span className="card-icon"></span>
          <h3>Movement Anomalies</h3>
        </div>

        <div className="no-anomaly">
          <div className="no-anomaly-icon">✓</div>

          <div>
            <h4>No Movement Issues</h4>
            <p>Your movement pattern looks healthy.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card anomaly-card">
      <div className="card-header">
        <span className="card-icon"></span>
        <h3>Movement Anomalies</h3>
      </div>

      {anomalies.map((item, index) => (
        <div className="anomaly-box" key={index}>

          <div className="anomaly-top">

            <div>
              <h4>{item.joint}</h4>
              <small>{item.severity}</small>
            </div>

            <span className="anomaly-badge">
              {item.severity}
            </span>

          </div>

          <div className="anomaly-section">

            <strong>Issue</strong>

            <p>{item.issue}</p>

          </div>

          <div className="anomaly-section">

            <strong>Recommendation</strong>

            <p>{item.recommendation}</p>

          </div>

        </div>
      ))}
    </div>
  );
}

export default AnomalyTable;