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

  // Handle form input changes
  const handleChange = (e) => {
    setAthlete({
      ...athlete,
      [e.target.name]: e.target.value,
    });
  };

  // Fetch all athletes from backend
  const fetchAthletes = async () => {
    try {
      const response = await api.get("/athletes");
      setAthletes(response.data);
    } catch (error) {
      console.error("Error fetching athletes:", error);
    }
  };

  // Load athletes when page opens
  useEffect(() => {
    fetchAthletes();
  }, []);

  // Submit athlete
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/athlete", athlete);

      alert("Athlete added successfully!");

      console.log(response.data);

      // Refresh athlete list
      fetchAthletes();

      // Clear form
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
        alert("Cannot connect to the backend.");
      }
    }
  };

  return (
    <div className="page-container">

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
            placeholder="Experience (e.g. Beginner, Intermediate, 5 Years)"
            value={athlete.experience}
            onChange={handleChange}
            required
          />

          <button type="submit">
            Add Athlete
          </button>

        </form>

      </div>

      <div className="athlete-table">

        <h2>Registered Athletes</h2>

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

            {athletes.length > 0 ? (
              athletes.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.age}</td>
                  <td>{item.sport}</td>
                  <td>{item.experience}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No athletes registered yet.</td>
              </tr>
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default Athlete;