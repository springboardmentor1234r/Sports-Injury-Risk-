import { motion } from "framer-motion";

export default function SkeletonPreview() {

    const dots = [
        [50, 15],
        [35, 35],
        [65, 35],
        [50, 50],
        [40, 70],
        [60, 70],
        [35, 92],
        [65, 92],
    ];

    return (

        <div className="relative h-72 rounded-2xl bg-gradient-to-br from-blue-950 to-black overflow-hidden">

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#2563eb22,transparent)]" />

            {/* Scan Line */}

            <motion.div

                animate={{
                    y: [-40, 320],
                }}

                transition={{
                    repeat: Infinity,
                    duration: 2.5,
                    ease: "linear",
                }}

                className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_30px_#22d3ee]"

            />

            {dots.map(([x, y], i) => (

                <motion.div

                    key={i}

                    animate={{
                        scale: [1, 1.4, 1],
                    }}

                    transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        delay: i * 0.15,
                    }}

                    className="absolute w-3 h-3 rounded-full bg-cyan-400"

                    style={{
                        left: `${x}%`,
                        top: `${y}%`,
                    }}

                />

            ))}

        </div>

    );

}