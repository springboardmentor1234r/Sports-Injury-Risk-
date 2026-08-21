import {
    useEffect,
    useState,
} from "react";

import {
    User,
    Save,
    ArrowLeft,
    Loader2,
    CheckCircle,
    AlertCircle,
} from "lucide-react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import api from "../services/api";

import DashboardLayout from "../components/DashboardLayout";


const ROLE_CONFIG = {
    athlete: {
        endpoint: "/athlete/profile",
        title: "Athlete Profile",
        description:
            "Update your personal, sports and training information.",
        fields: "athlete",
    },

    coach: {
        endpoint: "/coach/profile",
        title: "Coach Profile",
        description:
            "Update your coaching and professional information.",
        fields: "professional",
    },

    physiotherapist: {
        endpoint: "/physiotherapist/profile",
        title: "Physiotherapist Profile",
        description:
            "Update your professional and clinical information.",
        fields: "professional",
    },

    sports_scientist: {
        endpoint: "/sports-scientist/profile",
        title: "Sports Scientist Profile",
        description:
            "Update your professional and sports science information.",
        fields: "professional",
    },
};


export default function EditProfile() {
    const navigate = useNavigate();

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const [role, setRole] =
        useState("");

    const [formData, setFormData] =
        useState({});


    function getAuthHeaders() {
        const token =
            localStorage.getItem("token");

        if (!token) {
            return null;
        }

        return {
            Authorization:
                `Bearer ${token}`,
        };
    }


    function getRole() {
        const storedRole =
            localStorage.getItem("role");

        if (storedRole) {
            return storedRole
                .toLowerCase()
                .trim();
        }

        try {
            const user =
                JSON.parse(
                    localStorage.getItem("user") ||
                    "{}"
                );

            return (
                user.role ||
                ""
            )
                .toLowerCase()
                .trim();
        } catch {
            return "";
        }
    }


    function getConfig(currentRole) {
        return ROLE_CONFIG[currentRole];
    }


    function normalizeAthleteProfile(
        data = {}
    ) {
        return {
            full_name:
                data.full_name ||
                data.name ||
                localStorage.getItem(
                    "username"
                ) ||
                "",

            age:
                data.age ?? "",

            gender:
                data.gender || "",

            height:
                data.height ?? "",

            weight:
                data.weight ?? "",

            sport:
                data.sport || "",

            position:
                data.position || "",

            experience_years:
                data.experience_years ?? "",

            dominant_leg:
                data.dominant_leg || "",

            injury_history:
                data.injury_history || "",

            training_goals:
                data.training_goals || "",
        };
    }


    function normalizeProfessionalProfile(
        data = {}
    ) {
        return {
            full_name:
                data.full_name ||
                localStorage.getItem(
                    "username"
                ) ||
                "",

            phone:
                data.phone || "",

            specialization:
                data.specialization || "",

            sport:
                data.sport || "",

            experience:
                data.experience ?? "",

            organization:
                data.organization || "",

            certification:
                data.certification || "",
        };
    }


    useEffect(() => {
        const currentRole =
            getRole();

        setRole(currentRole);

        if (
            !ROLE_CONFIG[currentRole]
        ) {
            setLoading(false);

            setError(
                "Profile editing is not available for this account."
            );

            return;
        }

        loadProfile(
            currentRole
        );
    }, []);


    async function loadProfile(
        currentRole
    ) {
        setLoading(true);
        setError("");

        const headers =
            getAuthHeaders();

        if (!headers) {
            setLoading(false);

            navigate(
                "/login",
                {
                    replace: true,
                }
            );

            return;
        }

        const config =
            getConfig(currentRole);

        if (!config) {
            setLoading(false);

            setError(
                "Unsupported account role."
            );

            return;
        }

        try {
            const response =
                await api.get(
                    config.endpoint,
                    {
                        headers,
                    }
                );

            const backendData =
                response?.data || {};

            if (
                config.fields ===
                "athlete"
            ) {
                setFormData(
                    normalizeAthleteProfile(
                        backendData
                    )
                );
            } else {
                setFormData(
                    normalizeProfessionalProfile(
                        backendData
                    )
                );
            }

        } catch (err) {
            console.error(
                "EDIT PROFILE LOAD ERROR:",
                err
            );

            if (
                err?.response?.status ===
                401
            ) {
                logoutAndLogin();

                return;
            }

            if (
                err?.response?.status ===
                404
            ) {
                setError(
                    "Your profile has not been created yet. Please complete your profile first."
                );

                if (
                    config.fields ===
                    "athlete"
                ) {
                    setFormData(
                        normalizeAthleteProfile()
                    );
                } else {
                    setFormData(
                        normalizeProfessionalProfile()
                    );
                }

                return;
            }

            const backendMessage =
                err?.response?.data
                    ?.detail;

            setError(
                backendMessage ||
                "Unable to load your profile."
            );
        } finally {
            setLoading(false);
        }
    }


    function logoutAndLogin() {
        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "user"
        );

        localStorage.removeItem(
            "username"
        );

        localStorage.removeItem(
            "email"
        );

        localStorage.removeItem(
            "role"
        );

        localStorage.removeItem(
            "athleteProfile"
        );

        navigate(
            "/login",
            {
                replace: true,
            }
        );
    }


    function handleChange(event) {
        const {
            name,
            value,
        } = event.target;

        setFormData(
            previous => ({
                ...previous,
                [name]: value,
            })
        );

        setMessage("");
        setError("");
    }


    function validateAthlete() {
        const fullName =
            String(
                formData.full_name ||
                ""
            ).trim();

        if (!fullName) {
            return "Full name is required.";
        }

        if (
            formData.age !==
            ""
        ) {
            const age =
                Number(
                    formData.age
                );

            if (
                !Number.isFinite(age) ||
                age < 10 ||
                age > 100
            ) {
                return (
                    "Age must be between 10 and 100."
                );
            }
        }

        if (
            formData.height !==
            ""
        ) {
            const height =
                Number(
                    formData.height
                );

            if (
                !Number.isFinite(height) ||
                height < 50 ||
                height > 250
            ) {
                return (
                    "Height must be between 50 cm and 250 cm."
                );
            }
        }

        if (
            formData.weight !==
            ""
        ) {
            const weight =
                Number(
                    formData.weight
                );

            if (
                !Number.isFinite(weight) ||
                weight < 20 ||
                weight > 300
            ) {
                return (
                    "Weight must be between 20 kg and 300 kg."
                );
            }
        }

        return null;
    }


    function validateProfessional() {
        const fullName =
            String(
                formData.full_name ||
                ""
            ).trim();

        if (!fullName) {
            return "Full name is required.";
        }

        if (
            formData.experience !==
            ""
        ) {
            const experience =
                Number(
                    formData.experience
                );

            if (
                !Number.isFinite(
                    experience
                ) ||
                experience < 0 ||
                experience > 80
            ) {
                return (
                    "Experience must be between 0 and 80 years."
                );
            }
        }

        return null;
    }


    function buildPayload() {
        if (
            role === "athlete"
        ) {
            return {
                full_name:
                    String(
                        formData.full_name ||
                        ""
                    ).trim(),

                age:
                    formData.age === ""
                        ? null
                        : Number(
                            formData.age
                        ),

                gender:
                    formData.gender ||
                    null,

                height:
                    formData.height === ""
                        ? null
                        : Number(
                            formData.height
                        ),

                weight:
                    formData.weight === ""
                        ? null
                        : Number(
                            formData.weight
                        ),

                sport:
                    formData.sport ||
                    null,

                position:
                    String(
                        formData.position ||
                        ""
                    ).trim() ||
                    null,

                experience_years:
                    formData.experience_years === ""
                        ? null
                        : Number(
                            formData.experience_years
                        ),

                dominant_leg:
                    formData.dominant_leg ||
                    null,

                injury_history:
                    String(
                        formData.injury_history ||
                        ""
                    ).trim() ||
                    null,

                training_goals:
                    String(
                        formData.training_goals ||
                        ""
                    ).trim() ||
                    null,
            };
        }

        return {
            full_name:
                String(
                    formData.full_name ||
                    ""
                ).trim(),

            phone:
                String(
                    formData.phone ||
                    ""
                ).trim() ||
                null,

            specialization:
                String(
                    formData.specialization ||
                    ""
                ).trim() ||
                null,

            sport:
                formData.sport ||
                null,

            experience:
                formData.experience === ""
                    ? null
                    : Number(
                        formData.experience
                    ),

            organization:
                String(
                    formData.organization ||
                    ""
                ).trim() ||
                null,

            certification:
                String(
                    formData.certification ||
                    ""
                ).trim() ||
                null,
        };
    }


    async function handleSubmit(
        event
    ) {
        event.preventDefault();

        setMessage("");
        setError("");

        const config =
            getConfig(role);

        if (!config) {
            setError(
                "Unsupported account role."
            );

            return;
        }

        const validationError =
            role === "athlete"
                ? validateAthlete()
                : validateProfessional();

        if (validationError) {
            setError(
                validationError
            );

            return;
        }

        const headers =
            getAuthHeaders();

        if (!headers) {
            logoutAndLogin();

            return;
        }

        setSaving(true);

        try {
            const payload =
                buildPayload();

            const response =
                await api.put(
                    config.endpoint,
                    payload,
                    {
                        headers,
                    }
                );

            const savedProfile =
                response?.data ||
                payload;

            if (
                savedProfile.full_name
            ) {
                localStorage.setItem(
                    "username",
                    savedProfile.full_name
                );
            }

            if (
                role === "athlete"
            ) {
                localStorage.setItem(
                    "athleteProfile",
                    JSON.stringify(
                        savedProfile
                    )
                );
            }

            setFormData(
                role === "athlete"
                    ? normalizeAthleteProfile(
                        savedProfile
                    )
                    : normalizeProfessionalProfile(
                        savedProfile
                    )
            );

            setMessage(
                "Profile updated successfully."
            );

            setTimeout(() => {
                navigate(
                    "/profile",
                    {
                        replace: true,
                    }
                );
            }, 900);

        } catch (err) {
            console.error(
                "PROFILE SAVE ERROR:",
                err
            );

            if (
                err?.response?.status ===
                401
            ) {
                logoutAndLogin();

                return;
            }

            const backendMessage =
                err?.response?.data
                    ?.detail ||
                err?.response?.data
                    ?.message ||
                err?.response?.data
                    ?.error;

            setError(
                backendMessage ||
                "Unable to update your profile."
            );

        } finally {
            setSaving(false);
        }
    }


    if (loading) {
        return (
            <DashboardLayout
                title="Edit Profile"
            >
                <div className="sp-loading">
                    <div className="sp-loading-spinner" />

                    <p>
                        Loading profile...
                    </p>
                </div>
            </DashboardLayout>
        );
    }


    if (
        !ROLE_CONFIG[role]
    ) {
        return (
            <DashboardLayout
                title="Edit Profile"
            >
                <div className="sp-edit-page">
                    <div className="sp-alert sp-alert-error">
                        <AlertCircle
                            size={18}
                        />

                        <span>
                            Profile editing is not available for this role.
                        </span>
                    </div>
                </div>
            </DashboardLayout>
        );
    }


    const config =
        ROLE_CONFIG[role];


    return (
        <DashboardLayout
            title="Edit Profile"
        >
            <div className="sp-edit-page">

                <div className="sp-edit-top">

                    <Link
                        to="/profile"
                        className="sp-back-link"
                    >
                        <ArrowLeft
                            size={16}
                        />

                        Back to Profile
                    </Link>

                </div>


                <form
                    onSubmit={
                        handleSubmit
                    }
                    className="sp-edit-card"
                >

                    <div className="sp-edit-header">

                        <div className="sp-section-icon purple">
                            <User
                                size={20}
                            />
                        </div>

                        <div>
                            <h2>
                                {config.title}
                            </h2>

                            <p>
                                {config.description}
                            </p>
                        </div>

                    </div>


                    {message && (
                        <div className="sp-alert sp-alert-success">
                            <CheckCircle
                                size={18}
                            />

                            <span>
                                {message}
                            </span>
                        </div>
                    )}


                    {error && (
                        <div className="sp-alert sp-alert-error">
                            <AlertCircle
                                size={18}
                            />

                            <span>
                                {error}
                            </span>
                        </div>
                    )}


                    {role === "athlete" ? (
                        <AthleteFields
                            formData={
                                formData
                            }
                            handleChange={
                                handleChange
                            }
                        />
                    ) : (
                        <ProfessionalFields
                            formData={
                                formData
                            }
                            handleChange={
                                handleChange
                            }
                        />
                    )}


                    <div className="sp-form-actions">

                        <Link
                            to="/profile"
                            className="sp-btn sp-btn-cancel"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            className="sp-btn sp-btn-primary sp-save-btn"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <Loader2
                                        size={17}
                                        className="sp-spin"
                                    />

                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save
                                        size={17}
                                    />

                                    Save Changes
                                </>
                            )}
                        </button>

                    </div>

                </form>

            </div>
        </DashboardLayout>
    );
}


