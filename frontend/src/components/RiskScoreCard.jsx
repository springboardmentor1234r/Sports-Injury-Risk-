import React from "react";

const RiskScoreCard = ({ riskScore }) => {

    if (!riskScore) {
        return null;
    }

    const { overall_score, risk_level } = riskScore;

    let badgeClass = "risk-low";
    let status = "Excellent";

    if (risk_level === "Moderate") {
        badgeClass = "risk-medium";
        status = "Needs Attention";
    }

    if (risk_level === "High") {
        badgeClass = "risk-high";
        status = "High Risk";
    }

    return (

        <div className="card risk-card">

            <div className="card-header">

                <span className="card-icon"></span>

                <h3>Overall Risk Score</h3>

            </div>

            <div className="risk-content">

                <div className="risk-circle">

                    {overall_score}

                </div>

                <div className="risk-info">

                    <div className={`risk-badge ${badgeClass}`}>
                        {risk_level}
                    </div>

                    <h4>{status}</h4>

                    <p>
                        Athlete movement is stable with minimal injury risk.
                    </p>

                </div>

            </div>

        </div>

    );

};

export default RiskScoreCard;