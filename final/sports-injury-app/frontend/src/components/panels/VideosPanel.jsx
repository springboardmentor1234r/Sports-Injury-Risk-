import { useEffect, useState, useRef, useCallback } from "react";
import { Plus, Trash2, Play, RotateCw, AlertCircle, Clock, Loader2 } from "lucide-react";
import api from "../../api";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import { Field, Select } from "../ui/FormField";
import VideoAnalysisModal from "./VideoAnalysisModal";

const ACTIVITY_TYPES = ["running", "sprinting", "jumping", "squatting", "landing", "throwing", "cutting", "sport_specific_drill", "other"];

const STATUS_CONFIG = {
  uploaded: { tone: "neutral", icon: Clock, label: "Queued" },
  processing: { tone: "amber", icon: Loader2, label: "Analyzing" },
  completed: { tone: "sage", icon: Play, label: "Ready" },
  failed: { tone: "coral", icon: AlertCircle, label: "Failed" },
};

// Videos still processing get polled periodically so the status badge
// updates without the user needing to refresh the page.
const POLL_INTERVAL_MS = 3000;

export default function VideosPanel({ profileId, canWrite }) {
  const [items, setItems] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activityType, setActivityType] = useState("running");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [openVideoId, setOpenVideoId] = useState(null);
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

  const load = useCallback(() => {
    api.get(`/athletes/${profileId}/videos`).then((res) => setItems(res.data));
  }, [profileId]);

  useEffect(load, [load]);

  // Poll while any video is still uploaded/processing
  useEffect(() => {
    const hasPending = items?.some((v) => v.status === "uploaded" || v.status === "processing");
    if (hasPending) {
      pollRef.current = setInterval(load, POLL_INTERVAL_MS);
      return () => clearInterval(pollRef.current);
    }
  }, [items, load]);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("activity_type", activityType);
      formData.append("file", file);
      await api.post(`/athletes/${profileId}/videos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setModalOpen(false);
      setFile(null);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not upload this video.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!confirm("Delete this video and its analysis? This cannot be undone.")) return;
    await api.delete(`/athletes/${profileId}/videos/${id}?profile_id=${profileId}`);
    load();
  }

  async function handleRetry(id, e) {
    e.stopPropagation();
    await api.post(`/athletes/${profileId}/videos/${id}/reprocess?profile_id=${profileId}`);
    load();
  }

  if (items === null) return <p className="text-sm text-muted">Loading videos...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{items.length} video{items.length !== 1 ? "s" : ""} uploaded</p>
        {canWrite && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={15} /> Upload video
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <EmptyState
            title="No movement videos yet"
            description="Upload a training or match clip to run pose estimation and biomechanical analysis on it."
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((v) => {
            const cfg = STATUS_CONFIG[v.status];
            const StatusIcon = cfg.icon;
            const clickable = v.status === "completed";
            return (
              <Card
                key={v.id}
                padded={false}
                onClick={() => clickable && setOpenVideoId(v.id)}
                className={`flex items-center justify-between px-4 py-3 ${clickable ? "cursor-pointer hover:bg-white/[0.03]" : ""} transition-colors`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
                    <StatusIcon size={15} className={v.status === "processing" ? "text-amber animate-spin" : "text-muted"} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-paper font-medium truncate">{v.original_filename}</p>
                    <p className="text-xs text-muted capitalize">
                      {v.activity_type.replace("_", " ")} &middot; {new Date(v.uploaded_at).toLocaleDateString()}
                      {v.duration_seconds ? ` · ${v.duration_seconds.toFixed(1)}s` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge tone={cfg.tone}>{cfg.label}</Badge>
                  {v.status === "failed" && canWrite && (
                    <button onClick={(e) => handleRetry(v.id, e)} className="text-muted hover:text-cyan transition-colors" aria-label="Retry processing" title="Retry">
                      <RotateCw size={15} />
                    </button>
                  )}
                  {canWrite && (
                    <button onClick={(e) => handleDelete(v.id, e)} className="text-muted hover:text-coral transition-colors" aria-label="Delete video">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Upload a movement video">
        {error && <div className="mb-4 px-3 py-2.5 bg-coral-soft border border-coral/30 rounded-xl text-coral text-sm">{error}</div>}
        <form onSubmit={handleUpload} className="space-y-4">
          <Field label="Activity type" required>
            <Select value={activityType} onChange={(e) => setActivityType(e.target.value)}>
              {ACTIVITY_TYPES.map((a) => <option key={a} value={a}>{a.replace("_", " ")}</option>)}
            </Select>
          </Field>
          <Field label="Video file" required hint="MP4, MOV, AVI, or MKV — up to 200MB">
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp4,.mov,.avi,.mkv,video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
              className="w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-soft file:text-cyan file:text-sm file:font-medium hover:file:bg-cyan/20 file:cursor-pointer cursor-pointer"
            />
          </Field>
          <p className="text-xs text-muted">
            Once uploaded, pose estimation runs automatically in the background — this can take anywhere from a few seconds to a couple of minutes depending on video length.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={uploading || !file}>{uploading ? "Uploading..." : "Upload & analyze"}</Button>
          </div>
        </form>
      </Modal>

      {openVideoId && (
        <VideoAnalysisModal
          profileId={profileId}
          videoId={openVideoId}
          onClose={() => setOpenVideoId(null)}
        />
      )}
    </div>
  );
}