function AthleteFields({
    formData,
    handleChange,
}) {
    return (
        <>
            <div className="sp-form-grid">

                <FormField
                    label="Full Name"
                    name="full_name"
                    value={
                        formData.full_name
                    }
                    onChange={
                        handleChange
                    }
                    placeholder="Enter your full name"
                    required
                />

                <FormField
                    label="Age"
                    name="age"
                    type="number"
                    min="10"
                    max="100"
                    value={
                        formData.age
                    }
                    onChange={
                        handleChange
                    }
                    placeholder="Enter your age"
                />

                <SelectField
                    label="Gender"
                    name="gender"
                    value={
                        formData.gender
                    }
                    onChange={
                        handleChange
                    }
                    options={[
                        "Male",
                        "Female",
                        "Other",
                    ]}
                />

                <FormField
                    label="Height (cm)"
                    name="height"
                    type="number"
                    min="50"
                    max="250"
                    step="0.1"
                    value={
                        formData.height
                    }
                    onChange={
                        handleChange
                    }
                    placeholder="e.g. 175"
                />

                <FormField
                    label="Weight (kg)"
                    name="weight"
                    type="number"
                    min="20"
                    max="300"
                    step="0.1"
                    value={
                        formData.weight
                    }
                    onChange={
                        handleChange
                    }
                    placeholder="e.g. 65"
                />

                <SelectField
                    label="Sport"
                    name="sport"
                    value={
                        formData.sport
                    }
                    onChange={
                        handleChange
                    }
                    options={[
                        "Running",
                        "Football",
                        "Cricket",
                        "Basketball",
                        "Tennis",
                        "Badminton",
                        "Athletics",
                        "Hockey",
                        "Volleyball",
                        "Other",
                    ]}
                />

                <FormField
                    label="Playing Position"
                    name="position"
                    value={
                        formData.position
                    }
                    onChange={
                        handleChange
                    }
                    placeholder="e.g. Forward"
                />

                <FormField
                    label="Experience (years)"
                    name="experience_years"
                    type="number"
                    min="0"
                    max="80"
                    step="0.1"
                    value={
                        formData.experience_years
                    }
                    onChange={
                        handleChange
                    }
                    placeholder="e.g. 3"
                />

                <SelectField
                    label="Dominant Leg"
                    name="dominant_leg"
                    value={
                        formData.dominant_leg
                    }
                    onChange={
                        handleChange
                    }
                    options={[
                        "Right",
                        "Left",
                        "Both",
                    ]}
                />

            </div>

            <TextAreaField
                label="Injury History"
                name="injury_history"
                value={
                    formData.injury_history
                }
                onChange={
                    handleChange
                }
                placeholder="Enter any previous injuries..."
            />

            <TextAreaField
                label="Training Goals"
                name="training_goals"
                value={
                    formData.training_goals
                }
                onChange={
                    handleChange
                }
                placeholder="E.g. Improve speed, prevent injuries, increase endurance..."
            />
        </>
    );
}


