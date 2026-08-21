import { motion } from "framer-motion";


// ============================================================
// FEATURE CARD
// ============================================================

export default function FeatureCard({
    icon,
    title,
    description,
}) {

    return (
        <motion.article
            className="feature-card"

            initial={{
                opacity: 0,
                y: 28,
            }}

            whileInView={{
                opacity: 1,
                y: 0,
            }}

            transition={{
                duration: 0.45,
            }}

            viewport={{
                once: true,
                amount: 0.15,
            }}

            whileHover={{
                y: -7,
            }}
        >

            {/* ==================================================
                ICON
                ================================================== */}

            <div className="feature-icon">

                {icon}

            </div>


            {/* ==================================================
                CONTENT
                ================================================== */}

            <h3>
                {title}
            </h3>


            <p>
                {description}
            </p>

        </motion.article>
    );
}