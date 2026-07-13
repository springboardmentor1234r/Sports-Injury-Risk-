import {
    Video,
    Brain,
    Activity,
    BarChart3,
    Zap,
    ShieldCheck
} from "lucide-react";

import FeatureCard from "./FeatureCard";

export default function Features() {

    const features = [

        {
            icon: <Video size={42} />,
            title: "Video Upload",
            description:
                "Upload athlete videos for secure AI-powered movement analysis."
        },

        {
            icon: <Brain size={42} />,
            title: "AI Pose Estimation",
            description:
                "Detect body joints using MediaPipe and Computer Vision."
        },

        {
            icon: <Activity size={42} />,
            title: "Injury Prediction",
            description:
                "Predict injury risks using biomechanics and machine learning."
        },

        {
            icon: <BarChart3 size={42} />,
            title: "Performance Dashboard",
            description:
                "Monitor athlete performance, posture and history in one place."
        },

        {
            icon: <Zap size={42} />,
            title: "Real-Time Analysis",
            description:
                "Instant movement analysis with AI-generated feedback."
        },

        {
            icon: <ShieldCheck size={42} />,
            title: "Secure Platform",
            description:
                "JWT authentication and secure athlete profile management."
        }

    ];

    return (

        <section
            id="features"
            className="bg-[#050816] py-32 px-8"
        >

            <div className="max-w-7xl mx-auto">

                <p className="text-blue-400 uppercase tracking-[0.3em] text-center">

                    Features

                </p>

                <h2 className="text-5xl font-bold text-center text-white mt-4">

                    Everything You Need

                </h2>

                <p className="text-gray-400 text-center text-xl mt-6 max-w-3xl mx-auto">

                    Powerful AI tools for athlete monitoring,
                    pose estimation,
                    injury prediction,
                    and performance analytics.

                </p>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-20">

                    {features.map((feature, index) => (

                        <FeatureCard
                            key={index}
                            {...feature}
                        />

                    ))}

                </div>

            </div>

        </section>

    );

}