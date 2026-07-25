import React from "react";

const RiskScoreCard = ({ riskScore }) => {
  if (!riskScore) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-icon">🛡️</span>
          <h3>Overall Risk Score</h3>
        </div>

        <p className="empty-text">No analysis available.</p>
      </div>
    );
  }

  const { overall_score, risk_level } = riskScore;

  let badgeClass = "risk-low";
  let message =
    "Excellent movement quality. Continue maintaining proper form.";

  if (risk_level === "Moderate") {
    badgeClass = "risk-medium";
    message =
      "Some movement deviations were detected. Consider corrective exercises.";
  }

  if (risk_level === "High") {
    badgeClass = "risk-high";
    message =
      "High injury risk detected. Immediate review by a coach or physiotherapist is recommended.";
  }

  return (
    <div className="card risk-card">
      <div className="card-header">
        <span className="card-icon">🛡️</span>
        <h3>Overall Risk Score</h3>
      </div>

      <div className="risk-score-circle">
        {overall_score}
      </div>

      <div className={`risk-badge ${badgeClass}`}>
        {risk_level} Risk
      </div>

      <p className="risk-message">
        {message}
      </p>
    </div>
  );
};

export default RiskScoreCard;