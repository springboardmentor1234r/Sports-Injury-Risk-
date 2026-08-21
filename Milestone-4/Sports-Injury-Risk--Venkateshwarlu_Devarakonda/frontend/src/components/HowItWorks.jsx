import {
    Upload,
    ScanFace,
    Activity,
    FileText,
} from "lucide-react";

import { motion } from "framer-motion";

import { SectionHeading } from "./Features";


// ============================================================
// WORKFLOW DATA
// ============================================================

const steps = [
    {
        number: "01",
        icon: Upload,
        title: "Upload Movement Video",
        description:
            "The athlete securely uploads a sports movement video through the SportSense AI platform.",
    },

    {
        number: "02",
        icon: ScanFace,
        title: "AI Detects Movement",
        description:
            "Computer vision and pose estimation identify body landmarks and track movement throughout the video.",
    },

    {
        number: "03",
        icon: Activity,
        title: "Analyze Biomechanics",
        description:
            "The system evaluates movement quality, balance, symmetry, joint alignment, range of motion and injury-risk indicators.",
    },

    {
        number: "04",
        icon: FileText,
        title: "Review & Take Action",
        description:
            "Athletes and authorized professionals can review the results, reports and recommendations to support safer training and performance.",
    },
];


// ============================================================
// HOW IT WORKS
// ============================================================

export default function HowItWorks() {

    return (
        <section
            id="how"
            className="landing-section how-section"
        >

            <div className="landing-container">


                {/* ==================================================
                    SECTION HEADING
                    ================================================== */}

                <SectionHeading
                    eyebrow="AI-Powered Workflow"
                    title="From Movement Video to Actionable Intelligence"
                    description="SportSense AI turns an athlete's movement video into measurable biomechanical insights and injury-risk intelligence."
                />


                {/* ==================================================
                    WORKFLOW
                    ================================================== */}

                <div className="workflow-grid">

                    {steps.map(
                        (
                            step,
                            index
                        ) => {

                            const Icon =
                                step.icon;

                            return (
                                <motion.article
                                    key={step.number}
                                    className="workflow-card"

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
                                            index * 0.1,
                                        ease: "easeOut",
                                    }}

                                    viewport={{
                                        once: true,
                                        amount: 0.15,
                                    }}
                                >


                                    {/* ==================================================
                                        STEP NUMBER
                                        ================================================== */}

                                    <div
                                        className="workflow-number"
                                        aria-hidden="true"
                                    >
                                        {step.number}
                                    </div>


                                    {/* ==================================================
                                        ICON
                                        ================================================== */}

                                    <div className="workflow-icon">

                                        <Icon
                                            size={28}
                                            strokeWidth={1.8}
                                            aria-hidden="true"
                                        />

                                    </div>


                                    {/* ==================================================
                                        CONTENT
                                        ================================================== */}

                                    <div className="workflow-content">

                                        <h3>
                                            {step.title}
                                        </h3>

                                        <p>
                                            {step.description}
                                        </p>

                                    </div>


                                    {/* ==================================================
                                        CONNECTOR
                                        ================================================== */}

                                    {index <
                                        steps.length - 1 && (
                                        <div
                                            className="workflow-connector"
                                            aria-hidden="true"
                                        />
                                    )}

                                </motion.article>
                            );
                        }
                    )}

                </div>

            </div>

        </section>
    );
}