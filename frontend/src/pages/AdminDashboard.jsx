import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
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

        } catch (error) {

            console.error("Error fetching users:", error);

        }

    };

    const totalUsers = users.length;

    const totalAdmins = users.filter(
        (user) => user.role === "admin"
    ).length;

    const totalCoaches = users.filter(
        (user) => user.role === "coach"
    ).length;

    const totalAthletes = users.filter(
        (user) => user.role === "athlete"
    ).length;

    return (

        <div className="admin-dashboard">

            {/* Header */}

            <div className="admin-header">

                <h1>Admin Dashboard</h1>

                <p>
                    Welcome back. Manage users, monitor platform activity,
                    and oversee the Sports Injury Risk Detection System.
                </p>

            </div>

            {/* Statistics */}

            <div className="overview-grid">

                <div className="overview-card">

                    <h3>Total Users</h3>

                    <h1>{totalUsers}</h1>

                </div>

                <div className="overview-card">

                    <h3>Admins</h3>

                    <h1>{totalAdmins}</h1>

                </div>

                <div className="overview-card">

                    <h3>Coaches</h3>

                    <h1>{totalCoaches}</h1>

                </div>

                <div className="overview-card">

                    <h3>Athletes</h3>

                    <h1>{totalAthletes}</h1>

                </div>

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

                        {users.length === 0 ? (

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

                        ) : (

                            users.slice(-5).reverse().map((user, index) => (

                                <tr key={index}>

                                    <td>{user.name}</td>

                                    <td>{user.email}</td>

                                    <td>
                                        {user.role.charAt(0).toUpperCase() +
                                            user.role.slice(1)}
                                    </td>

                                </tr>

                            ))

                        )}

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
                    onClick={() => navigate("/dashboard/admin")}
                >

                    <h3>User Management</h3>

                    <p>
                        Add, edit and delete platform users.
                    </p>

                </div>

                <div
                    className="action-card"
                    onClick={() => navigate("/dashboard/reports")}
                >

                    <h3>Reports</h3>

                    <p>
                        View generated injury reports.
                    </p>

                </div>

                <div
                    className="action-card"
                    onClick={() => navigate("/dashboard/history")}
                >

                    <h3>History</h3>

                    <p>
                        View platform activity history.
                    </p>

                </div>

                <div
                    className="action-card"
                    onClick={() => navigate("/dashboard/settings")}
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