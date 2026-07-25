import { useState } from "react";
import api from "../services/api";
import "../styles/Forms.css";

import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AnalysisContext } from "../context/AnalysisContext";

function UploadVideo() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [analysisData, setAnalysisData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const { saveAnalysis } = useContext(AnalysisContext);

  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setMessage("");
    }
  };

  const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a video first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

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
      console.log("========== BACKEND RESPONSE ==========");
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

      // Optional: keep local state if you want
      setAnalysisData(response.data);

      setMessage("✅ Analysis Completed Successfully!");

      setLoading(false);

      setFile(null);
      setFileName("");

      // Give user a brief success message, then navigate
      setTimeout(() => {
          navigate("/dashboard/analysis");
      }, 1000);
    } catch (error) {
      console.error(error);

      setLoading(false);

      setMessage("❌ Upload Failed.");
    }
  };

  return (
    <div className="page-container">

      <div className="upload-card">

        <h1>📹 Upload Athlete Video</h1>

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

          <label
            htmlFor="video-upload"
            className="upload-box"
          >

            <div className="upload-icon">
              🎥
            </div>

            <h2>Drag & Drop Video</h2>

            <p>or click here to browse</p>

            <input
              id="video-upload"
              type="file"
              accept="video/*"
              hidden
              onChange={handleFileChange}
            />

          </label>

          {fileName && (

            <div className="selected-file">

              <h3>Selected File</h3>

              <p>{fileName}</p>

            </div>

          )}

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

        {message && (
          <div className="upload-message">
            {message}
          </div>
        )}

      </div>

      {loading && (

        <div className="loading-card">

          <div className="loader"></div>

          <h2>{loadingText}</h2>

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