function ProfessionalFields({
    formData,
    handleChange,
}) {
    return (
        <div className="sp-form-grid">

            <FormField
                label="Full Name"
                name="full_name"
                value={
                    formData.full_name
                }
                onChange={
                    handleChange
                }
                placeholder="Enter your full name"
                required
            />

            <FormField
                label="Phone"
                name="phone"
                type="tel"
                value={
                    formData.phone
                }
                onChange={
                    handleChange
                }
                placeholder="Enter phone number"
            />

            <FormField
                label="Specialization"
                name="specialization"
                value={
                    formData.specialization
                }
                onChange={
                    handleChange
                }
                placeholder="e.g. Sports Rehabilitation"
            />

            <SelectField
                label="Sport"
                name="sport"
                value={
                    formData.sport
                }
                onChange={
                    handleChange
                }
                options={[
                    "Running",
                    "Football",
                    "Cricket",
                    "Basketball",
                    "Tennis",
                    "Badminton",
                    "Athletics",
                    "Hockey",
                    "Volleyball",
                    "Other",
                ]}
            />

            <FormField
                label="Experience (years)"
                name="experience"
                type="number"
                min="0"
                max="80"
                step="0.1"
                value={
                    formData.experience
                }
                onChange={
                    handleChange
                }
                placeholder="e.g. 5"
            />

            <FormField
                label="Organization"
                name="organization"
                value={
                    formData.organization
                }
                onChange={
                    handleChange
                }
                placeholder="Enter organization"
            />

            <FormField
                label="Certification"
                name="certification"
                value={
                    formData.certification
                }
                onChange={
                    handleChange
                }
                placeholder="Enter certification"
            />

        </div>
    );
}


