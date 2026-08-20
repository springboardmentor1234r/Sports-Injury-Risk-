import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaUsers,
    FaUserShield,
    FaUserTie,
    FaRunning
} from "react-icons/fa";

import api from "../services/api";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import StatsCard from "../components/dashboard/StatsCard";
import RecentActivity from "../components/dashboard/RecentActivity";
import MotivationCard from "../components/dashboard/MotivationCard";

import "../styles/AdminDashboard.css";

function AdminDashboard() {

    const navigate = useNavigate();

    const [users, setUsers] = useState([]);

    useEffect(() => {

        fetchUsers();

    }, []);

    const fetchUsers = async () => {

        try {

            const response = await api.get("/users");

            setUsers(response.data);

        }

        catch (error) {

            console.error(error);

        }

    };

    const totalUsers = users.length;

    const totalAdmins = users.filter(
        user => user.role === "admin"
    ).length;

    const totalCoaches = users.filter(
        user => user.role === "coach"
    ).length;

    const totalAthletes = users.filter(
        user => user.role === "athlete"
    ).length;

    return (

        <div className="admin-dashboard">

            <DashboardHeader />

            {/* Statistics */}

            <div className="overview-grid">

                <StatsCard
                    title="Total Users"
                    value={totalUsers}
                    icon={<FaUsers />}
                    subtitle="Registered Users"
                />

                <StatsCard
                    title="Admins"
                    value={totalAdmins}
                    icon={<FaUserShield />}
                    subtitle="System Administrators"
                />

                <StatsCard
                    title="Coaches"
                    value={totalCoaches}
                    icon={<FaUserTie />}
                    subtitle="Registered Coaches"
                />

                <StatsCard
                    title="Athletes"
                    value={totalAthletes}
                    icon={<FaRunning />}
                    subtitle="Registered Athletes"
                />

            </div>

            {/* Dashboard Widgets */}

            <div className="dashboard-widgets">

                <RecentActivity />

                <MotivationCard />

            </div>

            {/* Recent Users */}

            <div className="recent-users">

                <h2>Recent Registered Users</h2>

                <table>

                    <thead>

                        <tr>

                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            users.length === 0 ?

                                (

                                    <tr>

                                        <td
                                            colSpan="3"
                                            style={{
                                                textAlign: "center",
                                                padding: "20px"
                                            }}
                                        >

                                            No users available.

                                        </td>

                                    </tr>

                                )

                                :

                                users
                                    .slice(-5)
                                    .reverse()
                                    .map((user, index) => (

                                        <tr key={index}>

                                            <td>{user.name}</td>

                                            <td>{user.email}</td>

                                            <td>

                                                {

                                                    user.role.charAt(0).toUpperCase()

                                                    +

                                                    user.role.slice(1)

                                                }

                                            </td>

                                        </tr>

                                    ))

                        }

                    </tbody>

                </table>

            </div>

            {/* Quick Actions */}

            <h2 className="section-title">

                Quick Actions

            </h2>

            <div className="action-grid">

                <div
                    className="action-card"
                    onClick={() =>
                        navigate("/dashboard/admin")
                    }
                >

                    <h3>User Management</h3>

                    <p>
                        Add, edit and delete platform users.
                    </p>

                </div>

                <div
                    className="action-card"
                    onClick={() =>
                        navigate("/dashboard/reports")
                    }
                >

                    <h3>Reports</h3>

                    <p>
                        View AI generated reports.
                    </p>

                </div>

                <div
                    className="action-card"
                    onClick={() =>
                        navigate("/dashboard/history")
                    }
                >

                    <h3>History</h3>

                    <p>
                        View previous analyses.
                    </p>

                </div>

                <div
                    className="action-card"
                    onClick={() =>
                        navigate("/dashboard/settings")
                    }
                >

                    <h3>Settings</h3>

                    <p>
                        Manage application preferences.
                    </p>

                </div>

            </div>

        </div>

    );

}

export default AdminDashboard;