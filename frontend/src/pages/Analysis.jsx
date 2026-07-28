import React, { useContext } from "react";

import AISummaryCard from "../components/AISummaryCard";
import RiskScoreCard from "../components/RiskScoreCard";
import JointAnglesCard from "../components/JointAnglesCard";
import PredictionCard from "../components/PredictionCard";
import AnomalyTable from "../components/AnomalyTable";
import RecommendationCard from "../components/RecommendationCard";
import ProcessedVideoCard from "../components/ProcessedVideoCard";
import DownloadReportCard from "../components/DownloadReportCard";

import { AnalysisContext } from "../context/AnalysisContext";
import "../styles/AnalysisComponents.css";
import "../styles/Analysis.css";

function Analysis() {

    const { analysis } = useContext(AnalysisContext);

    if (!analysis) {
        return (
            <div className="analysis-page">
                <h2>No Analysis Available</h2>
                <p>Please upload and analyse a video first.</p>
            </div>
        );
    }

    return (

        <div className="analysis-page">

            <div className="analysis-header">

                <h1>AI Movement Analysis</h1>

                <p>
                    Complete pose estimation, injury prediction and performance assessment.
                </p>

            </div>

            {/* Summary */}

            <AISummaryCard
                riskScore={analysis.risk_score}
                prediction={analysis.injury_prediction}
                recommendations={analysis.recommendations}
            />

            {/* Top Section */}

            <div className="top-grid">

                <RiskScoreCard
                    riskScore={analysis.risk_score}
                />

                <JointAnglesCard
                    jointAngles={analysis.joint_angles}
                />

                <PredictionCard
                    prediction={analysis.injury_prediction}
                />

            </div>

            {/* Middle Section */}

            <div className="middle-grid">

                <AnomalyTable
                    anomalies={analysis.movement_anomalies}
                />

                <RecommendationCard
                    recommendations={analysis.recommendations}
                />

            </div>

            {/* Bottom Section */}

            <div className="bottom-grid">

                <DownloadReportCard
                    reportPath={analysis.report}
                />

                <ProcessedVideoCard
                    videoPath={analysis.processed_video}
                />

            </div>

        </div>

    );

}

export default Analysis;