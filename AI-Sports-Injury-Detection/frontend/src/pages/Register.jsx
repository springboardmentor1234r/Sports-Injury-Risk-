import {useState} from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
function Register(){
    const [name,setName]=useState("");
    const [email,setEmail]=useState("");

    const [password,setPassword]=useState("");
    const [role,setRole]=useState("athlete");
    const navigate=useNavigate();
    const handleRegister=async ()=>{
        try{
            const response=await API.post("/auth/register",{
                name,
                email,
                password,
                role,
            });
            alert(response.data.message);
            navigate("/login")

        }catch(error){
            alert(error.response?.data?.message|| "Registration Failed");
        }
    }
    return (
        <div>
            <h1>Register</h1>
            <input type="text"
            placeholder="Enter Name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            />

            <br /> <br />
            <input type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            />
            <br /> <br />
            <input type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            />
            <br /><br />
            <select 
            value={role}
            onChange={(e)=>setRole(e.target.value)}
            >
                <option value="athlete">Athlete</option>
                <option value="coach">Coach</option>
            </select>
            <br /><br />
            <button onClick={handleRegister}>
                Register
            </button>
        </div>
    );

    
}
export default Register;