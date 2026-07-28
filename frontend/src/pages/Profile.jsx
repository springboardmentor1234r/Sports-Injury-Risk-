import React, { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/Profile.css";

function Profile() {

    const loggedInUser = JSON.parse(localStorage.getItem("user"));

    const [profile, setProfile] = useState({

        name: "",

        email: "",

        role: "",

        sport: "",

        age: 0,

        gender: "",

        height: "",

        weight: "",

        dominantLeg: "",

        previousInjury: ""

    });

    useEffect(() => {

        fetchProfile();

    }, []);

    const fetchProfile = async () => {

        try {

            const response = await api.get(
                `/profile/${loggedInUser.email}`
            );

            setProfile(response.data);

        } catch (error) {

            console.error(error);

            alert("Unable to load profile.");

        }

    };

    const handleChange = (e) => {

        setProfile({

            ...profile,

            [e.target.name]: e.target.value

        });

    };

    const handleSave = async () => {

        try {

            await api.put(

                `/profile/${profile.email}`,

                {

                    name: profile.name,

                    sport: profile.sport,

                    age: Number(profile.age),

                    gender: profile.gender,

                    height: profile.height,

                    weight: profile.weight,

                    dominantLeg: profile.dominantLeg,

                    previousInjury: profile.previousInjury

                }

            );

            // Update localStorage so Topbar/Settings show new name
            localStorage.setItem(
                "user",
                JSON.stringify({
                    ...loggedInUser,
                    name: profile.name
                })
            );

            alert("Profile updated successfully.");

        } catch (error) {

            console.error(error);

            alert("Unable to update profile.");

        }

    };

    return (

        <div className="profile-page">

            <div className="profile-header">

                <div className="profile-avatar">

                    {profile.name
                        ? profile.name.charAt(0).toUpperCase()
                        : "U"}

                </div>

                <div>

                    <h1>{profile.name}</h1>

                    <p>{profile.role.toUpperCase()}</p>

                </div>

            </div>

            <div className="profile-card">

                <h2>Personal Information</h2>

                <div className="profile-grid">

                    <div>

                        <label>Name</label>

                        <input
                            name="name"
                            value={profile.name}
                            onChange={handleChange}
                        />

                    </div>

                    <div>

                        <label>Email</label>

                        <input
                            value={profile.email}
                            disabled
                        />

                    </div>

                    <div>

                        <label>Role</label>

                        <input
                            value={profile.role}
                            disabled
                        />

                    </div>

                    <div>

                        <label>Sport</label>

                        <input
                            name="sport"
                            value={profile.sport}
                            onChange={handleChange}
                        />

                    </div>

                    <div>

                        <label>Age</label>

                        <input
                            type="number"
                            name="age"
                            value={profile.age}
                            onChange={handleChange}
                        />

                    </div>

                    <div>

                        <label>Gender</label>

                        <select
                            name="gender"
                            value={profile.gender}
                            onChange={handleChange}
                        >
                            <option value="">Select</option>
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                        </select>

                    </div>

                    <div>

                        <label>Height</label>

                        <input
                            name="height"
                            value={profile.height}
                            onChange={handleChange}
                        />

                    </div>

                    <div>

                        <label>Weight</label>

                        <input
                            name="weight"
                            value={profile.weight}
                            onChange={handleChange}
                        />

                    </div>

                    <div>

                        <label>Dominant Leg</label>

                        <select
                            name="dominantLeg"
                            value={profile.dominantLeg}
                            onChange={handleChange}
                        >
                            <option value="">Select</option>
                            <option>Right</option>
                            <option>Left</option>
                        </select>

                    </div>

                    <div>

                        <label>Previous Injury</label>

                        <input
                            name="previousInjury"
                            value={profile.previousInjury}
                            onChange={handleChange}
                        />

                    </div>

                </div>

                <button
                    className="save-profile-btn"
                    onClick={handleSave}
                >
                    Save Profile
                </button>

            </div>

        </div>

    );

}

export default Profile;