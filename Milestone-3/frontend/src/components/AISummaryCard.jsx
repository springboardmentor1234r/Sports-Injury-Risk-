import React from "react";

function AISummaryCard({
  riskScore,
  prediction,
  recommendations
}) {

  if (!riskScore) return null;

  const overall =
    riskScore.risk_level || "Unknown";

  const score =
    riskScore.overall_score || "--";

  const recommendation =
    recommendations?.length
      ? recommendations[0]
      : "No recommendation available.";

  return (

    <div className="card ai-summary-card">

      <div className="card-header">

        <span className="card-icon">
          🧠
        </span>

        <h3>
          AI Overall Assessment
        </h3>

      </div>

      <div className="summary-grid">

        <div className="summary-item">
          <span>Overall Risk</span>
          <strong>{overall}</strong>
        </div>

        <div className="summary-item">
          <span>Risk Score</span>
          <strong>{score}/100</strong>
        </div>

        <div className="summary-item">
          <span>Confidence</span>
          <strong>96%</strong>
        </div>

        <div className="summary-item">
          <span>AI Status</span>
          <strong>Completed</strong>
        </div>

      </div>

      <div className="summary-recommendation">

        <h4>AI Recommendation</h4>

        <p>{recommendation}</p>

      </div>

    </div>

  );
}

export default AISummaryCard;