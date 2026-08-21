import {
    ArrowRight,
    Activity,
    ShieldCheck,
    Users,
} from "lucide-react";

import { Link } from "react-router-dom";

import { motion } from "framer-motion";


// ============================================================
// CTA SECTION
// ============================================================

export default function CTA() {

    return (
        <section
            id="dashboard"
            className="landing-section cta-section"
        >

            <div className="landing-container">

                <motion.div
                    className="cta-card"

                    initial={{
                        opacity: 0,
                        y: 30,
                    }}

                    whileInView={{
                        opacity: 1,
                        y: 0,
                    }}

                    transition={{
                        duration: 0.6,
                        ease: "easeOut",
                    }}

                    viewport={{
                        once: true,
                        amount: 0.2,
                    }}
                >


                    {/* ==================================================
                        BACKGROUND DECORATION
                        ================================================== */}

                    <div
                        className="cta-glow cta-glow-one"
                        aria-hidden="true"
                    />

                    <div
                        className="cta-glow cta-glow-two"
                        aria-hidden="true"
                    />


                    {/* ==================================================
                        MAIN CONTENT
                        ================================================== */}

                    <div className="cta-content">


                        {/* ICON */}

                        <div className="cta-icon">

                            <Activity
                                size={25}
                                strokeWidth={1.8}
                                aria-hidden="true"
                            />

                        </div>


                        {/* EYEBROW */}

                        <p className="landing-eyebrow">
                            Start With SportSense AI
                        </p>


                        {/* TITLE */}

                        <h2 className="cta-title">
                            Turn Athlete Movement
                            Into Actionable Intelligence.
                        </h2>


                        {/* DESCRIPTION */}

                        <p className="cta-description">
                            Upload movement videos, understand
                            biomechanical patterns, monitor injury-risk
                            indicators and collaborate with sports
                            professionals through one platform.
                        </p>


                        {/* ==================================================
                            ACTIONS
                            ================================================== */}

                        <div className="cta-actions">

                            <Link
                                to="/register"
                                className="cta-primary-button"
                            >

                                <span>
                                    Create Your Account
                                </span>

                                <ArrowRight
                                    size={18}
                                    strokeWidth={2}
                                    aria-hidden="true"
                                />

                            </Link>


                            <Link
                                to="/login"
                                className="cta-secondary-button"
                            >

                                <span>
                                    Already have an account?
                                </span>

                                <strong>
                                    Login
                                </strong>

                            </Link>

                        </div>

                    </div>


                    {/* ==================================================
                        VALUE POINTS
                        ================================================== */}

                    <div className="cta-points">


                        {/* MOVEMENT INTELLIGENCE */}

                        <div className="cta-point">

                            <div className="cta-point-icon">

                                <Activity
                                    size={17}
                                    strokeWidth={1.9}
                                    aria-hidden="true"
                                />

                            </div>

                            <div className="cta-point-content">

                                <strong>
                                    Movement Intelligence
                                </strong>

                                <span>
                                    AI-assisted biomechanical analysis
                                </span>

                            </div>

                        </div>


                        {/* SECURE ACCESS */}

                        <div className="cta-point">

                            <div className="cta-point-icon">

                                <ShieldCheck
                                    size={17}
                                    strokeWidth={1.9}
                                    aria-hidden="true"
                                />

                            </div>

                            <div className="cta-point-content">

                                <strong>
                                    Secure Access
                                </strong>

                                <span>
                                    Protected role-based platform access
                                </span>

                            </div>

                        </div>


                        {/* PROFESSIONAL COLLABORATION */}

                        <div className="cta-point">

                            <div className="cta-point-icon">

                                <Users
                                    size={17}
                                    strokeWidth={1.9}
                                    aria-hidden="true"
                                />

                            </div>

                            <div className="cta-point-content">

                                <strong>
                                    Professional Collaboration
                                </strong>

                                <span>
                                    Connect with authorized sports professionals
                                </span>

                            </div>

                        </div>

                    </div>

                </motion.div>

            </div>

        </section>
    );
}