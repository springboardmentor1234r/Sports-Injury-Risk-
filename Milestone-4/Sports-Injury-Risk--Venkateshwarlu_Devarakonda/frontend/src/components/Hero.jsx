import {
    ArrowRight,
    PlayCircle,
    ShieldCheck,
    Brain,
    BarChart3,
    Activity,
} from "lucide-react";

import {
    Link,
} from "react-router-dom";

import HeroPreview from "./HeroPreview";


// ============================================================
// HERO SECTION
// ============================================================

export default function Hero() {

    return (
        <section
            id="hero"
            className="hero-section"
        >

            <div className="hero-container">


                {/* ==================================================
                    LEFT CONTENT
                    ================================================== */}

                <div className="hero-content">


                    {/* ==================================================
                        BADGE
                        ================================================== */}

                    <div className="hero-badge">

                        <span className="hero-badge-icon">

                            <Activity
                                size={15}
                                strokeWidth={2}
                                aria-hidden="true"
                            />

                        </span>

                        <span>
                            AI-Powered Sports
                            Injury Intelligence
                        </span>

                    </div>


                    {/* ==================================================
                        HEADING
                        ================================================== */}

                    <h1 className="hero-title">

                        Detect Injury Risk
                        <br />

                        <span className="hero-title-highlight">
                            Before It Happens.
                        </span>

                    </h1>


                    {/* ==================================================
                        DESCRIPTION
                        ================================================== */}

                    <p className="hero-description">

                        SportSense AI analyzes athlete
                        movement from video using pose
                        estimation, biomechanics, and
                        machine learning to identify
                        abnormal movement patterns and
                        potential injury risks.

                    </p>


                    {/* ==================================================
                        ACTIONS
                        ================================================== */}

                    <div className="hero-actions">


                        {/* PRIMARY */}

                        <Link
                            to="/register"
                            className="hero-primary-btn"
                        >

                            <span>
                                Get Started
                            </span>

                            <ArrowRight
                                size={18}
                                strokeWidth={2}
                                aria-hidden="true"
                            />

                        </Link>


                        {/* SECONDARY */}

                        <a
                            href="#how"
                            className="hero-secondary-btn"
                        >

                            <PlayCircle
                                size={19}
                                strokeWidth={1.9}
                                aria-hidden="true"
                            />

                            <span>
                                See How It Works
                            </span>

                        </a>

                    </div>


                    {/* ==================================================
                        TRUST INDICATORS
                        ================================================== */}

                    <div className="hero-trust">


                        {/* SECURE */}

                        <div className="hero-trust-item">

                            <ShieldCheck
                                size={18}
                                strokeWidth={1.9}
                                aria-hidden="true"
                            />

                            <span>
                                Secure Analysis
                            </span>

                        </div>


                        {/* AI */}

                        <div className="hero-trust-item">

                            <Brain
                                size={18}
                                strokeWidth={1.9}
                                aria-hidden="true"
                            />

                            <span>
                                AI-Powered
                            </span>

                        </div>


                        {/* DATA */}

                        <div className="hero-trust-item">

                            <BarChart3
                                size={18}
                                strokeWidth={1.9}
                                aria-hidden="true"
                            />

                            <span>
                                Data-Driven
                            </span>

                        </div>

                    </div>

                </div>


                {/* ==================================================
                    RIGHT SIDE
                    HERO PREVIEW
                    ================================================== */}

                <div className="hero-visual">

                    <HeroPreview />

                </div>

            </div>

        </section>
    );
}