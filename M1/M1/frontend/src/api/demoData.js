/**
 * DEMO DATA ONLY.
 * Everything in this file is placeholder content used to preview what the
 * dashboard will look like once the Video Processing, Pose Estimation, and
 * Injury Risk Prediction engines (Milestones 2-3) are wired up.
 *
 * Delete this file and swap the imports in Dashboard.jsx for real API calls
 * once those endpoints exist. Nothing here is read from or written to the
 * database.
 */

export const DEMO_STATS = {
  activeAthletes: 28,
  activeAthletesDelta: "+4 this month",
  videosUploaded: 142,
  videosPending: 12,
  highRiskDetected: 3,
  processingLatency: "1.4s",
};

export const DEMO_RECENT_ANALYSES = [
  { athlete: "Sarah Connor", sport: "Track & Field", risk: "High Risk", finding: "Left Knee Valgus", processed: "Just now" },
  { athlete: "Marcus Wright", sport: "Basketball", risk: "Low Risk", finding: "Ankle Dorsiflexion", processed: "2 hours ago" },
  { athlete: "Priya Nair", sport: "Football", risk: "Moderate Risk", finding: "Hip Asymmetry", processed: "5 hours ago" },
  { athlete: "Daniel Osei", sport: "Sprinting", risk: "Low Risk", finding: "Stride Symmetry Normal", processed: "Yesterday" },
];

export const DEMO_SYSTEM_STATUS = [
  { name: "API Service", status: "Online" },
  { name: "Database", status: "Online" },
  { name: "Video Processing Queue", status: "Idle" },
];
