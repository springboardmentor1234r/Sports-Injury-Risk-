import React from "react";

function JointAnglesCard({ jointAngles }) {
  if (!jointAngles) return null;

  const joints = [
    {
      name: "Left Elbow",
      value: jointAngles.left_elbow,
      icon: "💪",
    },
    {
      name: "Left Knee",
      value: jointAngles.left_knee,
      icon: "🦵",
    },
    {
      name: "Left Hip",
      value: jointAngles.left_hip,
      icon: "🦴",
    },
  ];

  return (
    <div className="card joint-card">
      <div className="card-header">
        <span className="card-icon">📐</span>
        <h3>Joint Angle Analysis</h3>
      </div>

      <div className="joint-list">
        {joints.map((joint) => (
          <div className="joint-row" key={joint.name}>
            <div className="joint-left">
              <span className="joint-icon">
                {joint.icon}
              </span>

              <span>{joint.name}</span>
            </div>

            <div className="joint-value">
              {joint.value}°
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default JointAnglesCard;