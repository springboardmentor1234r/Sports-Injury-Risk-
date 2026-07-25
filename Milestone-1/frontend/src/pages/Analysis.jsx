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

import "../styles/Analysis.css";

function Analysis() {

  const { analysis } = useContext(AnalysisContext);

  if (!analysis) {
    return (
      <div className="analysis-page">
        <h2>No Analysis Available</h2>
        <p>Please upload and analyze a video first.</p>
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

      <AISummaryCard
        riskScore={analysis.risk_score}
        prediction={analysis.injury_prediction}
        recommendations={analysis.recommendations}
      />

      <div className="analysis-grid">

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

      <div className="analysis-grid">

        <AnomalyTable
          anomalies={analysis.movement_anomalies}
        />

        <RecommendationCard
          recommendations={analysis.recommendations}
        />

      </div>

      <div className="analysis-grid">

        <ProcessedVideoCard
          videoPath={analysis.processed_video}
        />

        <DownloadReportCard
          reportPath={analysis.report}
        />

      </div>

    </div>
  );
}

export default Analysis;