import { Link } from "react-router-dom";
import "../styles/Home.css";

function Home() {
  return (
    <div className="home">

      <section className="hero">

        <h1>Sports Injury Risk Detection from Video</h1>

        <p>
          Analyze athlete movements using AI-powered pose estimation,
          detect injury risks, and generate detailed performance reports.
        </p>

        <div className="hero-buttons">
          <Link to="/upload">
            <button className="primary-btn">Upload Video</button>
          </Link>

          <Link to="/dashboard">
            <button className="secondary-btn">View Dashboard</button>
          </Link>
        </div>

      </section>

      <section className="features">

        <div className="card">
          <h2>Pose Detection</h2>
          <p>
            Detect body landmarks using MediaPipe Pose for accurate movement analysis.
          </p>
        </div>

        <div className="card">
          <h2>Injury Prediction</h2>
          <p>
            Estimate possible injury risks based on athlete posture and joint angles.
          </p>
        </div>

        <div className="card">
          <h2>Performance Reports</h2>
          <p>
            Generate structured reports with recommendations for athletes and coaches.
          </p>
        </div>

      </section>

    </div>
  );
}

export default Home;