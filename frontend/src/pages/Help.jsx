import "../styles/Help.css";

function Help() {
  return (
    <div className="help-page">

      <div className="help-header">
        <h1>Help Center</h1>
        <p>
          Learn how to use the Sports Injury Risk Detection System.
        </p>
      </div>

      {/* Getting Started */}

      <div className="help-card">

        <h2>Getting Started</h2>

        <ol>
          <li>Login or Register to access the dashboard.</li>
          <li>Add a new athlete from the Athletes page.</li>
          <li>Upload a sports performance video.</li>
          <li>Allow the AI to analyze the athlete's movement.</li>
          <li>View the injury prediction and recommendations.</li>
          <li>Download the generated report.</li>
        </ol>

      </div>

      {/* AI Features */}

      <div className="help-card">

        <h2>AI Features</h2>

        <ul>
          <li>Pose Estimation using MediaPipe</li>
          <li>Joint Angle Analysis</li>
          <li>Movement Quality Assessment</li>
          <li>Injury Risk Prediction</li>
          <li>AI Recommendations</li>
          <li>Risk Score Calculation</li>
          <li>Professional PDF Report Generation</li>
        </ul>

      </div>

      {/* FAQ */}

      <div className="help-card">

        <h2>Frequently Asked Questions</h2>

        <div className="faq">

          <h4>Which videos can I upload?</h4>
          <p>
            MP4, MOV and AVI sports performance videos are supported.
          </p>

          <h4>How long does analysis take?</h4>
          <p>
            Most videos are processed within a few seconds depending on their size.
          </p>

          <h4>Can I download reports?</h4>
          <p>
            Yes. Every completed analysis generates a downloadable PDF report.
          </p>

        </div>

      </div>

      {/* Technologies */}

      <div className="help-card">

        <h2>Technologies Used</h2>

        <div className="tech-grid">

          <span>React.js</span>
          <span>FastAPI</span>
          <span>OpenCV</span>
          <span>MediaPipe</span>
          <span>Python</span>
          <span>ReportLab</span>

        </div>

      </div>

      {/* Support */}

      <div className="help-card">

        <h2>Support</h2>

        <p>
          If you experience any issues while using the application,
          please contact the project administrator or your internship mentor.
        </p>

      </div>

    </div>
  );
}

export default Help;