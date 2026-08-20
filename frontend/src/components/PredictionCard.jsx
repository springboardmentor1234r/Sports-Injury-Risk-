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

  const getIcon = (label) => {
    switch (label) {
      case "ACL Injury":
        return "🦵";
      case "Hamstring":
        return "🏃";
      case "Ankle Sprain":
        return "🦶";
      case "Shoulder":
        return "💪";
      case "Lower Back":
        return "🧍";
      default:
        return "⚕️";
    }
  };

  const getDescription = (risk) => {
    switch (risk?.toLowerCase()) {
      case "high":
        return "Immediate attention recommended";
      case "medium":
      case "moderate":
        return "Monitor movement pattern";
      default:
        return "Movement appears stable";
    }
  };

  const predictions = [
    {
      label: "ACL Injury",
      value: prediction.acl_risk,
    },
    {
      label: "Hamstring",
      value: prediction.hamstring_risk,
    },
    {
      label: "Ankle Sprain",
      value: prediction.ankle_sprain_risk,
    },
    {
      label: "Shoulder",
      value: prediction.shoulder_risk,
    },
    {
      label: "Lower Back",
      value: prediction.lower_back_risk,
    },
  ];

  return (
    <div className="card prediction-card">

      <div className="card-header">

        <h3>AI Injury Prediction</h3>

      </div>

      <div className="prediction-list">

        {predictions.map((item) => (

          <div
            key={item.label}
            className="prediction-row"
          >

            <div className="prediction-left">

              <div className="prediction-icon">

                {getIcon(item.label)}

              </div>

              <div>

                <div className="prediction-name">

                  {item.label}

                </div>

                <div className="prediction-description">

                  {getDescription(item.value)}

                </div>

              </div>

            </div>

            <div
              className={`prediction-badge ${getRiskClass(item.value)}`}
            >

              {item.value}

            </div>

          </div>

        ))}

      </div>

      <div className="prediction-summary">

        <h4>💡 Overall Assessment</h4>

        <p>

          AI analyzed your movement pattern and identified the injury risks shown above.
          Continue following the recommended preventive measures.

        </p>

      </div>

    </div>
  );
}

export default PredictionCard;