import React, { useContext } from "react";

import AISummaryCard from "../components/AISummaryCard";
import JointAnglesCard from "../components/JointAnglesCard";
import PredictionCard from "../components/PredictionCard";
import AnomalyTable from "../components/AnomalyTable";
import BodyHeatmap from "../components/BodyHeatmap";
import RecommendationCard from "../components/RecommendationCard";
import DownloadReportCard from "../components/DownloadReportCard";
import RiskGauge from "../components/RiskGauge";
import VideoPreviewCard from "../components/VideoPreviewCard";

import { AnalysisContext } from "../context/AnalysisContext";

import "../styles/AnalysisComponents.css";
import "../styles/Analysis.css";

function Analysis() {

    const { analysis } = useContext(AnalysisContext);

    if (!analysis) {
        return (
            <div className="analysis-page">

                <h2>No Analysis Available</h2>

                <p>
                    Please upload and analyse a video first.
                </p>

            </div>
        );
    }

    return (

        <div className="analysis-page">

            {/* =====================================
                PAGE HEADER
            ===================================== */}

            <div className="analysis-header">

                <h1>
                    AI Movement Analysis
                </h1>

                <p>
                    Complete pose estimation, injury prediction
                    and performance assessment.
                </p>

            </div>


            {/* =====================================
                AI OVERALL ASSESSMENT
            ===================================== */}

            <AISummaryCard
                riskScore={analysis.risk_score}
                prediction={analysis.injury_prediction}
                recommendations={analysis.recommendations}
            />


            {/* =====================================
                MAIN ANALYSIS
                Risk Gauge + Heatmap + AI Recommendations

                (JointAnglesCard moved down to middle-grid —
                it's by far the tallest of the three original
                top cards, which was leaving Risk Gauge and
                Body Heatmap with a lot of empty space below
                them. RecommendationCard is shorter and sits
                here instead.)
            ===================================== */}

            <div className="top-grid">

                <div className="grid-gauge">

                    <RiskGauge
                        riskScore={analysis.risk_score}
                    />

                </div>


                <div className="grid-heatmap">

                    <BodyHeatmap
                        prediction={analysis.injury_prediction}
                    />

                </div>


                <div className="grid-recommendation">

                    <RecommendationCard
                        recommendations={analysis.recommendations}
                    />

                </div>

            </div>


            {/* =====================================
                AI INSIGHTS
                Prediction + Anomalies + Joint Angles
            ===================================== */}

            <div className="middle-grid">

                <PredictionCard
                    prediction={analysis.injury_prediction}
                />


                <AnomalyTable
                    anomalies={analysis.movement_anomalies}
                />


                <JointAnglesCard
                    jointAngles={analysis.joint_angles}
                />

            </div>


            {/* =====================================
                OUTPUTS
                Report + Video
            ===================================== */}

            <div className="bottom-grid">

                <DownloadReportCard
                    reportPath={analysis.report}
                />


                <VideoPreviewCard
                    analysis={analysis}
                />

            </div>

        </div>

    );
}

export default Analysis;
