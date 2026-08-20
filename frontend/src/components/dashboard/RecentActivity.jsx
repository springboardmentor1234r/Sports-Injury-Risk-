import { motion } from "framer-motion";
import {
    FaFilePdf,
    FaRunning,
    FaUserEdit,
    FaExclamationTriangle
} from "react-icons/fa";

import "./RecentActivity.css";

function RecentActivity() {

    const activities = [

        {
            icon: <FaRunning />,
            title: "Video analysed",
            time: "2 mins ago"
        },

        {
            icon: <FaFilePdf />,
            title: "PDF report generated",
            time: "5 mins ago"
        },

        {
            icon: <FaUserEdit />,
            title: "Profile updated",
            time: "Today"
        },

        {
            icon: <FaExclamationTriangle />,
            title: "High Risk detected",
            time: "Today"
        }

    ];

    return (

        <motion.div
            className="recent-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
        >

            <h2>Recent Activity</h2>

            {

                activities.map((item, index) => (

                    <div
                        key={index}
                        className="activity-item"
                    >

                        <div className="activity-icon">

                            {item.icon}

                        </div>

                        <div>

                            <h4>{item.title}</h4>

                            <p>{item.time}</p>

                        </div>

                    </div>

                ))

            }

        </motion.div>

    );

}

export default RecentActivity;