function FormField({
    label,
    name,
    type = "text",
    value,
    onChange,
    placeholder,
    required = false,
    min,
    max,
    step,
}) {
    return (
        <div className="sp-form-field">

            <label htmlFor={name}>
                {label}

                {required && (
                    <span>*</span>
                )}
            </label>

            <input
                id={name}
                name={name}
                type={type}
                value={value ?? ""}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                min={min}
                max={max}
                step={step}
            />

        </div>
    );
}


function SelectField({
    label,
    name,
    value,
    onChange,
    options,
}) {
    return (
        <div className="sp-form-field">

            <label htmlFor={name}>
                {label}
            </label>

            <select
                id={name}
                name={name}
                value={value ?? ""}
                onChange={onChange}
            >
                <option value="">
                    Select {label}
                </option>

                {options.map(
                    option => (
                        <option
                            key={option}
                            value={option}
                        >
                            {option}
                        </option>
                    )
                )}
            </select>

        </div>
    );
}


function TextAreaField({
    label,
    name,
    value,
    onChange,
    placeholder,
}) {
    return (
        <div className="sp-form-full">

            <label htmlFor={name}>
                {label}

                <span>
                    Optional
                </span>
            </label>

            <textarea
                id={name}
                name={name}
                value={value ?? ""}
                onChange={onChange}
                placeholder={placeholder}
                rows="4"
            />

        </div>
    );
}