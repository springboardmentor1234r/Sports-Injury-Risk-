import { useState } from "react";
import API from "../services/api";
import {useEffect} from "react";

function AthleteProfile() {
    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    const [sport, setSport] = useState("");
    const [team, setTeam] = useState("");
    const [position, setPosition] = useState("");
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    const [dominantLeg, setDominantLeg] = useState("");
    const [injuryHistory, setInjuryHistory] = useState("");
    const [athletes,setAthletes]=useState([]);
    const [editingId,setEditingId]=useState(null);


    const handleAddAthlete = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await API.post(
                "/athletes",
                {
                    name,
                    age,
                    gender,
                    sport,
                    team,
                    position,
                    height,
                    weight,
                    dominantLeg,
                    injuryHistory,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            alert(response.data.message);

            // Clear the form after successful submission
            setName("");
            setAge("");
            setGender("");
            setSport("");
            setTeam("");
            setPosition("");
            setHeight("");
            setWeight("");
            setDominantLeg("");
            setInjuryHistory("");

        } catch (error) {
            alert(error.response?.data?.message || "Failed to add athlete");
        }
    };
    const fetchAthletes=async()=>{
        try{
            const token=localStorage.getItem("token");
            const response=await API.get("/athletes",{
                headers:{
                    Authorization:`Bearer ${token}`,
                },
            });
            setAthletes(response.data.athletes);


        }catch(error){
            console.log(error);

        }
    }
    const handleDeleteAthlete=async(id)=>{
        try{
            const token=localStorage.getItem("token")
            const response=await API.delete(`/athletes/${id}`,{
                headers:{
                    Authorization:`Bearer ${token}`,
                },
            });
            alert(response.data.message)
            fetchAthletes();
        }catch(error){
            alert(error.response?.data?.message||"Failed to delete athlete");

        }
    }
    const handleEditAthlete=(athlete)=>{
        setEditingId(athlete._id);
        setName(athlete.name);
        setAge(athlete.age);
        setGender(athlete.gender);
        setSport(athlete.sport);
        setTeam(athlete.team);
        setPosition(athlete.position);
        setHeight(athlete.height);
        setWeight(athlete.weight);
        setDominantLeg(athlete.dominantLeg);
        setInjuryHistory(athlete.injuryHistory);
    }

    const handleUpdateAthlete=async()=>{
        try{
            const token=localStorage.getItem("token");
            const response=await API.put(
                `/athletes/${editingId}`,
                {
                    name,
                    age,
                    gender,
                    sport,
                    team,
                    position,
                    height,
                    weight,
                    dominantLeg,
                    injuryHistory,
                },
                {
                    headers:{
                        Authorization:`Bearer ${token}`,
                    },
                }

            );

            alert(response.data.message);

            fetchAthletes();

            setEditingId(null);
            setName("");
            setAge("");
            setGender("");
            setSport("");
            setTeam("");
            setPosition("");
            setHeight("");
            setWeight("");
            setDominantLeg("");
            setInjuryHistory("");
            
        }catch(error){
            alert(error.response?.data?.message|| "Failed to update athlete")

        }
    }
    return (
        <div>
            <h1>Athlete Management</h1>

            <h2>Add Athlete</h2>

            <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />

            <br /><br />

            <input
                type="number"
                placeholder="Age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
            />

            <br /><br />

            <input
                type="text"
                placeholder="Gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
            />

            <br /><br />

            <input
                type="text"
                placeholder="Sport"
                value={sport}
                onChange={(e) => setSport(e.target.value)}
            />

            <br /><br />

            <input
                type="text"
                placeholder="Team"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
            />

            <br /><br />

            <input
                type="text"
                placeholder="Position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
            />

            <br /><br />

            <input
                type="number"
                placeholder="Height (cm)"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
            />

            <br /><br />

            <input
                type="number"
                placeholder="Weight (kg)"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
            />

            <br /><br />

            <input
                type="text"
                placeholder="Dominant Leg"
                value={dominantLeg}
                onChange={(e) => setDominantLeg(e.target.value)}
            />

            <br /><br />

            <textarea
                placeholder="Injury History"
                value={injuryHistory}
                onChange={(e) => setInjuryHistory(e.target.value)}
            />

            <br /><br />

            <button onClick={editingId?handleUpdateAthlete:handleAddAthlete}>
                {editingId?"Update Athlete":"Add Athlete"}
            </button>

            <hr />

            <h2>All Athletes</h2>
            <table border="1" cellPadding="10">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Sport</th>
                        <th>Team</th>
                        <th>Age</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {athletes.map((athlete) => (

                        <tr key={athlete._id}>

                            <td>{athlete.name}</td>

                            <td>{athlete.sport}</td>

                            <td>{athlete.team}</td>

                            <td>{athlete.age}</td>

                            <td>
                                <button onClick={()=>handleEditAthlete(athlete)}>
                                    Edit

                                </button>
                                
                                
                                <button onClick={()=>handleDeleteAthlete(athlete._id)}>
                                    Delete
                                </button>
                            </td>

                        </tr>

                    ))}
                </tbody>

            </table>
            
        </div>
    );
}

export default AthleteProfile;