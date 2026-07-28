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
      value: prediction.acl_risk
    },
    {
      label: "Hamstring",
      value: prediction.hamstring_risk
    },
    {
      label: "Ankle Sprain",
      value: prediction.ankle_sprain_risk
    },
    {
      label: "Shoulder",
      value: prediction.shoulder_risk
    },
    {
      label: "Lower Back",
      value: prediction.lower_back_risk
    },
  ];

  return (

    <div className="card prediction-card">

      <div className="card-header">

        <span className="card-icon">
        </span>

        <h3>
          AI Injury Prediction
        </h3>

      </div>

      <div className="prediction-list">

        {predictions.map((item) => (

          <div
            className="prediction-row"
            key={item.label}
          >

            <div className="prediction-info">

              <span className="prediction-icon">
                {item.icon}
              </span>

              <span className="prediction-name">
                {item.label}
              </span>

            </div>

            <span
              className={`prediction-badge ${getRiskClass(item.value)}`}
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