import React from "react";
import { Bone, Activity } from "lucide-react";

// Each joint has its own "normal" window instead of one shared 0-180 scale —
// 152° is Normal for a knee/hip near full extension but would be way out of
// range for an elbow, so status has to be evaluated per joint.
const JOINT_CONFIG = {
    left_elbow: { name: "Left Elbow", normalRange: [60, 130] },
    left_knee: { name: "Left Knee", normalRange: [140, 180] },
    left_hip: { name: "Left Hip", normalRange: [140, 180] }
};

const SCALE_MIN = 0;
const SCALE_MAX = 180;

function getStatus(value, [min, max]) {
    if (value < min) return "Low";
    if (value > max) return "High";
    return "Normal";
}

const STATUS_COLOR = {
    Low: "#ef4444",
    Normal: "#7CFC00",
    High: "#f59e0b"
};

function JointAnglesCard({ jointAngles }) {

    if (!jointAngles) return null;

    const joints = Object.keys(JOINT_CONFIG)
        .filter((key) => jointAngles[key] !== undefined && jointAngles[key] !== null)
        .map((key) => {
            const value = jointAngles[key];
            const { name, normalRange } = JOINT_CONFIG[key];
            const status = getStatus(value, normalRange);
            const percent = Math.min(
                100,
                Math.max(0, ((value - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100)
            );
            return { key, name, value, status, percent };
        });

    return (
        <div className="card jac-card">

            <div className="jac-header">
                <div>
                    <h3 className="jac-title">Joint Angle Analysis</h3>
                    <p className="jac-subtitle">Measured in Degrees (°)</p>
                </div>

                <span className="jac-live-badge">
                    <Activity size={14} />
                    Real-time Analysis
                </span>
            </div>

            <div className="jac-list">

                {joints.map((joint) => (

                    <div
                        className="jac-row"
                        key={joint.key}
                        style={{ "--jac-status-color": STATUS_COLOR[joint.status] }}
                    >

                        {/* top line: icon, name, value pill — fixed-height row */}
                        <div className="jac-row-top">

                            <span className="jac-icon">
                                <Bone size={26} />
                            </span>

                            <div className="jac-title-group">
                                <span className="jac-name">{joint.name}</span>
                                <span className="jac-sub">Flexion Angle</span>
                            </div>

                            <div className="jac-value-group">
                                <span className="jac-value">
                                    {joint.value.toFixed(2)}°
                                </span>
                                <span className="jac-status">{joint.status}</span>
                            </div>

                        </div>

                        {/* slider + scale — ALWAYS its own full-width row below,
                            never inline with the row above */}
                        <div className="jac-slider">

                            <div className="jac-slider-track">
                                <div
                                    className="jac-slider-fill"
                                    style={{ width: `${joint.percent}%` }}
                                />
                                <div
                                    className="jac-slider-knob"
                                    style={{ left: `${joint.percent}%` }}
                                />
                            </div>

                            <div className="jac-scale">

                                <div className="jac-scale-item jac-scale-start">
                                    <span className="jac-tick">0°</span>
                                    <span className="jac-scale-label jac-low">Low</span>
                                </div>

                                <div className="jac-scale-item jac-scale-mid">
                                    <span className="jac-tick">90°</span>
                                    <span className="jac-scale-label jac-normal">Normal</span>
                                </div>

                                <div className="jac-scale-item jac-scale-end">
                                    <span className="jac-tick">180°</span>
                                    <span className="jac-scale-label jac-high">High</span>
                                </div>

                            </div>

                        </div>

                    </div>

                ))}

            </div>

        </div>
    );
}

export default JointAnglesCard;
