import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Ruler, Weight, Cake, Trophy } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { StatChip } from "../components/ui/StatCard";
import Tabs from "../components/ui/Tabs";
import InjuriesPanel from "../components/panels/InjuriesPanel";
import PerformancePanel from "../components/panels/PerformancePanel";
import AssessmentsPanel from "../components/panels/AssessmentsPanel";
import TrainingLoadPanel from "../components/panels/TrainingLoadPanel";
import VideosPanel from "../components/panels/VideosPanel";
import RiskAssessmentPanel from "../components/panels/RiskAssessmentPanel";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "videos", label: "Video Analysis" },
  { value: "risk", label: "Risk Assessment" },
  { value: "injuries", label: "Injuries" },
  { value: "performance", label: "Performance" },
  { value: "assessments", label: "Assessments" },
  { value: "training", label: "Training Load" },
];

export default function AthleteDetail() {
  const { profileId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    api
      .get(`/athletes/${profileId}`)
      .then((res) => setProfile(res.data))
      .catch(() => setError("Could not load this athlete's profile."));
  }, [profileId]);

  // Write permissions mirror exactly what the backend enforces -- this only
  // controls whether the "Add" button renders; the server is the real gate.
  const canWrite = {
    videos: ["coach", "physiotherapist", "sports_scientist", "admin"].includes(user.role),
    risk: ["physiotherapist", "sports_scientist", "admin"].includes(user.role),
    injuries: ["physiotherapist", "admin"].includes(user.role),
    performance: ["coach", "sports_scientist", "admin"].includes(user.role),
    assessments: ["physiotherapist", "sports_scientist", "admin"].includes(user.role),
    training: ["coach", "admin"].includes(user.role),
  };

  if (error) return <p className="text-sm text-coral">{error}</p>;
  if (!profile) return <p className="text-sm text-muted">Loading athlete...</p>;

  return (
    <div>
      <Link to="/athletes" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-paper transition-colors mb-4">
        <ArrowLeft size={14} /> Back to athletes
      </Link>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center text-ink font-display font-bold text-xl shrink-0">
            {profile.user.full_name[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold text-paper">{profile.user.full_name}</h1>
            <p className="text-sm text-muted mt-0.5">
              {profile.sport_type || "Sport not set"}{profile.position ? ` · ${profile.position}` : ""}
            </p>
          </div>
        </div>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatChip label="Height" value={profile.height_cm ?? "—"} unit={profile.height_cm ? "cm" : ""} icon={<Ruler size={14} className="text-muted" />} fill="glass" />
          <StatChip label="Weight" value={profile.weight_kg ?? "—"} unit={profile.weight_kg ? "kg" : ""} icon={<Weight size={14} className="text-muted" />} fill="glass" />
          <StatChip label="Age" value={profile.age ?? "—"} unit={profile.age ? "yrs" : ""} icon={<Cake size={14} className="text-muted" />} fill="glass" />
          <StatChip label="Sport" value={profile.sport_type || "—"} icon={<Trophy size={14} className="text-ink/70" />} fill="brand" />
        </div>
      )}
      {tab === "videos" && <VideosPanel profileId={profile.id} canWrite={canWrite.videos} />}
      {tab === "risk" && <RiskAssessmentPanel profileId={profile.id} canCompute={canWrite.risk} />}
      {tab === "injuries" && <InjuriesPanel profileId={profile.id} canWrite={canWrite.injuries} />}
      {tab === "performance" && <PerformancePanel profileId={profile.id} canWrite={canWrite.performance} />}
      {tab === "assessments" && <AssessmentsPanel profileId={profile.id} canWrite={canWrite.assessments} />}
      {tab === "training" && <TrainingLoadPanel profileId={profile.id} canWrite={canWrite.training} />}
    </div>
  );
}
