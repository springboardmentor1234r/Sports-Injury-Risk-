import { useState, useEffect } from "react";
import api from "../services/api";
import "../styles/Forms.css";

function Athlete() {

  const [athlete, setAthlete] = useState({
    name: "",
    age: "",
    sport: "",
    experience: "",
  });

  const [athletes, setAthletes] = useState([]);
  const [search, setSearch] = useState("");

  // Handle form input changes
  const handleChange = (e) => {
    setAthlete({
      ...athlete,
      [e.target.name]: e.target.value,
    });
  };

  // Fetch athletes
  const fetchAthletes = async () => {
    try {
      const response = await api.get("/athletes");
      setAthletes(response.data);
    } catch (error) {
      console.error("Error fetching athletes:", error);
    }
  };

  useEffect(() => {
    fetchAthletes();
  }, []);

  // Submit athlete
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      const response = await api.post("/athlete", athlete);

      console.log(response.data);

      alert("Athlete added successfully!");

      fetchAthletes();

      setAthlete({
        name: "",
        age: "",
        sport: "",
        experience: "",
      });

    } catch (error) {

      console.error(error);

      if (error.response) {
        alert(error.response.data.detail || "Failed to add athlete.");
      } else {
        alert("Cannot connect to backend.");
      }

    }
  };

  // Search
  const filteredAthletes = athletes.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.sport.toLowerCase().includes(search.toLowerCase())
  );

  return (

    <div className="athlete-page">

      {/* Header */}

      <div className="athlete-header">

        <h1>Athlete Management</h1>

        <p>Register athletes and manage their profiles.</p>

      </div>

      {/* Summary */}

      <div className="summary-card">

        <h3>Total Registered Athletes</h3>

        <div className="summary-number">
          {athletes.length}
        </div>

      </div>

      {/* Form + Table */}

      <div className="athlete-content">

        {/* Registration */}

        <div className="form-card">

          <h2>Athlete Registration</h2>

          <p>Add athlete details for analysis.</p>

          <form onSubmit={handleSubmit}>

            <input
              type="text"
              name="name"
              placeholder="Athlete Name"
              value={athlete.name}
              onChange={handleChange}
              required
            />

            <input
              type="number"
              name="age"
              placeholder="Age"
              value={athlete.age}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="sport"
              placeholder="Sport"
              value={athlete.sport}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="experience"
              placeholder="Experience"
              value={athlete.experience}
              onChange={handleChange}
              required
            />

            <button type="submit">

              Add Athlete

            </button>

          </form>

        </div>

        {/* Athlete Table */}

        <div className="athlete-table">

          <div className="table-header">

            <h2>Registered Athletes</h2>

            <input
              type="text"
              className="search-input"
              placeholder="Search athlete..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>

          <table>

            <thead>

              <tr>

                <th>Name</th>
                <th>Age</th>
                <th>Sport</th>
                <th>Experience</th>

              </tr>

            </thead>

            <tbody>

              {filteredAthletes.length > 0 ? (

                filteredAthletes.map((item, index) => (

                  <tr key={index}>

                    <td>{item.name}</td>
                    <td>{item.age}</td>
                    <td>{item.sport}</td>
                    <td>{item.experience}</td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td colSpan="4">

                    No athletes registered yet.

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

}

export default Athlete;