import { motion } from "framer-motion";
import { FaBell } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";

import "./DashboardHeader.css";

function DashboardHeader() {

    const user = JSON.parse(localStorage.getItem("user"));

    const hour = new Date().getHours();

    let greeting = "Good Evening";

    if (hour < 12) greeting = "Good Morning";

    else if (hour < 17) greeting = "Good Afternoon";

    return (

        <motion.div
            className="dashboard-header"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >

            <div className="dashboard-left">

                <h1>

                    {greeting},

                    {" "}

                    {user?.name || "Athlete"} 👋

                </h1>

                <p>

                    Welcome to your AI Sports Injury Risk Detection Dashboard

                </p>

            </div>

            <div className="dashboard-right">

                <div className="search-box">

                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Search..."
                    />

                </div>

                <button className="notification-btn">

                    <FaBell />

                </button>

                <div className="profile-box">

                    <div className="avatar">

                        {user?.name?.charAt(0).toUpperCase()}

                    </div>

                    <div>

                        <h4>{user?.name}</h4>

                        <p>{user?.role}</p>

                    </div>

                </div>

            </div>

        </motion.div>

    );

}

export default DashboardHeader;