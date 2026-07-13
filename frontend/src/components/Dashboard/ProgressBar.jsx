import { motion } from "framer-motion";

export default function ProgressBar({
    title,
    value,
}) {

    return (

        <div>

            <div className="flex justify-between mb-2">

                <span className="text-gray-300">

                    {title}

                </span>

                <span className="text-blue-400 font-semibold">

                    {value}%

                </span>

            </div>

            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">

                <motion.div

                    initial={{ width: 0 }}

                    whileInView={{ width: `${value}%` }}

                    transition={{
                        duration: 1.5,
                    }}

                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600"

                />

            </div>

        </div>

    );

}