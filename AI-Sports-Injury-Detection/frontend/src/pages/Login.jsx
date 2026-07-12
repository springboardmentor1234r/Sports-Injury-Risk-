import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    const handleLogin = async () => {
        try {

            const response = await API.post("/auth/login", {
                email,
                password,
            });

            alert(response.data.message);

            localStorage.setItem("token", response.data.token);

            navigate("/dashboard");

        } catch (error) {

            alert(error.response?.data?.message || "Login Failed");

        }
    };

    return (
        <div>

            <h1>AI Sports Injury Detection</h1>

            <h2>Login</h2>

            <input
                type="email"
                placeholder="Enter Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <br /><br />

            <input
                type="password"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <br /><br />

            <button onClick={handleLogin}>
                Login
            </button>

        </div>
    );
}

export default Login;