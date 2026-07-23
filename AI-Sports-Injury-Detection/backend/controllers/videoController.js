const path = require("path");
const fs = require("fs");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const Video = require("../models/video");
const Analysis = require("../models/Analysis");

// =========================
// Upload Video + Run AI
// =========================
const uploadVideo = async (req, res) => {
  try {
    const { athlete, sport } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a video",
      });
    }

    const video = await Video.create({
      athlete,
      uploadedBy: req.user.id,
      videoUrl: req.file.path,
      publicId: req.file.filename,
      sport,
      status: "Uploaded",
    });

    const aiPath = path.join(__dirname, "../../ai");
    const script = "python utils/pose_detector.py";

    const { stdout, stderr } = await exec(script, { cwd: aiPath });

    if (stdout) {
      console.log(stdout);
    }

    if (stderr) {
      console.error(stderr);
    }

    const reportPath = path.join(aiPath, "reports", "report.json");
    if (!fs.existsSync(reportPath)) {
    throw new Error("AI report.json not found");
    }

    const report = JSON.parse(
    fs.readFileSync(reportPath, "utf8")
    );

    const analysis = await Analysis.create({
      athlete,
      video: video._id,
      riskScore: report["Risk Score"]?.Average || 0,
      movementScore: report["Movement Score"] || 0,
      movementQuality: report["Movement Quality"] || "Unknown",
      mlPrediction: report["Prediction"] || "Unknown",
      runningPhase: report["Running Phase"] || "Unknown",
      symmetry: {
        knee: report["Symmetry"]?.knee || "Unknown",
        elbow: report["Symmetry"]?.elbow || "Unknown",
      },
      recommendations: report["Recommendations"] || [],
      reportJson: "reports/report.json",
      reportTxt: "outputs/report.txt",
      graphImage: "outputs/knee_angles_graph.png",
      processedVideo: "outputs/output_video.mp4",
      status: "Completed",
    });

    video.status = "Completed";
    await video.save();

    return res.status(201).json({
      success: true,
      message: "Video uploaded and analyzed successfully.",
      video,
      analysis,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Video upload failed",
    });
  }
};

// =========================
// Get All Videos
// =========================
const getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find()
      .populate("athlete", "name sport")
      .populate("uploadedBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: videos.length,
      videos,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch videos",
    });
  }
};

module.exports = {
  uploadVideo,
  getAllVideos,
};