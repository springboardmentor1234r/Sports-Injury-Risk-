import React, { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/Admin.css";

function Admin() {

    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get("/users");
            setUsers(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const deleteUser = async (email) => {

        const currentUser = JSON.parse(localStorage.getItem("user"));

        if (currentUser.email === email) {
            alert("You cannot delete your own account.");
            return;
        }

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this user?"
        );

        if (!confirmDelete) return;

        try {

            await api.delete(`/users/${email}`);

            fetchUsers();

        } catch (error) {

            console.error(error);

            alert("Unable to delete user.");

        }

    };

    const openEditModal = (user) => {

        setSelectedUser(user);

        setSelectedRole(user.role);

        setShowEditModal(true);

    };

    const closeEditModal = () => {

        setShowEditModal(false);

        setSelectedUser(null);

    };

    const saveRole = async () => {

        try {

            await api.put(

                `/users/${selectedUser.email}/role`,

                {
                    role: selectedRole
                }

            );

            closeEditModal();

            fetchUsers();

        } catch (error) {

            console.error(error);

            alert("Unable to update role.");

        }

    };

    const filteredUsers = users.filter((user) =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );

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

        <div className="admin-page">

            <div className="admin-header">

                <h1>User Management</h1>

                <p>
                    Manage users, coaches and athletes from one place.
                </p>

            </div>

            <div className="admin-cards">

                <div className="admin-card">
                    <h3>Total Users</h3>
                    <h2>{totalUsers}</h2>
                </div>

                <div className="admin-card">
                    <h3>Admins</h3>
                    <h2>{totalAdmins}</h2>
                </div>

                <div className="admin-card">
                    <h3>Coaches</h3>
                    <h2>{totalCoaches}</h2>
                </div>

                <div className="admin-card">
                    <h3>Athletes</h3>
                    <h2>{totalAthletes}</h2>
                </div>

            </div>

            <div className="search-user">

                <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                />

            </div>

            <div className="users-table">

                <table>

                    <thead>

                        <tr>

                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Action</th>

                        </tr>

                    </thead>

                    <tbody>

                        {filteredUsers.map((user, index) => (

                            <tr key={index}>

                                <td>{user.name}</td>

                                <td>{user.email}</td>

                                <td>
                                    {user.role.charAt(0).toUpperCase() +
                                        user.role.slice(1)}
                                </td>

                                <td>

                                    <button
                                        className="edit-btn"
                                        onClick={() => openEditModal(user)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="delete-btn"
                                        onClick={() =>
                                            deleteUser(user.email)
                                        }
                                    >
                                        Delete
                                    </button>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>
            {showEditModal && (

<div className="modal-overlay">

    <div className="edit-modal">

        <h2>Edit User</h2>

        <div className="modal-field">

            <label>Name</label>

            <input
                value={selectedUser?.name || ""}
                disabled
            />

        </div>

        <div className="modal-field">

            <label>Email</label>

            <input
                value={selectedUser?.email || ""}
                disabled
            />

        </div>

        <div className="modal-field">

            <label>Role</label>

            <select
                value={selectedRole}
                onChange={(e) =>
                    setSelectedRole(e.target.value)
                }
            >
                <option value="admin">
                    Admin
                </option>

                <option value="coach">
                    Coach
                </option>

                <option value="athlete">
                    Athlete
                </option>

            </select>

        </div>

        <div className="modal-buttons">

            <button
                className="delete-btn"
                onClick={closeEditModal}
            >
                Cancel
            </button>

            <button
                className="edit-btn"
                onClick={saveRole}
            >
                Save Changes
            </button>

        </div>

    </div>

</div>

)}

        </div>

    );

}

export default Admin;