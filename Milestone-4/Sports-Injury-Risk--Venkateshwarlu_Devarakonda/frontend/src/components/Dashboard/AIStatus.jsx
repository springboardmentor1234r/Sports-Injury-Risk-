import { motion } from "framer-motion";

export default function AIStatus() {

    return (

        <div className="flex items-center gap-4">

            <motion.div

                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                }}

                transition={{
                    repeat: Infinity,
                    duration: 1.2,
                }}

                className="w-4 h-4 rounded-full bg-green-500"

            />

            <div>

                <p className="text-green-400 font-bold">

                    LIVE AI ANALYSIS

                </p>

                <p className="text-gray-400">

                    Processing athlete movement...

                </p>

            </div>

        </div>

    );

}