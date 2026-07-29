import { useState } from "react";
import { Upload, CheckCircle, Video } from "lucide-react";
import api from "../services/api";

export default function UploadVideo() {

    const [file, setFile] = useState(null);
    const [videoURL, setVideoURL] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [selectedJoint, setSelectedJoint] = useState(null);
    const backendURL = "http://127.0.0.1:8000";

    const handleFileChange = (e) => {

        const selected = e.target.files[0];

        if (!selected) return;

        setFile(selected);

        setVideoURL(URL.createObjectURL(selected));
    };

    const handleUpload = async () => {

        if (!file) {
            alert("Please select a video first.");
            return;
        }

        try {

            setLoading(true);

            const token = localStorage.getItem("token");

            const formData = new FormData();

            formData.append("file", file);

            const response = await api.post(
                "/video/upload",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log(response.data);

            setResult(response.data);

            alert("Video Uploaded Successfully!");

        }
        catch (err) {

            console.log(err);

            if (err.response) {

                alert(
                    `Upload Failed

Status : ${err.response.status}

${JSON.stringify(err.response.data)}`
                );

            } else {

                alert("Server not reachable.");

            }

        }
        finally {

            setLoading(false);

        }

    };

    const downloadReport = (videoId) => {
  const token = localStorage.getItem("token");

  fetch(`http://127.0.0.1:8000/video/report/${videoId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.blob())
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "Sports_Injury_Report.pdf";
      a.click();

      window.URL.revokeObjectURL(url);
    });
};

    return ( <>
  <div className="min-h-screen bg-[#050816] flex justify-center items-center px-6 py-12">
    <div className="w-full max-w-5xl bg-white/5 border border-white/10 rounded-3xl p-10">

      <h1 className="text-4xl font-bold text-white">
        Upload Sports Video
      </h1>

      <p className="text-gray-400 mt-3">
        Upload a sports video for AI Pose Estimation
      </p>

      <label
        htmlFor="video-upload"
        className="mt-8 border-2 border-dashed border-blue-500 rounded-2xl p-12 flex flex-col justify-center items-center cursor-pointer hover:border-blue-300 transition-all duration-300"
      >
        <Upload size={70} className="text-blue-400" />

        <h2 className="text-white text-xl font-semibold mt-5">
          Click anywhere to upload video
        </h2>

        <p className="text-gray-400 mt-2">
          MP4 / AVI / MOV
        </p>

        {file && (
          <div className="mt-6 bg-blue-500/10 px-5 py-3 rounded-xl">
            <p className="text-blue-300 font-semibold">
              {file.name}
            </p>
          </div>
        )}

        <input
          id="video-upload"
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {videoURL && (
        <div className="mt-10">

          <h2 className="text-white text-2xl font-bold mb-4">
            Original Video
          </h2>

          <video
            controls
            width="100%"
            className="rounded-2xl border border-gray-700"
          >
            <source src={videoURL} type="video/mp4" />
          </video>

        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={loading}
        className="w-full mt-10 bg-blue-600 hover:bg-blue-700 transition rounded-xl py-4 text-white font-bold text-lg"
      >
        {loading
          ? "Uploading & Running Pose Estimation..."
          : "Upload Video"}
      </button>

      {result && (
        <div className="mt-12">

          <div className="flex items-center gap-3 mb-6">
            <CheckCircle
              className="text-green-400"
              size={30}
            />

            <h2 className="text-green-400 text-2xl font-bold">
              Upload Successful
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">

            <div className="bg-white/5 p-5 rounded-xl">
              <h3 className="text-gray-400">Filename</h3>
              <p className="text-white font-bold mt-2">
                {result.filename}
              </p>
            </div>

            <div className="bg-white/5 p-5 rounded-xl">
              <h3 className="text-gray-400">Video ID</h3>
              <p className="text-white font-bold mt-2">
                {result.id}
              </p>
            </div>

            <div className="bg-white/5 p-5 rounded-xl">
              <h3 className="text-gray-400">Athlete ID</h3>
              <p className="text-white font-bold mt-2">
                {result.athlete_id}
              </p>
            </div>

            <div className="bg-white/5 p-5 rounded-xl">
              <h3 className="text-gray-400">Uploaded</h3>
              <p className="text-white font-bold mt-2">
                {new Date(result.uploaded_at).toLocaleString()}
              </p>
            </div>

          </div>

          {result.analysis && (
            <>
              <h2 className="text-blue-400 text-2xl font-bold mt-12 mb-6">
                Pose Estimation Result
              </h2>

              <div className="grid md:grid-cols-3 gap-6">

                <div className="bg-blue-500/10 rounded-xl p-6 text-center">
                  <Video
                    className="mx-auto text-blue-400"
                    size={45}
                  />

                  <h3 className="text-gray-300 mt-4">
                    Total Frames
                  </h3>

                  <p className="text-4xl text-white font-bold mt-2">
                    {result.analysis.frames}
                  </p>
                </div>

                <div className="bg-green-500/10 rounded-xl p-6 text-center">
                  <CheckCircle
                    className="mx-auto text-green-400"
                    size={45}
                  />

                  <h3 className="text-gray-300 mt-4">
                    Pose Detected
                  </h3>

                  <p className="text-4xl text-white font-bold mt-2">
                    {result.analysis.pose_detected}
                  </p>
                </div>

                <div className="bg-purple-500/10 rounded-xl p-6 text-center">
                  <h3 className="text-gray-300">
                    Success Rate
                  </h3>

                  <p className="text-5xl text-purple-400 font-bold mt-6">
                    {result.analysis.success_rate}%
                  </p>
                </div>

              </div>
              {/* ================= Joint Angles ================= */}

<div className="mt-12">

    <h2 className="text-2xl font-bold text-cyan-400 mb-6">
        Joint Angles
    </h2>

    <div className="grid md:grid-cols-3 gap-5">

        {
            Object.entries(result.analysis.joint_angles).map(
                ([joint, angle]) => (

                    <div
                        key={joint}
                        onClick={() => setSelectedJoint({ joint, angle })}
                        className="bg-cyan-500/10 rounded-xl p-5 border border-cyan-500/20 hover:bg-cyan-500/20 transition cursor-pointer"
                    > 

                        <h3 className="text-gray-300 capitalize">

                            {joint.replace("_", " ")}

                        </h3>

                        <p className="text-4xl font-bold text-cyan-300 mt-3">

                            {Number(angle).toFixed(1)}°

                        </p>

                    </div>

                )
            )
        }

    </div>

</div>
{/* ================= Risk Analysis ================= */}

<div className="mt-12">

  <h2 className="text-2xl font-bold text-red-400 mb-6">
    Injury Risk Analysis
  </h2>
  {/* -------------------- */}
{/* Biomechanics Analysis */}
{/* -------------------- */}

{result.analysis.biomechanics && (
<div className="mt-8">

    <h2 className="text-3xl font-bold text-cyan-400  mb-6">
        🦵 Biomechanics Analysis
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <div className="bg-[#13283b] rounded-xl p-6 shadow-lg border border-cyan-700">
            <h3 className="text-lg font-semibold text-white mb-3">
                Range of Motion
            </h3>

            <p className="text-cyan-300">
                Average ROM
            </p>

            <p className="text-3xl font-bold text-cyan-400">
                {result.analysis.biomechanics.range_of_motion.average_rom}°
            </p>

            <p className="mt-2 text-gray-300">
                Status :
                <span className="text-green-400 font-bold ml-2">
                    {result.analysis.biomechanics.range_of_motion.status}
                </span>
            </p>
        </div>

        <div className="bg-[#13283b] rounded-xl p-6 shadow-lg border border-cyan-700">

            <h3 className="text-lg font-semibold text-white mb-3">
                Movement Symmetry
            </h3>

            <p className="text-cyan-300">
                Difference
            </p>

            <p className="text-3xl font-bold text-cyan-400">
                {result.analysis.biomechanics.movement_symmetry.difference}
            </p>

            <p className="mt-2 text-gray-300">
                Score :
                <span className="text-green-400 font-bold ml-2">
                    {result.analysis.biomechanics.movement_symmetry.symmetry_score}%
                </span>
            </p>

        </div>

        <div className="bg-[#13283b] rounded-xl p-6 shadow-lg border border-cyan-700">

            <h3 className="text-lg font-semibold text-white mb-3">
                Hip Stability
            </h3>

            <p className="text-cyan-300">
                Difference
            </p>

            <p className="text-3xl font-bold text-cyan-400">
                {result.analysis.biomechanics.hip_stability.difference}
            </p>

            <p className="mt-2 text-gray-300">
                Status :
                <span className="text-yellow-400 font-bold ml-2">
                    {result.analysis.biomechanics.hip_stability.status}
                </span>
            </p>

        </div>

        <div className="bg-[#13283b] rounded-xl p-6 shadow-lg border border-cyan-700">

            <h3 className="text-lg font-semibold text-white mb-3">
                Balance Score
            </h3>

            <p className="text-4xl font-bold text-green-400">
                {result.analysis.biomechanics.balance_score}
            </p>

        </div>

        <div className="bg-[#13283b] rounded-xl p-6 shadow-lg border border-cyan-700">

            <h3 className="text-lg font-semibold text-white mb-3">
                Joint Alignment
            </h3>

            <p className="text-2xl font-bold text-orange-400">
                {result.analysis.biomechanics.joint_alignment}
            </p>

        </div>

        <div className="bg-[#13283b] rounded-xl p-6 shadow-lg border border-cyan-700">

            <h3 className="text-lg font-semibold text-white mb-3">
                Movement Quality
            </h3>

            <p className="text-4xl font-bold text-green-400">
                {result.analysis.biomechanics.movement_quality}%
            </p>

        </div>
      
    </div>

</div>
)}


  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl mt-16 p-8">

    <div className="grid md:grid-cols-2 gap-8">

      <div>

        <h3 className="text-gray-400">
          Risk Score
        </h3>

        <p className="text-6xl font-bold text-red-400 mt-3">
          {result.analysis.risk_analysis.risk_score}%
        </p>

      </div>

      <div>

        <h3 className="text-gray-400">
          Risk Level
        </h3>

        <p
          className={`text-4xl font-bold mt-3 ${
            result.analysis.risk_analysis.risk_level === "High"
              ? "text-red-500"
              : result.analysis.risk_analysis.risk_level === "Medium"
              ? "text-yellow-400"
              : "text-green-400"
          }`}
        >
          {result.analysis.risk_analysis.risk_level}
        </p>

      </div>

    </div>

    <div className="mt-8">

      <h3 className="text-xl text-white font-semibold mb-4">
        Remarks
      </h3>

      <ul className="space-y-3">

        {result.analysis.risk_analysis.remarks.map((remark, index) => (

          <li
            key={index}
            className="bg-white/5 rounded-lg px-4 py-3 text-gray-300"
          >
            ✔ {remark}
          </li>

        ))}

      </ul>

    </div>

  </div>

</div>

{/* ================= Joint Details ================= */}

{selectedJoint && (

  <div className="mt-12 bg-white/5 border border-cyan-500/30 rounded-2xl p-8">

    <h2 className="text-2xl font-bold text-cyan-400 mb-6">
      Selected Joint Details
    </h2>

    <div className="grid md:grid-cols-2 gap-8">

      <div>

        <h3 className="text-gray-400">
          Joint
        </h3>

        <p className="text-3xl font-bold text-white mt-2 capitalize">
          {selectedJoint.joint.replace("_", " ")}
        </p>

      </div>

      <div>

        <h3 className="text-gray-400">
          Current Angle
        </h3>

        <p className="text-4xl font-bold text-cyan-300 mt-2">
          {Number(selectedJoint.angle).toFixed(2)}°
        </p>

      </div>

      <div>

        <h3 className="text-gray-400">
          Status
        </h3>

        <p
          className={`text-2xl font-bold mt-2 ${
            Number(selectedJoint.angle) < 90 ||
            Number(selectedJoint.angle) > 170
              ? "text-red-500"
              : "text-green-400"
          }`}
        >
          {Number(selectedJoint.angle) < 90 ||
          Number(selectedJoint.angle) > 170
            ? "Abnormal"
            : "Normal"}
        </p>

      </div>

      <div>

        <h3 className="text-gray-400">
          Recommendation
        </h3>

        <p className="text-white mt-2">

          {Number(selectedJoint.angle) < 90
            ? "Avoid excessive bending. Improve flexibility and posture."

            : Number(selectedJoint.angle) > 170
            ? "Possible over-extension. Reduce joint stress."

            : "Joint movement appears healthy."}

        </p>

      </div>
        
    </div>

  </div>

)}

              {result.analysis.processed_video && (
                <div className="mt-12">

                  <h2 className="text-yellow-400 text-2xl font-bold mb-5">
                    Processed Pose Video
                  </h2>

                  <video
                    controls
                    width="100%"
                    className="rounded-2xl border border-gray-700"
                  >
                    <source
                      src={`${backendURL}/${result.analysis.processed_video}`}
                      type="video/mp4"
                    />
                  </video>

                  <a
                    href={`${backendURL}/${result.analysis.processed_video}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-5 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl text-white font-bold"
                  >
                    Download Processed Video
                  </a>

                </div>
              )}
                {result && (
  <div className="mt-10 flex justify-center">
    <button
      onClick={() => downloadReport(result.id)}
      className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl shadow-lg font-bold"
    >
      📄 Download PDF Report
    </button>
  </div>
)}
            </>
          )}

        </div>
      )}

    </div>
  </div>
</>
);
}