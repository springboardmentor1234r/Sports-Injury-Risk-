import { motion } from "framer-motion";


const JOINTS = [
    { x: 184, y: 48, r: 7 },

    { x: 174, y: 72, r: 5 },
    { x: 146, y: 91, r: 6 },
    { x: 201, y: 88, r: 6 },

    { x: 116, y: 118, r: 5 },
    { x: 82, y: 101, r: 5 },

    { x: 229, y: 116, r: 5 },
    { x: 259, y: 94, r: 5 },

    { x: 170, y: 130, r: 6 },
    { x: 194, y: 133, r: 6 },

    { x: 147, y: 178, r: 5 },
    { x: 219, y: 181, r: 5 },

    { x: 126, y: 230, r: 5 },
    { x: 250, y: 226, r: 5 },

    { x: 105, y: 239, r: 4 },
    { x: 274, y: 235, r: 4 },
];


const CONNECTIONS = [
    [184, 48, 174, 72],

    [174, 72, 146, 91],
    [174, 72, 201, 88],

    [146, 91, 116, 118],
    [116, 118, 82, 101],

    [201, 88, 229, 116],
    [229, 116, 259, 94],

    [174, 72, 170, 130],
    [201, 88, 194, 133],

    [170, 130, 194, 133],

    [170, 130, 147, 178],
    [147, 178, 126, 230],
    [126, 230, 105, 239],

    [194, 133, 219, 181],
    [219, 181, 250, 226],
    [250, 226, 274, 235],
];


const GROUND_TICKS = [80, 140, 200, 260];


export default function SkeletonPreview() {

    return (

        <div className="skeleton-preview">

            {/* Background */}

            <div
                className="skeleton-background-glow"
                aria-hidden="true"
            />

            <div
                className="skeleton-grid"
                aria-hidden="true"
            />


            {/* Header */}

            <div className="skeleton-analysis-header">

                <div>

                    <strong>
                        Live Movement Analysis
                    </strong>

                    <span>
                        Pose tracking
                    </span>

                </div>


                <div className="skeleton-live-badge">

                    <span />

                    LIVE

                </div>

            </div>


            {/* Visualization */}

            <div className="skeleton-stage">

                <div
                    className="skeleton-reference-circle circle-one"
                    aria-hidden="true"
                />

                <div
                    className="skeleton-reference-circle circle-two"
                    aria-hidden="true"
                />


                {/* Animated scanner */}

                <motion.div
                    className="skeleton-scan-line"
                    animate={{
                        y: [0, 225, 0],
                    }}
                    transition={{
                        duration: 3.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    aria-hidden="true"
                />


                <svg
                    className="skeleton-svg"
                    viewBox="0 0 340 270"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    role="img"
                    aria-label="AI athlete pose detection visualization"
                >

                    {/* Ground */}

                    <line
                        x1="50"
                        y1="246"
                        x2="310"
                        y2="246"
                        className="skeleton-ground"
                    />


                    {GROUND_TICKS.map((x) => (

                        <line
                            key={x}
                            x1={x}
                            y1="246"
                            x2={x}
                            y2="252"
                            className="skeleton-ground-tick"
                        />

                    ))}


                    {/* Skeleton */}

                    {CONNECTIONS.map(
                        (
                            [x1, y1, x2, y2],
                            index
                        ) => (

                            <motion.line
                                key={`${x1}-${y1}-${x2}-${y2}`}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                className="skeleton-bone"
                                initial={{
                                    pathLength: 0,
                                }}
                                animate={{
                                    pathLength: 1,
                                }}
                                transition={{
                                    duration: 0.5,
                                    delay: index * 0.035,
                                }}
                            />

                        )
                    )}


                    {/* Joints */}

                    {JOINTS.map(
                        (joint, index) => (

                            <g key={`${joint.x}-${joint.y}`}>

                                <circle
                                    cx={joint.x}
                                    cy={joint.y}
                                    r={joint.r + 7}
                                    className="skeleton-joint-glow"
                                />


                                <motion.circle
                                    cx={joint.x}
                                    cy={joint.y}
                                    r={joint.r}
                                    className="skeleton-joint"
                                    animate={{
                                        r: [
                                            joint.r,
                                            joint.r + 1.8,
                                            joint.r,
                                        ],
                                    }}
                                    transition={{
                                        duration: 1.6,
                                        repeat: Infinity,
                                        delay: index * 0.05,
                                    }}
                                />

                            </g>

                        )
                    )}


                    {/* Head */}

                    <circle
                        cx="184"
                        cy="48"
                        r="13"
                        className="skeleton-head-ring"
                    />

                </svg>


                {/* Knee measurement */}

                <div className="skeleton-angle-marker">

                    <span>
                        Knee Angle
                    </span>

                    <strong>
                        154°
                    </strong>

                </div>


                {/* Keypoints */}

                <div className="skeleton-keypoint-count">

                    <span className="keypoint-dot" />

                    33 keypoints detected

                </div>

            </div>


            {/* Footer */}

            <div className="skeleton-analysis-footer">

                <div>

                    <span>
                        Movement Quality
                    </span>

                    <strong>
                        Excellent
                    </strong>

                </div>


                <div className="skeleton-confidence">

                    <span>
                        Confidence
                    </span>

                    <strong>
                        98%
                    </strong>

                </div>

            </div>

        </div>

    );

}