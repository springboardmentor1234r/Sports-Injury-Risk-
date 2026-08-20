import { useState, useEffect, useContext } from "react";
import api from "../services/api";
import "../styles/Forms.css";

import { useNavigate } from "react-router-dom";
import { AnalysisContext } from "../context/AnalysisContext";

function UploadVideo() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [analysisData, setAnalysisData] = useState(null);

  const [athletes, setAthletes] = useState([]);
  const [selectedAthlete, setSelectedAthlete] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const { saveAnalysis } = useContext(AnalysisContext);
  const navigate = useNavigate();

  // ==========================================================
  // Get logged-in user
  // ==========================================================

  const currentUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isAthlete = currentUser.role === "athlete";

  // ==========================================================
  // Load athletes only for Admin / Coach
  // ==========================================================

  useEffect(() => {
    if (isAthlete) {
      // Athlete automatically selects their own account
      setSelectedAthlete(currentUser.email);
    } else {
      // Admin / Coach can select an athlete
      fetchAthletes();
    }
  }, []);

  const fetchAthletes = async () => {
    try {
      const response = await api.get("/users");

      const athleteUsers = response.data.filter(
        (user) => user.role === "athlete"
      );

      setAthletes(athleteUsers);
    } catch (error) {
      console.error("Unable to fetch athletes:", error);
    }
  };

  // ==========================================================
  // File selection
  // ==========================================================

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setMessage("");
    }
  };

  // ==========================================================
  // Delay helper
  // ==========================================================

  const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // ==========================================================
  // Upload Video
  // ==========================================================

  const handleUpload = async (e) => {
    e.preventDefault();

    // Athlete's email is automatically selected.
    // Admin / Coach must select an athlete.
    if (!selectedAthlete) {
      alert("Please select an athlete.");
      return;
    }

    if (!file) {
      alert("Please select a video first.");
      return;
    }

    const formData = new FormData();

    formData.append("file", file);

    formData.append(
      "athlete_email",
      selectedAthlete
    );

    try {
      setLoading(true);

      setLoadingText("Uploading Video...");
      await sleep(600);

      setLoadingText("Detecting Pose...");
      await sleep(600);

      const response = await api.post(
        "/upload-video",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log(
        "========== BACKEND RESPONSE =========="
      );

      console.log(response.data);

      setLoadingText("Analyzing Joint Angles...");
      await sleep(600);

      setLoadingText("Predicting Injury Risk...");
      await sleep(600);

      setLoadingText("Generating AI Report...");
      await sleep(600);

      console.log(
        "Processed Video:",
        response.data.processed_video
      );

      // Save backend response globally
      saveAnalysis(response.data);

      // Keep local state
      setAnalysisData(response.data);

      setMessage(
        "Analysis Completed Successfully!"
      );

      setLoading(false);

      setFile(null);
      setFileName("");

      // Navigate to Analysis page
      setTimeout(() => {
        navigate("/dashboard/analysis");
      }, 1000);

    } catch (error) {
      console.error(error);

      setLoading(false);

      setMessage("Upload Failed.");
    }
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="page-container">

      <div className="upload-card">

        <h1>Upload Athlete Video</h1>

        <p>
          Upload a sports performance video to let
          our AI detect pose, analyze movement,
          predict injury risk, and generate a
          professional report.
        </p>

        <form
          className="upload-form"
          onSubmit={handleUpload}
        >

          {/* ==================================================
              ATHLETE
              No dropdown - automatically use logged-in user
          ================================================== */}

          {isAthlete ? (

            <div className="input-group">

              <label>Uploading For</label>

              <input
                type="text"
                value={currentUser.name || currentUser.email}
                disabled
              />

            </div>

          ) : (

            /* ==================================================
               ADMIN / COACH
               Show athlete selection
            ================================================== */

            <div className="input-group">

              <label>Select Athlete</label>

              <select
                value={selectedAthlete}
                onChange={(e) =>
                  setSelectedAthlete(e.target.value)
                }
              >

                <option value="">
                  Choose Athlete
                </option>

                {athletes.map((athlete) => (

                  <option
                    key={athlete.email}
                    value={athlete.email}
                  >
                    {athlete.name}
                  </option>

                ))}

              </select>

            </div>

          )}

          {/* ==================================================
              VIDEO UPLOAD
          ================================================== */}

          <label
            htmlFor="video-upload"
            className="upload-box"
          >

            <div className="upload-icon">
              🎥
            </div>

            <h2>
              Drag & Drop Video
            </h2>

            <p>
              or click here to browse
            </p>

            <input
              id="video-upload"
              type="file"
              accept="video/*"
              hidden
              onChange={handleFileChange}
            />

          </label>

          {/* ==================================================
              SELECTED FILE
          ================================================== */}

          {fileName && (

            <div className="selected-file">

              <h3>
                Selected File
              </h3>

              <p>
                {fileName}
              </p>

            </div>

          )}

          {/* ==================================================
              ANALYZE BUTTON
          ================================================== */}

          <button
            className="upload-btn"
            type="submit"
            disabled={loading}
          >

            {loading
              ? "Analyzing..."
              : "Analyze Video"}

          </button>

        </form>

        {/* ==================================================
            SUCCESS / ERROR MESSAGE
        ================================================== */}

        {message && (

          <div className="upload-message">

            {message}

          </div>

        )}

      </div>

      {/* ======================================================
          LOADING CARD
      ====================================================== */}

      {loading && (

        <div className="loading-card">

          <div className="loader"></div>

          <h2>
            {loadingText}
          </h2>

          <p>
            Our AI is processing your athlete
            performance...
          </p>

        </div>

      )}

    </div>
  );
}

export default UploadVideo;