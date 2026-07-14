import { useState } from "react";
import API from "../services/api";

function UploadVideo() {
    const [video, setVideo] = useState(null);
    const [athlete, setAthlete] = useState("");
    const [sport, setSport] = useState("");

    const handleUpload = async () => {
        if (!video){
            alert("Please select a video first")
            return 
        }
        try {
            // get jwt token from local storage
            const token = localStorage.getItem("token");
            // create formData object
            const formData = new FormData();

            formData.append("video", video);
            formData.append("athlete", athlete);
            formData.append("sport", sport);

            const response = await API.post(
                "/videos/upload",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            alert(response.data.message);

            setVideo(null);
            setAthlete("");
            setSport("");

        } catch (error) {
            alert(error.response?.data?.message || "Upload Failed");
        }
    };

    return (
        <div>
            <h1>Upload Athlete Video</h1>

            <input
                type="text"
                placeholder="Athlete ID"
                value={athlete}
                onChange={(e) => setAthlete(e.target.value)}
            />

            <br /><br />

            <input
                type="text"
                placeholder="Sport"
                value={sport}
                onChange={(e) => setSport(e.target.value)}
            />

            <br /><br />

            <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideo(e.target.files[0])}
            />

            <br /><br />

            <button onClick={handleUpload}>
                Upload Video
            </button>

        </div>
    );
}

export default UploadVideo;