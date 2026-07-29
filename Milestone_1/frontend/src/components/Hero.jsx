import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import HeroPreview from "./HeroPreview";

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center overflow-hidden">

            {/* Hero Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#050816]/95 via-[#081229]/85 to-[#050816]/95" />

            {/* Soft Glow Left */}
            <div className="absolute top-20 left-20 w-[450px] h-[450px] bg-blue-600/10 blur-[160px] rounded-full"></div>

            {/* Soft Glow Right */}
            <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-cyan-500/5 blur-[130px] rounded-full"></div>

            {/* Grid */}
            <div
                className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                    backgroundSize: "50px 50px",
                }}
            />

            {/* Fade into next section */}
            <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-[#07111f] to-transparent"></div>

            {/* Main Content */}

            <div className="relative z-10 max-w-7xl mx-auto px-8 py-20 grid lg:grid-cols-2 gap-20 items-center">

                {/* LEFT */}

                <motion.div
                    initial={{ opacity: 0, x: -80 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                        duration: 0.9,
                        ease: "easeOut",
                    }}
                >

                    <p className="text-blue-400 uppercase tracking-[0.3em] font-semibold mb-4">

                        AI Powered Sports Analytics

                    </p>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight">

                        Prevent Sports Injuries

                        <span className="text-blue-500">

                            <br />

                            Before They Happen

                        </span>

                    </h1>

                    <p className="text-gray-300 text-lg md:text-xl mt-8 leading-8 max-w-xl">

                        AI-powered biomechanics, pose estimation and movement
                        analysis that helps athletes identify injury risks,
                        optimize performance, and train more safely.

                    </p>

                    {/* Buttons */}

                    <motion.div
                        className="flex flex-wrap gap-5 mt-10"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: 0.7,
                            duration: 0.8,
                        }}
                    >

                        <Link
                            to="/register"
                            className="bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/40 px-8 py-4 rounded-xl text-white font-semibold"
                        >
                            Get Started →
                        </Link>

                        <Link
                            to="/login"
                            className="border border-gray-600 hover:border-blue-500 hover:bg-blue-600/20 transition-all duration-300 hover:scale-105 px-8 py-4 rounded-xl text-white font-semibold backdrop-blur-md"
                        >
                            Login
                        </Link>

                    </motion.div>

                    {/* Statistics */}

                    <motion.div
                        className="grid grid-cols-3 gap-10 mt-16"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: 1,
                            duration: 0.8,
                        }}
                    >

                        <div>

                            <h2 className="text-4xl font-bold text-white">

                                98%

                            </h2>

                            <p className="text-gray-400 mt-2">

                                Prediction Accuracy

                            </p>

                        </div>

                        <div>

                            <h2 className="text-4xl font-bold text-white">

                                20+

                            </h2>

                            <p className="text-gray-400 mt-2">

                                Sports Supported

                            </p>

                        </div>

                        <div>

                            <h2 className="text-4xl font-bold text-white">

                                24/7

                            </h2>

                            <p className="text-gray-400 mt-2">

                                AI Monitoring

                            </p>

                        </div>

                    </motion.div>

                </motion.div>

                {/* RIGHT */}

                <motion.div
                    className="flex justify-center"
                    initial={{ opacity: 0, x: 80, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{
                        duration: 1,
                        delay: 0.3,
                        ease: "easeOut",
                    }}
                >

                    <HeroPreview />

                </motion.div>

            </div>

        </section>
    );
}