import { Link } from "react-router-dom";
import "../styles/Home.css";

function Home() {
  return (
    <div className="home">

      {/* Hero Section */}

      <section className="hero">

        <div className="hero-content">

          <h1>
            Sports Injury Risk Detection
          </h1>

          <p>
            AI-powered athlete performance analysis using
            computer vision, pose estimation, and injury
            prediction. Upload a sports video and receive
            a complete movement analysis with professional
            recommendations.
          </p>

          <div className="hero-buttons">

            <Link to="/dashboard/upload">
              <button className="primary-btn">
                Upload Video
              </button>
            </Link>

            <Link to="/dashboard">
              <button className="secondary-btn">
                View Dashboard
              </button>
            </Link>

          </div>

        </div>

      </section>

      {/* Features */}

      <section className="features">

        <div className="feature-card">

          

          <h2>Pose Detection</h2>

          <p>
            AI detects body landmarks using MediaPipe Pose
            for accurate movement analysis.
          </p>

        </div>

        <div className="feature-card">

    

          <h2>Injury Prediction</h2>

          <p>
            Analyze posture, joint angles, and athlete
            movement to estimate injury risks.
          </p>

        </div>

        <div className="feature-card">

          

          <h2>Performance Reports</h2>

          <p>
            Generate professional AI reports with
            recommendations for athletes and coaches.
          </p>

        </div>

      </section>

      {/* Workflow */}

      <section className="workflow">

        <h2>How It Works</h2>

        <div className="workflow-grid">

          <div className="workflow-step">

            <span>①</span>

            <h3>Upload Video</h3>

            <p>
              Upload an athlete performance video.
            </p>

          </div>

          <div className="workflow-step">

            <span>②</span>

            <h3>AI Analysis</h3>

            <p>
              Pose detection and movement analysis.
            </p>

          </div>

          <div className="workflow-step">

            <span>③</span>

            <h3>Risk Prediction</h3>

            <p>
              Detect possible injury risks.
            </p>

          </div>

          <div className="workflow-step">

            <span>④</span>

            <h3>Download Report</h3>

            <p>
              Receive a complete AI-generated report.
            </p>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Home;