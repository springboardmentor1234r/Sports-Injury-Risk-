import React from "react";

function JointAnglesCard({ jointAngles }) {

  if (!jointAngles) return null;

  const joints = [
    {
      name: "Left Elbow",
      value: jointAngles.left_elbow
    },
    {
      name: "Left Knee",
      value: jointAngles.left_knee
    },
    {
      name: "Left Hip",
      value: jointAngles.left_hip
    },
  ];

  return (

    <div className="card joint-card">

      <div className="card-header">

      

        <h3>
          Joint Angle Analysis
        </h3>

      </div>

      <div className="joint-list">

        {joints.map((joint) => (

          <div className="joint-row" key={joint.name}>

            <div className="joint-info">

              <span className="joint-icon">
                {joint.icon}
              </span>

              <span className="joint-name">
                {joint.name}
              </span>

            </div>

            <span className="joint-value">
              {joint.value}°
            </span>

          </div>

        ))}

      </div>

    </div>

  );

}

export default JointAnglesCard;