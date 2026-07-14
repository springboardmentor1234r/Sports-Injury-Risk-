import { useState, useEffect } from "react";
import API from "../services/api";

function ViewVideos() {
  const [videos, setVideos] = useState([]);

  function fetchVideos() {
    const loadVideos = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await API.get("/videos", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setVideos(response.data.videos);
      } catch (error) {
        alert(error.response?.data?.message || "Failed to fetch videos");
      }
    };

    loadVideos();
  }

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <div>
      <h1>Uploaded Videos</h1>

      {videos.length === 0 ? (
        <p>No videos uploaded.</p>
      ) : (
        videos.map((video) => (
          <div
            key={video._id}
            style={{
              border: "1px solid gray",
              marginBottom: "20px",
              padding: "15px",
            }}
          >
            <h3>Athlete: {video.athlete?.name}</h3>
            <p>Sport: {video.sport}</p>
            <p>Uploaded By: {video.uploadedBy?.name}</p>
            <p>Status: {video.status}</p>

            <a href={video.videoUrl} target="_blank" rel="noreferrer">
              View Video
            </a>
          </div>
        ))
      )}
    </div>
  );
}

export default ViewVideos;