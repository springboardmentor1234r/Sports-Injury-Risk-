import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/Athlete.css";

function Athlete() {
  const [athletes, setAthletes] = useState([]);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sport, setSport] = useState("");
  const [experience, setExperience] = useState("");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==========================================================
  // FETCH ATHLETES
  // ==========================================================

  const fetchAthletes = async () => {
    try {
      const response = await api.get("/athletes");

      console.log("ATHLETES:", response.data);

      setAthletes(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (err) {
      console.error(err);

      setError(
        "Unable to load athletes from backend."
      );
    }
  };

  // ==========================================================
  // LOAD WHEN PAGE OPENS
  // ==========================================================

  useEffect(() => {
    fetchAthletes();
  }, []);

  // ==========================================================
  // REGISTER ATHLETE
  // ==========================================================

  const handleRegister = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("Please enter athlete name.");
      return;
    }

    if (!age || Number(age) <= 0) {
      setError("Please enter a valid age.");
      return;
    }

    if (!sport.trim()) {
      setError("Please enter sport.");
      return;
    }

    if (!experience.trim()) {
      setError("Please enter experience.");
      return;
    }

    const athleteData = {
      name: name.trim(),
      age: Number(age),
      sport: sport.trim(),
      experience: experience.trim()
    };

    console.log(
      "SENDING ATHLETE:",
      athleteData
    );

    try {
      setLoading(true);

      const response = await api.post(
        "/athlete",
        athleteData
      );

      console.log(
        "CREATE RESPONSE:",
        response.data
      );

      setName("");
      setAge("");
      setSport("");
      setExperience("");

      setMessage(
        "Athlete profile created successfully!"
      );

      await fetchAthletes();

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to register athlete."
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // SEARCH
  // ==========================================================

  const filteredAthletes =
    athletes.filter((athlete) => {

      const searchText =
        search.toLowerCase();

      return (
        String(athlete.name || "")
          .toLowerCase()
          .includes(searchText) ||

        String(athlete.sport || "")
          .toLowerCase()
          .includes(searchText)
      );
    });

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const totalAthletes =
    athletes.length;

  const uniqueSports =
    new Set(
      athletes
        .map((athlete) => athlete.sport)
        .filter(
          (sport) =>
            sport &&
            String(sport).trim() !== ""
        )
    );

  const totalSports =
    uniqueSports.size;

  const validAges =
    athletes
      .map((athlete) =>
        Number(athlete.age)
      )
      .filter(
        (age) =>
          age > 0 &&
          Number.isFinite(age)
      );

  const averageAge =
    validAges.length > 0
      ? Math.round(
          validAges.reduce(
            (sum, age) =>
              sum + age,
            0
          ) / validAges.length
        )
      : "—";

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="athlete-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="athlete-header">

        <div>

          <div className="section-label">
            ATHLETE MANAGEMENT
          </div>

          <h1>
            Manage Athletes
          </h1>

          <p>
            Register athletes, view their profiles,
            and monitor their sports information.
          </p>

        </div>

        <div className="header-icon">
          🏃
        </div>

      </div>


      {/* ======================================================
          STATS
      ====================================================== */}

      <div className="athlete-stats">

        <div className="stat-card">

          <div className="stat-icon">
            👥
          </div>

          <div>
            <span>
              Total Athletes
            </span>

            <strong>
              {totalAthletes}
            </strong>

            <small>
              Registered athletes
            </small>
          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            🏆
          </div>

          <div>
            <span>
              Sports
            </span>

            <strong>
              {totalSports}
            </strong>

            <small>
              Different sports
            </small>
          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            🎯
          </div>

          <div>
            <span>
              Average Age
            </span>

            <strong>
              {averageAge}
            </strong>

            <small>
              Years
            </small>
          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            🛡️
          </div>

          <div>
            <span>
              Monitoring
            </span>

            <strong>
              Active
            </strong>

            <small>
              AI injury monitoring
            </small>
          </div>

        </div>

      </div>


      {/* ======================================================
          MESSAGES
      ====================================================== */}

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="athlete-content">


        {/* ====================================================
            REGISTER
        ==================================================== */}

        <div className="register-card">

          <div className="section-label">
            NEW ATHLETE
          </div>

          <h2>
            Register Athlete
          </h2>

          <p>
            Add an athlete to the monitoring
            system.
          </p>


          <form
            onSubmit={handleRegister}
            className="athlete-form"
          >

            <div className="form-field">

              <label>
                Athlete Name
              </label>

              <input
                type="text"
                placeholder="Enter athlete name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />

            </div>


            <div className="form-row">

              <div className="form-field">

                <label>
                  Age
                </label>

                <input
                  type="number"
                  min="1"
                  placeholder="Age"
                  value={age}
                  onChange={(e) =>
                    setAge(e.target.value)
                  }
                />

              </div>


              <div className="form-field">

                <label>
                  Sport
                </label>

                <input
                  type="text"
                  placeholder="e.g. Cricket"
                  value={sport}
                  onChange={(e) =>
                    setSport(e.target.value)
                  }
                />

              </div>

            </div>


            <div className="form-field">

              <label>
                Experience
              </label>

              <input
                type="text"
                placeholder="e.g. 3 years"
                value={experience}
                onChange={(e) =>
                  setExperience(e.target.value)
                }
              />

            </div>


            <button
              type="submit"
              className="register-btn"
              disabled={loading}
            >

              {loading
                ? "Registering..."
                : "Register Athlete"}

            </button>

          </form>

        </div>


        {/* ====================================================
            ATHLETE DATABASE
        ==================================================== */}

        <div className="database-card">

          <div className="database-header">

            <div>

              <div className="section-label">
                ATHLETE DATABASE
              </div>

              <h2>
                Registered Athletes
              </h2>

              <p>
                View and manage registered athlete
                profiles.
              </p>

            </div>

            <div className="athlete-count">
              {totalAthletes}
            </div>

          </div>


          {/* SEARCH */}

          <div className="search-box">

            <span>
              🔍
            </span>

            <input
              type="text"
              placeholder="Search by athlete name or sport..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>


          {/* TABLE */}

          <div className="table-container">

            {filteredAthletes.length === 0 ? (

              <div className="no-athletes">

                <div className="no-athletes-icon">
                  👥
                </div>

                <h3>
                  No athletes found
                </h3>

                <p>
                  Register your first athlete
                  to get started.
                </p>

              </div>

            ) : (

              <table>

                <thead>

                  <tr>

                    <th>
                      ATHLETE
                    </th>

                    <th>
                      AGE
                    </th>

                    <th>
                      SPORT
                    </th>

                    <th>
                      EXPERIENCE
                    </th>

                    <th>
                      STATUS
                    </th>

                    <th>
                      ACTION
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredAthletes.map(
                    (athlete, index) => (

                      <tr
                        key={
                          athlete.email ||
                          athlete.id ||
                          index
                        }
                      >

                        <td>

                          <div className="athlete-name">

                            <div className="avatar">
                              {String(
                                athlete.name ||
                                "A"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <strong>
                                {athlete.name}
                              </strong>

                              <small>
                                Athlete
                              </small>

                            </div>

                          </div>

                        </td>


                        <td>

                          {athlete.age &&
                          Number(athlete.age) > 0
                            ? athlete.age
                            : "—"}

                        </td>


                        <td>

                          <span className="sport-badge">

                            {athlete.sport ||
                              "—"}

                          </span>

                        </td>


                        <td>

                          {athlete.experience ||
                            "—"}

                        </td>


                        <td>

                          <span className="status">
                            ● Active
                          </span>

                        </td>


                        <td>

                          <button
                            className="profile-btn"
                            onClick={() =>
                              alert(
                                `Athlete: ${athlete.name}\nAge: ${athlete.age}\nSport: ${athlete.sport}\nExperience: ${athlete.experience}`
                              )
                            }
                          >
                            👁 View Profile
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default Athlete;