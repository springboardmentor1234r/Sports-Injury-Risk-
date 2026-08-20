import CountUp from "react-countup";
import { motion } from "framer-motion";

import "./StatsCard.css";

function StatsCard({
    title,
    value,
    icon,
    subtitle
}) {

    return (

        <motion.div
            className="stats-card"
            whileHover={{
                y: -8,
                scale: 1.03
            }}
            transition={{
                duration: 0.25
            }}
        >

            <div className="stats-icon">

                {icon}

            </div>

            <div className="stats-content">

                <h3>{title}</h3>

                <h1>

                    <CountUp
                        end={value}
                        duration={2}
                    />

                </h1>

                <p>{subtitle}</p>

            </div>

        </motion.div>

    );

}

export default StatsCard;