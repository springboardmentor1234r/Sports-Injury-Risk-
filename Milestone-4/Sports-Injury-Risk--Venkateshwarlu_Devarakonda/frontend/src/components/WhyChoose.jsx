import {
    BrainCircuit,
    ShieldCheck,
    Clock3,
    Trophy,
} from "lucide-react";

import {
    motion,
} from "framer-motion";

import { SectionHeading } from "./Features";


const items = [

    {
        icon: BrainCircuit,
        title: "Advanced AI",
        text:
            "Combines computer vision, pose estimation, biomechanics and machine learning.",
    },

    {
        icon: Clock3,
        title: "Fast Analysis",
        text:
            "Turn movement videos into useful insights without manually reviewing every frame.",
    },

    {
        icon: ShieldCheck,
        title: "Secure Platform",
        text:
            "Protected authentication and athlete-specific data access.",
    },

    {
        icon: Trophy,
        title: "Performance Focused",
        text:
            "Go beyond injury risk by understanding movement quality and performance.",
    },

];


export default function WhyChoose() {

    return (

        <section className="landing-section why-section">

            <div className="landing-container">

                <SectionHeading
                    eyebrow="Why SportSense AI"
                    title="Built Around the Athlete"
                    description="The platform combines movement intelligence with an athlete-focused dashboard to make complex analysis easier to understand."
                />


                <div className="why-grid">

                    {items.map((item, index) => {

                        const Icon = item.icon;

                        return (

                            <motion.div
                                key={item.title}
                                initial={{
                                    opacity: 0,
                                    scale: 0.96,
                                }}
                                whileInView={{
                                    opacity: 1,
                                    scale: 1,
                                }}
                                transition={{
                                    duration: 0.45,
                                    delay: index * 0.08,
                                }}
                                viewport={{
                                    once: true,
                                }}
                                className="why-card"
                            >

                                <div className="why-icon">
                                    <Icon size={28} />
                                </div>


                                <h3>
                                    {item.title}
                                </h3>


                                <p>
                                    {item.text}
                                </p>

                            </motion.div>

                        );
                    })}

                </div>

            </div>

        </section>
    );
}