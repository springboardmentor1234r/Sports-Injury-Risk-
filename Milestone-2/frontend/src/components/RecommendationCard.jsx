import React from "react";

function RecommendationCard({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="card recommendation-card">
      <div className="card-header">
        <span className="card-icon">💡</span>
        <h3>AI Recommendations</h3>
      </div>

      <div className="recommendation-list">
        {recommendations.map((item, index) => (
          <div
            className="recommendation-item"
            key={index}
          >
            <span className="recommendation-icon">
              ✔
            </span>

            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecommendationCard;