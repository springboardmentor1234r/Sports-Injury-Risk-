import React, { useContext } from "react";
import { AnalysisContext } from "../context/AnalysisContext";

import "../styles/Reports.css";

function Reports() {

  const { analysis } = useContext(AnalysisContext);

  if (!analysis) {
    return (
      <div className="reports-page">

        <h1>📄 Reports</h1>

        <div className="empty-report">

          <h2>No Reports Available</h2>

          <p>
            Upload a video to generate your first AI report.
          </p>

        </div>

      </div>
    );
  }

  const reportURL = `http://127.0.0.1:8000/${analysis.report}`;

  return (

    <div className="reports-page">

      <h1>📄 Reports</h1>

      <p>
        AI generated injury assessment reports.
      </p>

      <div className="report-card">

        <h2>{analysis.filename}</h2>

        <div className="report-info">

          <span>
            🟢 {analysis.risk_score.risk_level} Risk
          </span>

          <span>
            📊 Score: {analysis.risk_score.overall_score}/100
          </span>

        </div>

        <div className="report-buttons">

          <a
            href={reportURL}
            target="_blank"
            rel="noreferrer"
          >
            <button>
              👁 View
            </button>
          </a>

          <a
            href={reportURL}
            download
          >
            <button>
              ⬇ Download
            </button>
          </a>

        </div>

      </div>

    </div>

  );
}

export default Reports;