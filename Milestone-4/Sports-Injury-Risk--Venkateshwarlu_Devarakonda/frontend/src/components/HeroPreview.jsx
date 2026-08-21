import {
    Activity,
    AlertTriangle,
    BarChart3,
    CheckCircle2,
    ShieldCheck,
} from "lucide-react";

import athlete from "../assets/images/athlete.jpg";


// ============================================================
// HERO PREVIEW
// ============================================================

export default function HeroPreview() {

    const metrics = [
        {
            label: "Balance",
            value: "96%",
            width: "96%",
        },
        {
            label: "Movement Quality",
            value: "92%",
            width: "92%",
        },
        {
            label: "Symmetry",
            value: "94%",
            width: "94%",
        },
    ];


    const insights = [
        {
            label: "Knee Angle",
            value: "156°",
            icon: BarChart3,
        },
        {
            label: "Hip Rotation",
            value: "42°",
            icon: Activity,
        },
    ];


    return (
        <div className="hero-preview-wrapper">


            {/* ==================================================
                AMBIENT GLOW
                ================================================== */}

            <div
                className="hero-preview-glow"
                aria-hidden="true"
            />


            {/* ==================================================
                MAIN ANALYSIS CARD
                ================================================== */}

            <div className="hero-preview-card">


                {/* ==================================================
                    HEADER
                    ================================================== */}

                <div className="hero-preview-header">

                    <div className="hero-preview-title-group">

                        <div className="hero-preview-icon">

                            <Activity
                                size={18}
                                strokeWidth={1.9}
                                aria-hidden="true"
                            />

                        </div>


                        <div>

                            <span className="hero-preview-label">
                                MOVEMENT ANALYSIS
                            </span>

                            <h3 className="hero-preview-title">
                                Athlete Assessment
                            </h3>

                        </div>

                    </div>


                    <div className="hero-preview-status">

                        <span
                            className="hero-preview-status-dot"
                            aria-hidden="true"
                        />

                        <span>
                            Live
                        </span>

                    </div>

                </div>


                {/* ==================================================
                    ATHLETE MEDIA
                    ================================================== */}

                <div className="hero-preview-media">

                    <img
                        src={athlete}
                        alt="Athlete movement analysis preview"
                        className="hero-preview-image"
                    />


                    {/* ==================================================
                        ANALYSIS OVERLAY
                        ================================================== */}

                    <div
                        className="hero-preview-overlay"
                        aria-hidden="true"
                    >

                        <div className="hero-preview-scan-line" />

                        <div className="hero-preview-corner hero-preview-corner-top-left" />

                        <div className="hero-preview-corner hero-preview-corner-top-right" />

                        <div className="hero-preview-corner hero-preview-corner-bottom-left" />

                        <div className="hero-preview-corner hero-preview-corner-bottom-right" />

                    </div>


                    {/* ==================================================
                        AI BADGE
                        ================================================== */}

                    <div className="hero-preview-ai-badge">

                        <Activity
                            size={15}
                            strokeWidth={2}
                            aria-hidden="true"
                        />

                        <span>
                            AI Pose Detection
                        </span>

                    </div>

                </div>


                {/* ==================================================
                    RISK SUMMARY
                    ================================================== */}

                <div className="hero-preview-risk">

                    <div className="hero-preview-risk-left">

                        <div className="hero-preview-risk-icon">

                            <ShieldCheck
                                size={21}
                                strokeWidth={1.9}
                                aria-hidden="true"
                            />

                        </div>


                        <div>

                            <span>
                                Injury Risk
                            </span>

                            <strong>
                                Low Risk
                            </strong>

                        </div>

                    </div>


                    <div className="hero-preview-risk-score">

                        <span>
                            18
                        </span>

                        <small>
                            /100
                        </small>

                    </div>

                </div>


                {/* ==================================================
                    METRICS
                    ================================================== */}

                <div className="hero-preview-metrics">

                    {metrics.map((metric) => (

                        <div
                            key={metric.label}
                            className="hero-preview-metric"
                        >

                            <div className="hero-preview-metric-top">

                                <span>
                                    {metric.label}
                                </span>

                                <strong>
                                    {metric.value}
                                </strong>

                            </div>


                            <div className="hero-preview-progress">

                                <span
                                    className="hero-preview-progress-fill"
                                    style={{
                                        "--progress-width":
                                            metric.width,
                                    }}
                                />

                            </div>

                        </div>

                    ))}

                </div>


                {/* ==================================================
                    BIOMECHANICAL INSIGHTS
                    ================================================== */}

                <div className="hero-preview-insights">

                    {insights.map((insight) => {

                        const Icon = insight.icon;

                        return (
                            <div
                                key={insight.label}
                                className="hero-preview-insight"
                            >

                                <div className="hero-preview-insight-icon">

                                    <Icon
                                        size={16}
                                        strokeWidth={1.9}
                                        aria-hidden="true"
                                    />

                                </div>


                                <div>

                                    <span>
                                        {insight.label}
                                    </span>

                                    <strong>
                                        {insight.value}
                                    </strong>

                                </div>

                            </div>
                        );

                    })}

                </div>


                {/* ==================================================
                    STATUS FOOTER
                    ================================================== */}

                <div className="hero-preview-footer">

                    <div>

                        <CheckCircle2
                            size={16}
                            strokeWidth={1.9}
                            aria-hidden="true"
                        />

                        <span>
                            Analysis completed
                        </span>

                    </div>


                    <span>
                        AI confidence 94%
                    </span>

                </div>

            </div>


            {/* ==================================================
                FLOATING RISK CARD
                ================================================== */}

            <div className="hero-preview-floating-card">

                <div className="hero-preview-floating-icon">

                    <AlertTriangle
                        size={18}
                        strokeWidth={1.9}
                        aria-hidden="true"
                    />

                </div>


                <div>

                    <strong>
                        Risk Monitoring
                    </strong>

                    <span>
                        Continuous assessment
                    </span>

                </div>

            </div>

        </div>
    );
}