import {
    Activity,
    Mail,
    ArrowUpRight,
} from "lucide-react";

import { Link } from "react-router-dom";


export default function Footer() {

    const currentYear = new Date().getFullYear();


    const scrollToTop = () => {

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });

    };


    return (

        <footer className="landing-footer">

            <div className="landing-footer-container">

                {/* Brand */}

                <div className="landing-footer-brand">

                    <Link
                        to="/"
                        className="landing-footer-logo-row"
                    >

                        <div className="landing-footer-icon">

                            <Activity
                                size={21}
                                strokeWidth={2}
                            />

                        </div>


                        <div>

                            <div className="landing-footer-title">

                                SportSense <span>AI</span>

                            </div>


                            <div className="landing-footer-subtitle">

                                Sports Injury Intelligence

                            </div>

                        </div>

                    </Link>


                    <p className="landing-footer-description">

                        AI-powered sports movement analysis,
                        biomechanical assessment and
                        injury-risk intelligence from video.

                    </p>


                    <span className="landing-footer-prototype">

                        Research &amp; Project Prototype

                    </span>

                </div>


                {/* Product */}

                <div className="landing-footer-column">

                    <h3>Product</h3>


                    <a href="#features">
                        Features
                    </a>


                    <a href="#how">
                        How It Works
                    </a>


                    <Link to="/login">
                        Analysis Platform
                    </Link>

                </div>


                {/* Platform */}

                <div className="landing-footer-column">

                    <h3>Platform</h3>


                    <Link to="/login">
                        Login
                    </Link>


                    <Link to="/register">
                        Create Account
                    </Link>


                    <Link to="/dashboard">
                        Dashboard
                    </Link>

                </div>


                {/* Support */}

                <div className="landing-footer-column">

                    <h3>Support</h3>


                    <a href="mailto:support@sportsense.ai">

                        <Mail
                            size={16}
                            strokeWidth={1.8}
                        />

                        <span>
                            Contact Support
                        </span>

                    </a>


                    <a href="#features">
                        Platform Features
                    </a>


                    <a href="#how">
                        Workflow
                    </a>

                </div>

            </div>


            {/* Footer bottom */}

            <div className="landing-footer-bottom">

                <p>

                    © {currentYear} SportSense AI.
                    All rights reserved.

                </p>


                <div className="landing-footer-bottom-right">

                    <span>

                        AI-powered sports injury
                        intelligence

                    </span>


                    <button
                        type="button"
                        className="landing-footer-top"
                        onClick={scrollToTop}
                        aria-label="Back to top"
                    >

                        Back to top

                        <ArrowUpRight
                            size={15}
                            strokeWidth={1.8}
                        />

                    </button>

                </div>

            </div>

        </footer>

    );

}