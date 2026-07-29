import { motion } from "framer-motion";

import DashboardCard from "./dashboard/DashboardCard";
import ProgressBar from "./dashboard/ProgressBar";
import AIStatus from "./dashboard/AIStatus";
import SkeletonPreview from "./dashboard/SkeletonPreview";

import {
    Activity,
    ShieldCheck,
    TrendingUp,
    BrainCircuit,
} from "lucide-react";

export default function DashboardPreview() {

    return (

        <section
            id="dashboard"
            className="bg-[#07111f] py-32"
        >

            <div className="max-w-7xl mx-auto px-8">

                <p className="uppercase tracking-[0.3em] text-blue-400 text-center">

                    AI Dashboard

                </p>

                <h2 className="text-5xl font-bold text-white text-center mt-4">

                    Live Athlete Intelligence

                </h2>

                <p className="text-xl text-gray-400 text-center mt-6 max-w-3xl mx-auto">

                    Computer Vision + AI + Pose Estimation working together
                    to detect risky movements before injuries occur.

                </p>

                <motion.div

                    initial={{ opacity: 0, y: 80 }}

                    whileInView={{ opacity: 1, y: 0 }}

                    transition={{ duration: 0.8 }}

                    viewport={{ once: true }}

                    className="grid lg:grid-cols-2 gap-10 mt-20"

                >

                    {/* LEFT */}

                    <DashboardCard title="Live Pose Detection">

                        <SkeletonPreview />

                        <div className="mt-8">

                            <AIStatus />

                        </div>

                    </DashboardCard>

                    {/* RIGHT */}

                    <div className="space-y-8">

                        <DashboardCard title="AI Analysis">

                            <div className="space-y-6">

                                <ProgressBar
                                    title="Pose Detection"
                                    value={98}
                                />

                                <ProgressBar
                                    title="Movement Quality"
                                    value={94}
                                />

                                <ProgressBar
                                    title="Balance Score"
                                    value={96}
                                />

                            </div>

                        </DashboardCard>

                        <div className="grid grid-cols-2 gap-6">

                            <Metric
                                icon={<Activity size={28} />}
                                title="Knee Angle"
                                value="154°"
                            />

                            <Metric
                                icon={<TrendingUp size={28} />}
                                title="Hip Angle"
                                value="48°"
                            />

                            <Metric
                                icon={<ShieldCheck size={28} />}
                                title="Risk"
                                value="LOW"
                            />

                            <Metric
                                icon={<BrainCircuit size={28} />}
                                title="Confidence"
                                value="98%"
                            />

                        </div>

                        <DashboardCard title="AI Recommendation">

                            <p className="text-gray-300 leading-8">

                                Excellent posture detected during movement.

                                <br /><br />

                                Continue improving knee flexion during landing
                                to reduce ACL injury risk.

                            </p>

                        </DashboardCard>

                    </div>

                </motion.div>

            </div>

        </section>

    );

}

function Metric({

    icon,
    title,
    value,

}) {

    return (

        <motion.div

            whileHover={{
                y: -6,
                scale: 1.03,
            }}

            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6"

        >

            <div className="text-blue-400 mb-4">

                {icon}

            </div>

            <p className="text-gray-400">

                {title}

            </p>

            <h2 className="text-white text-3xl font-bold mt-2">

                {value}

            </h2>

        </motion.div>

    );

}