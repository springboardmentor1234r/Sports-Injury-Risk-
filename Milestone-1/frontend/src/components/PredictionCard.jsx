import React from "react";

function PredictionCard({ prediction }) {
  if (!prediction) return null;

  const getRiskClass = (risk) => {
    switch (risk?.toLowerCase()) {
      case "high":
        return "risk-high";
      case "medium":
      case "moderate":
        return "risk-medium";
      default:
        return "risk-low";
    }
  };

  const predictions = [
    {
      label: "ACL Injury",
      value: prediction.acl_risk,
      icon: "🦵",
    },
    {
      label: "Hamstring",
      value: prediction.hamstring_risk,
      icon: "🏃",
    },
    {
      label: "Ankle Sprain",
      value: prediction.ankle_sprain_risk,
      icon: "🦶",
    },
    {
      label: "Shoulder",
      value: prediction.shoulder_risk,
      icon: "💪",
    },
    {
      label: "Lower Back",
      value: prediction.lower_back_risk,
      icon: "🩻",
    },
  ];

  return (
    <div className="card prediction-card">
      <div className="card-header">
        <span className="card-icon">🚑</span>
        <h3>AI Injury Prediction</h3>
      </div>

      <div className="prediction-list">
        {predictions.map((item) => (
          <div className="prediction-row" key={item.label}>
            <div className="prediction-left">
              <span className="prediction-icon">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </div>

            <span
              className={`prediction-badge ${getRiskClass(
                item.value
              )}`}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PredictionCard;