import React, { useState } from 'react';

function Analysis({ onBack }) {
  const [file, setFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!file) {
      alert("Please select an image first!");
      return;
    }

    setLoading(true);
    setImageSrc(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload-image/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        setImageSrc(URL.createObjectURL(blob));
      } else {
        alert("Failed to analyze the image. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Cannot connect to the backend server. Make sure FastAPI is running!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card analysis-card">
      <h2>AI Biomechanical Assessment</h2>
      <p>Upload athlete movement image for pose estimation and joint angle calculation.</p>
      
      <input 
        type="file" 
        accept="image/*" 
        onChange={(e) => setFile(e.target.files[0])} 
        style={{ margin: '20px 0', fontSize: '16px' }} 
      />
      <br />
      <button className="btn primary-btn" onClick={handleAnalyze}>Analyze Movement Performance</button>

      {loading && <div className="loader">Processing AI Model... Please wait ⏳</div>}
      
      {imageSrc && (
        <div>
          <img src={imageSrc} alt="Processed Result" className="result-image" />
        </div>
      )}

      <br />
      <button className="btn secondary-btn" onClick={onBack}>
        &lt;&lt; Back to Dashboard
      </button>
    </div>
  );
}

export default Analysis;