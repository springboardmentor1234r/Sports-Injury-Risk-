import React, { useEffect, useState } from "react";

import api from "../services/api";
import "../styles/Admin.css";


function Admin() {

    const [users, setUsers] = useState([]);

    const [search, setSearch] = useState("");

    const [showEditModal, setShowEditModal] =
        useState(false);

    const [selectedUser, setSelectedUser] =
        useState(null);

    const [selectedRole, setSelectedRole] =
        useState("");


    // =====================================================
    // LOAD USERS
    // =====================================================

    useEffect(() => {

        fetchUsers();

    }, []);


    const fetchUsers = async () => {

        try {

            const response =
                await api.get("/users");

            setUsers(response.data);

        } catch (error) {

            console.error(
                "Unable to load users:",
                error
            );

        }

    };


    // =====================================================
    // DELETE USER
    // =====================================================

    const deleteUser = async (email) => {

        const currentUser =
            JSON.parse(
                localStorage.getItem("user")
            );

        // Don't delete yourself
        if (
            currentUser &&
            currentUser.email.toLowerCase() ===
            email.toLowerCase()
        ) {

            alert(
                "You cannot delete your own account."
            );

            return;
        }


        const confirmDelete =
            window.confirm(
                "Are you sure you want to delete this user?"
            );


        if (!confirmDelete) return;


        try {

            await api.delete(
                `/users/${email}`
            );

            fetchUsers();

        } catch (error) {

            console.error(error);

            alert(
                error.response?.data?.detail ||
                "Unable to delete user."
            );

        }

    };


    // =====================================================
    // OPEN EDIT MODAL
    // =====================================================

    const openEditModal = (user) => {

        // Don't allow editing admin accounts
        if (
            user.role?.toLowerCase() === "admin"
        ) {

            alert(
                "Admin accounts cannot be changed."
            );

            return;
        }


        setSelectedUser(user);

        setSelectedRole(
            user.role?.toLowerCase() ||
            "athlete"
        );

        setShowEditModal(true);

    };


    // =====================================================
    // CLOSE MODAL
    // =====================================================

    const closeEditModal = () => {

        setShowEditModal(false);

        setSelectedUser(null);

        setSelectedRole("");

    };


    // =====================================================
    // SAVE ROLE
    // =====================================================

    const saveRole = async () => {

        if (!selectedUser) return;


        if (
            selectedUser.role?.toLowerCase() ===
            "admin"
        ) {

            alert(
                "Admin accounts cannot be changed."
            );

            return;
        }


        if (
            selectedRole !== "athlete" &&
            selectedRole !== "coach"
        ) {

            alert(
                "Users can only be assigned Athlete or Coach."
            );

            return;
        }


        try {

            await api.put(

                `/users/${selectedUser.email}/role`,

                {
                    role: selectedRole
                }

            );


            alert(
                `Role updated to ${selectedRole}.`
            );


            closeEditModal();

            fetchUsers();

        } catch (error) {

            console.error(error);

            alert(
                error.response?.data?.detail ||
                "Unable to update role."
            );

        }

    };


    // =====================================================
    // SEARCH
    // =====================================================

    const filteredUsers =
        users.filter((user) => {

            const name =
                user.name?.toLowerCase() || "";

            const email =
                user.email?.toLowerCase() || "";

            const searchText =
                search.toLowerCase();

            return (
                name.includes(searchText) ||
                email.includes(searchText)
            );

        });


    // =====================================================
    // STATISTICS
    // =====================================================

    const totalUsers =
        users.length;


    const totalAdmins =
        users.filter(
            (user) =>
                user.role?.toLowerCase() ===
                "admin"
        ).length;


    const totalCoaches =
        users.filter(
            (user) =>
                user.role?.toLowerCase() ===
                "coach"
        ).length;


    const totalAthletes =
        users.filter(
            (user) =>
                user.role?.toLowerCase() ===
                "athlete"
        ).length;


    // =====================================================
    // UI
    // =====================================================

    return (

        <div className="admin-page">


            {/* =========================================
                HEADER
            ========================================= */}

            <div className="admin-header">

                <h1>
                    User Management
                </h1>

                <p>
                    Manage users, coaches and athletes
                    from one place.
                </p>

            </div>


            {/* =========================================
                STATISTICS
            ========================================= */}

            <div className="admin-cards">


                <div className="admin-card">

                    <h3>
                        Total Users
                    </h3>

                    <h2>
                        {totalUsers}
                    </h2>

                </div>


                <div className="admin-card">

                    <h3>
                        Admins
                    </h3>

                    <h2>
                        {totalAdmins}
                    </h2>

                </div>


                <div className="admin-card">

                    <h3>
                        Coaches
                    </h3>

                    <h2>
                        {totalCoaches}
                    </h2>

                </div>


                <div className="admin-card">

                    <h3>
                        Athletes
                    </h3>

                    <h2>
                        {totalAthletes}
                    </h2>

                </div>


            </div>


            {/* =========================================
                SEARCH
            ========================================= */}

            <div className="search-user">

                <input

                    type="text"

                    placeholder="Search users..."

                    value={search}

                    onChange={(e) =>
                        setSearch(
                            e.target.value
                        )
                    }

                />

            </div>


            {/* =========================================
                USERS TABLE
            ========================================= */}

            <div className="users-table">

                <table>

                    <thead>

                        <tr>

                            <th>
                                Name
                            </th>

                            <th>
                                Email
                            </th>

                            <th>
                                Role
                            </th>

                            <th>
                                Action
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {filteredUsers.map(
                            (user, index) => (

                                <tr
                                    key={
                                        user.email ||
                                        index
                                    }
                                >

                                    <td>
                                        {user.name}
                                    </td>


                                    <td>
                                        {user.email}
                                    </td>


                                    <td>

                                        {user.role
                                            ?.charAt(0)
                                            .toUpperCase() +
                                            user.role
                                                ?.slice(1)}

                                    </td>


                                    <td>


                                        {/* EDIT */}

                                        <button

                                            className="edit-btn"

                                            onClick={() =>
                                                openEditModal(
                                                    user
                                                )
                                            }

                                            disabled={
                                                user.role
                                                    ?.toLowerCase() ===
                                                "admin"
                                            }

                                        >

                                            {user.role
                                                ?.toLowerCase() ===
                                            "admin"
                                                ? "Admin"
                                                : "Edit"}

                                        </button>


                                        {/* DELETE */}

                                        <button

                                            className="delete-btn"

                                            onClick={() =>
                                                deleteUser(
                                                    user.email
                                                )
                                            }

                                        >

                                            Delete

                                        </button>


                                    </td>

                                </tr>

                            )
                        )}

                    </tbody>

                </table>

            </div>


            {/* =========================================
                EDIT MODAL
            ========================================= */}

            {showEditModal && (

                <div className="modal-overlay">

                    <div className="edit-modal">


                        <h2>
                            Edit User
                        </h2>


                        {/* NAME */}

                        <div className="modal-field">

                            <label>
                                Name
                            </label>

                            <input
                                value={
                                    selectedUser?.name ||
                                    ""
                                }
                                disabled
                            />

                        </div>


                        {/* EMAIL */}

                        <div className="modal-field">

                            <label>
                                Email
                            </label>

                            <input
                                value={
                                    selectedUser?.email ||
                                    ""
                                }
                                disabled
                            />

                        </div>


                        {/* ROLE */}

                        <div className="modal-field">

                            <label>
                                Role
                            </label>

                            <select

                                value={
                                    selectedRole
                                }

                                onChange={(e) =>
                                    setSelectedRole(
                                        e.target.value
                                    )
                                }

                            >

                                <option value="athlete">
                                    Athlete
                                </option>

                                <option value="coach">
                                    Coach
                                </option>

                            </select>

                        </div>


                        {/* BUTTONS */}

                        <div className="modal-buttons">


                            <button

                                className="delete-btn"

                                onClick={
                                    closeEditModal
                                }

                            >

                                Cancel

                            </button>


                            <button

                                className="edit-btn"

                                onClick={
                                    saveRole
                                }

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