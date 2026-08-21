import {
    Video,
    Brain,
    Activity,
    BarChart3,
    MessageCircle,
    ShieldCheck,
} from "lucide-react";

import { motion } from "framer-motion";


// ============================================================
// FEATURES DATA
// ============================================================

const features = [
    {
        icon: Video,
        title: "AI Video Analysis",
        description:
            "Upload athlete movement videos and analyze posture, joint alignment, balance, symmetry and movement quality.",
    },
    {
        icon: Brain,
        title: "Pose Estimation",
        description:
            "Use computer-vision based pose estimation to identify body landmarks and movement patterns from video.",
    },
    {
        icon: Activity,
        title: "Injury Risk Intelligence",
        description:
            "Evaluate biomechanical indicators and identify abnormal movement patterns associated with potential injury risk.",
    },
    {
        icon: BarChart3,
        title: "Performance Analytics",
        description:
            "Track risk scores, movement quality, balance, symmetry, range of motion and analysis history through dashboards.",
    },
    {
        icon: MessageCircle,
        title: "Professional Collaboration",
        description:
            "Connect athletes with coaches, physiotherapists and sports scientists for feedback, recommendations and support.",
    },
    {
        icon: ShieldCheck,
        title: "Role-Based Security",
        description:
            "Separate access for athletes, coaches, physiotherapists, sports scientists and administrators with protected authentication.",
    },
];


// ============================================================
// FEATURES SECTION
// ============================================================

export default function Features() {

    return (
        <section
            id="features"
            className="landing-section features-section"
        >

            <div className="landing-container">


                {/* ==================================================
                    SECTION HEADING
                    ================================================== */}

                <SectionHeading
                    eyebrow="Platform Capabilities"
                    title="Intelligence Built Around Athlete Safety"
                    description="SportSense AI combines movement analysis, injury-risk intelligence and professional collaboration into one platform."
                />


                {/* ==================================================
                    FEATURE GRID
                    ================================================== */}

                <div className="features-grid">

                    {features.map(
                        (
                            feature,
                            index
                        ) => {

                            const Icon =
                                feature.icon;

                            return (
                                <motion.article
                                    key={feature.title}
                                    className="feature-card"

                                    initial={{
                                        opacity: 0,
                                        y: 28,
                                    }}

                                    whileInView={{
                                        opacity: 1,
                                        y: 0,
                                    }}

                                    transition={{
                                        duration: 0.5,
                                        delay:
                                            index * 0.07,
                                        ease: "easeOut",
                                    }}

                                    viewport={{
                                        once: true,
                                        amount: 0.15,
                                    }}

                                    whileHover={{
                                        y: -7,
                                    }}
                                >


                                    {/* ==================================================
                                        ICON
                                        ================================================== */}

                                    <div className="feature-icon">

                                        <Icon
                                            size={25}
                                            strokeWidth={1.8}
                                            aria-hidden="true"
                                        />

                                    </div>


                                    {/* ==================================================
                                        CONTENT
                                        ================================================== */}

                                    <div className="feature-content">

                                        <h3>
                                            {feature.title}
                                        </h3>

                                        <p>
                                            {feature.description}
                                        </p>

                                    </div>


                                    {/* ==================================================
                                        DECORATIVE ELEMENT
                                        ================================================== */}

                                    <div
                                        className="feature-card-glow"
                                        aria-hidden="true"
                                    />

                                </motion.article>
                            );
                        }
                    )}

                </div>

            </div>

        </section>
    );
}


// ============================================================
// SECTION HEADING
// ============================================================

export function SectionHeading({
    eyebrow,
    title,
    description,
}) {

    return (
        <div className="landing-section-heading">

            <p className="landing-eyebrow">
                {eyebrow}
            </p>

            <h2 className="landing-section-title">
                {title}
            </h2>

            <p className="landing-section-description">
                {description}
            </p>

        </div>
    );
}