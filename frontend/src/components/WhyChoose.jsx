import {
    BrainCircuit,
    ShieldCheck,
    Clock3,
    Trophy,
} from "lucide-react";

const items = [
    {
        icon: <BrainCircuit size={42} />,
        title: "Advanced AI",
        text: "Powered by Computer Vision, MediaPipe and Machine Learning."
    },
    {
        icon: <Clock3 size={42} />,
        title: "Real-Time Results",
        text: "Analyze athlete movements instantly after video upload."
    },
    {
        icon: <ShieldCheck size={42} />,
        title: "Secure Platform",
        text: "JWT authentication with protected athlete data."
    },
    {
        icon: <Trophy size={42} />,
        title: "Performance Improvement",
        text: "Identify risky movements and improve athletic performance."
    }
];

export default function WhyChoose() {
    return (
        <section className="bg-[#050816] py-32">

            <div className="max-w-7xl mx-auto px-8">

                <p className="text-center uppercase tracking-[0.3em] text-blue-400">

                    Why SportsAI

                </p>

                <h2 className="text-center text-5xl font-bold text-white mt-4">

                    Why Choose Our Platform?

                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">

                    {items.map((item) => (

                        <div
                            key={item.title}
                            className="bg-white/5 rounded-3xl border border-white/10 p-8 hover:border-blue-500 transition duration-500 hover:-translate-y-3"
                        >

                            <div className="text-blue-400 mb-6">

                                {item.icon}

                            </div>

                            <h3 className="text-white text-2xl font-bold">

                                {item.title}

                            </h3>

                            <p className="text-gray-400 mt-4 leading-7">

                                {item.text}

                            </p>

                        </div>

                    ))}

                </div>

            </div>

        </section>
    );
}