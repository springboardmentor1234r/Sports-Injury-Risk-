import StepCard from "./StepCard";

export default function HowItWorks() {

    const steps = [

        {
            number: "01",
            title: "Upload Sports Video",
            description:
                "Athletes upload cricket, football, badminton or other sports videos securely."
        },

        {
            number: "02",
            title: "AI Pose Estimation",
            description:
                "MediaPipe detects body joints, posture, balance and movement patterns frame by frame."
        },

        {
            number: "03",
            title: "Biomechanics Analysis",
            description:
                "Joint angles, symmetry, stride length and movement efficiency are calculated."
        },

        {
            number: "04",
            title: "Injury Risk Report",
            description:
                "The system predicts injury risk and generates an easy-to-understand report."
        }

    ];

    return (

        <section
            id="how"
            className="bg-[#07111f] py-32 px-8"
        >

            <div className="max-w-6xl mx-auto">

                <p className="uppercase tracking-[0.3em] text-blue-400 text-center">

                    Workflow

                </p>

                <h2 className="text-5xl font-bold text-white text-center mt-4">

                    How It Works

                </h2>

                <p className="text-gray-400 text-center text-xl mt-6 max-w-3xl mx-auto">

                    Our AI pipeline analyzes athlete movement in four intelligent steps.

                </p>

                <div className="mt-20 space-y-12">

                    {steps.map((step) => (

                        <StepCard
                            key={step.number}
                            {...step}
                        />

                    ))}

                </div>

            </div>

        </section>

    );

}