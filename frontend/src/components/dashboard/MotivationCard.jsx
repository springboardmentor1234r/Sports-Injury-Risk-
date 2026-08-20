import { useMemo } from "react";
import { motion } from "framer-motion";
import { FaTrophy } from "react-icons/fa";

import "./MotivationCard.css";

function MotivationCard() {

    const quotes = [

        "Champions are built through consistency, not intensity.",

        "Small improvements every day lead to big victories.",

        "Train smart. Recover smarter.",

        "Your body achieves what your mind believes.",

        "Every workout is an investment in your future performance.",

        "Injury prevention begins with proper movement.",

        "Consistency beats perfection.",

        "Strong athletes recover before they break.",

        "Success is built one training session at a time.",

        "Discipline today creates champions tomorrow."

    ];

    const quote = useMemo(() => {

        return quotes[
            Math.floor(Math.random() * quotes.length)
        ];

    }, []);

    return (

        <motion.div

            className="motivation-card"

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            transition={{ duration: 0.5 }}

        >

            <div className="motivation-icon">

                <FaTrophy />

            </div>

            <h2>Daily Motivation</h2>

            <p>"{quote}"</p>

        </motion.div>

    );

}

export default MotivationCard;