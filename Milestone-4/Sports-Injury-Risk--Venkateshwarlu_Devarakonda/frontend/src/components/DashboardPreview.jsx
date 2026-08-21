import {
    motion,
} from "framer-motion";

import {
    Activity,
    ShieldCheck,
    Target,
} from "lucide-react";


export default function DashboardPreview() {

    return (

        <section
            id="dashboard"
            className="landing-dashboard-preview"
        >

            <div className="landing-container">

                <motion.div
                    initial={{
                        opacity: 0,
                        y: 25,
                    }}
                    whileInView={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        duration: 0.6,
                    }}
                    viewport={{
                        once: true,
                    }}
                    className="landing-metrics-panel"
                >

                    {/* =================================
                        LIVE MOVEMENT
                    ================================== */}

                    <div className="landing-dashboard-card landing-live-card">

                        <div className="landing-card-heading">

                            <div>

                                <h3>
                                    Live Movement Analysis
                                </h3>

                            </div>

                            <span className="landing-live-badge">
                                <span />
                                Live
                            </span>

                        </div>


                        <div className="landing-skeleton">

                            <SkeletonFigure />

                        </div>

                    </div>


                    {/* =================================
                        INJURY RISK
                    ================================== */}

                    <div className="landing-dashboard-card">

                        <span className="landing-dashboard-label">
                            Injury Risk
                        </span>

                        <strong className="landing-dashboard-big">
                            Low
                        </strong>

                        <span className="landing-dashboard-small">
                            Risk Level
                        </span>


                        <div className="landing-risk-meter">

                            <div className="landing-risk-arc" />

                        </div>

                    </div>


                    {/* =================================
                        BALANCE
                    ================================== */}

                    <div className="landing-dashboard-card">

                        <span className="landing-dashboard-label">
                            Balance Score
                        </span>

                        <strong className="landing-dashboard-big">
                            96%
                        </strong>

                        <span className="landing-dashboard-small">
                            Excellent
                        </span>


                        <div className="landing-progress-line">

                            <div />

                        </div>

                    </div>


                    {/* =================================
                        KNEE
                    ================================== */}

                    <div className="landing-dashboard-card">

                        <span className="landing-dashboard-label">
                            Knee Angle
                        </span>

                        <strong className="landing-dashboard-big">
                            156°
                        </strong>

                        <span className="landing-dashboard-small">
                            Optimal
                        </span>

                    </div>

                </motion.div>

            </div>

        </section>
    );
}


/* =====================================================
   SIMPLE POSE FIGURE
===================================================== */

function SkeletonFigure() {

    return (

        <div className="landing-skeleton-figure">

            <div className="skeleton-head" />

            <div className="skeleton-body" />

            <div className="skeleton-arm skeleton-arm-left" />

            <div className="skeleton-arm skeleton-arm-right" />

            <div className="skeleton-leg skeleton-leg-left" />

            <div className="skeleton-leg skeleton-leg-right" />

            <div className="skeleton-point point-one" />
            <div className="skeleton-point point-two" />
            <div className="skeleton-point point-three" />
            <div className="skeleton-point point-four" />
            <div className="skeleton-point point-five" />
            <div className="skeleton-point point-six" />

        </div>

    );
}