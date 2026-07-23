import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function AddAthlete() {

    const navigate=useNavigate();
    const [formData, setFormData] = useState({

        name: "",

        age: "",

        gender: "",

        sport: "",

        position: "",

        height: "",

        weight: "",

        injuryHistory: ""

    });

    const handleChange = (e) => {

        setFormData({

            ...formData,

            [e.target.name]: e.target.value

        });

    };

    const handleSubmit =  async(e) => {

        e.preventDefault();
        try{
            await API.post("/athletes",formData);
            alert("Athlete Added Successfully");
            navigate("/athletes")

        }catch(error){
            console.log(error);
            alert("Failed to Add Athlete")
        }
        

    };

    return (

        <div>

            <h1>Add Athlete</h1>

            <form onSubmit={handleSubmit}>

                <input
                    name="name"
                    placeholder="Name"
                    onChange={handleChange}
                />

                <br /><br />

                <input
                    name="age"
                    placeholder="Age"
                    onChange={handleChange}
                />

                <br /><br />

                <input
                    name="gender"
                    placeholder="Gender"
                    onChange={handleChange}
                />

                <br /><br />

                <input
                    name="sport"
                    placeholder="Sport"
                    onChange={handleChange}
                />

                <br /><br />

                <input
                    name="position"
                    placeholder="Position"
                    onChange={handleChange}
                />

                <br /><br />

                <input
                    name="height"
                    placeholder="Height"
                    onChange={handleChange}
                />

                <br /><br />

                <input
                    name="weight"
                    placeholder="Weight"
                    onChange={handleChange}
                />

                <br /><br />

                <textarea
                    name="injuryHistory"
                    placeholder="Previous Injuries"
                    onChange={handleChange}
                />

                <br /><br />

                <button>

                    Save Athlete

                </button>

            </form>

        </div>

    );

}

export default AddAthlete;