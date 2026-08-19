import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import api from "../../api";
import Modal from "../ui/Modal";
import { StatChip } from "../ui/StatCard";
import Card from "../ui/Card";

const JOINT_LABELS = {
  left_knee_angle: "Left Knee", right_knee_angle: "Right Knee",
  left_hip_angle: "Left Hip", right_hip_angle: "Right Hip",
  left_elbow_angle: "Left Elbow", right_elbow_angle: "Right Elbow",
  trunk_lean_angle: "Trunk Lean",
};

export default function VideoAnalysisModal({ profileId, videoId, onClose }) {
  const [video, setVideo] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [frames, setFrames] = useState(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get(`/athletes/${profileId}/videos/${videoId}`),
      api.get(`/athletes/${profileId}/videos/${videoId}/analysis`),
      api.get(`/athletes/${profileId}/videos/${videoId}/frames`),
      // <video src> can't send an Authorization header, and this endpoint is
      // auth-protected like everything else -- so we fetch it as a blob
      // (with the normal authenticated axios instance) and hand the player
      // an object URL instead of the raw API URL.
      api.get(`/athletes/${profileId}/videos/${videoId}/annotated`, { responseType: "blob" }),
    ])
      .then(([v, a, f, annotated]) => {
        setVideo(v.data);
        setAnalysis(a.data);
        setFrames(f.data);
        setVideoBlobUrl(URL.createObjectURL(annotated.data));
      })
      .catch(() => setError("Could not load this video's analysis."));

    return () => {
      if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, videoId]);

  const chartData = frames
    ? frames.map((f) => ({
        t: f.timestamp_seconds,
        left_knee_angle: f.left_knee_angle,
        right_knee_angle: f.right_knee_angle,
      }))
    : [];

  const hasKneeData = analysis?.joint_angles?.left_knee_angle || analysis?.joint_angles?.right_knee_angle;

  return (
    <Modal open onClose={onClose} title={video?.original_filename || "Video analysis"} width="max-w-3xl">
      {error && <p className="text-coral text-sm">{error}</p>}
      {!video || !analysis || !videoBlobUrl ? (
        <p className="text-sm text-muted">Loading analysis...</p>
      ) : (
        <div className="space-y-6">
          <video
            controls
            src={videoBlobUrl}
            className="w-full rounded-xl border border-line bg-black"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatChip label="Frames analyzed" value={video.analyzed_frame_count ?? "—"} unit={`/ ${video.frame_count ?? "—"}`} fill="glass" />
            <StatChip
              label="Knee symmetry"
              value={analysis.knee_symmetry_score ?? "—"}
              unit={analysis.knee_symmetry_score !== null ? "° diff" : ""}
              fill={analysis.knee_symmetry_score !== null && analysis.knee_symmetry_score > 15 ? "coral" : "glass"}
            />
            <StatChip
              label="Avg trunk lean"
              value={analysis.joint_angles?.trunk_lean_angle?.avg ?? "—"}
              unit={analysis.joint_angles?.trunk_lean_angle ? "°" : ""}
              fill="glass"
            />
            <StatChip label="Duration" value={video.duration_seconds ?? "—"} unit={video.duration_seconds ? "s" : ""} fill="brand" />
          </div>

          {hasKneeData && (
            <Card>
              <p className="text-xs uppercase tracking-wide text-muted mb-3">Knee angle over time</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                  <XAxis dataKey="t" tick={{ fill: "#8892AB", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} label={{ value: "seconds", position: "insideBottom", offset: -2, fill: "#8892AB", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#8892AB", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} domain={[0, 190]} />
                  <Tooltip contentStyle={{ background: "rgba(15,20,32,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#8892AB" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="left_knee_angle" name="Left knee" stroke="#22D3C7" strokeWidth={2} dot={false} connectNulls />
                  <Line type="monotone" dataKey="right_knee_angle" name="Right knee" stroke="#7C6FFF" strokeWidth={2} dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          <Card>
            <p className="text-xs uppercase tracking-wide text-muted mb-3">All joint angle ranges</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {Object.entries(analysis.joint_angles).map(([key, stats]) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <span className="text-muted text-xs">{JOINT_LABELS[key] || key}</span>
                  {stats ? (
                    <span className="font-mono text-paper">
                      {stats.min}&deg;&ndash;{stats.max}&deg;
                      <span className="text-muted text-xs ml-1">(avg {stats.avg}&deg;)</span>
                    </span>
                  ) : (
                    <span className="text-muted text-xs">Not visible in this clip</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </Modal>
  );
}
