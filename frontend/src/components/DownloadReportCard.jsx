import React from "react";

function DownloadReportCard({ reportPath }) {
  if (!reportPath) return null;

  // Use the URL directly if it's already absolute,
  // otherwise prepend the backend URL.
  const reportURL = reportPath.startsWith("http")
    ? reportPath
    : `http://127.0.0.1:8000/${reportPath}`;

  return (
    <div className="card report-card">

      <div className="card-header">
        <span className="card-icon"></span>



        <h3>AI Analysis Report</h3>
      </div>

      <div className="report-content">


        <div className="report-icon">
          📑
        </div>

        <h2>Report Generated Successfully</h2>



        <p>
          Your AI injury analysis report contains:
        </p>

        <ul className="report-list">
          <li>✔ Overall Risk Score</li>
          <li>✔ Joint Angle Analysis</li>
          <li>✔ Injury Prediction</li>
          <li>✔ Movement Anomalies</li>
          <li>✔ AI Recommendations</li>
        </ul>

        <a
          href={reportURL}
          target="_blank"
          rel="noreferrer"
          download
        >
          <button className="download-btn">
            ⬇ Download PDF Report
          </button>
        </a>

      </div>

    </div>
  );
}

export default DownloadReportCard;