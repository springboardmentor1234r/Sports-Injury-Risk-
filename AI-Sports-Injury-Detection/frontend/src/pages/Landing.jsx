import {Link} from "react-router-dom";
function Home(){
    return(
        <div>
            <h1>AI Sports Injury Detection</h1>
            <p>Predict sports injuries using AI-powered pose estimation and movement analysis</p>

            <br />
            <hr />
            <h3>Features</h3>
            <ul>
                <li>Athlete Profile Management</li>
                <li>Video Upload</li>
                <li>Pose Estimation</li>
                <li>Injury Risk Prediction</li>
                <li>Performance Dashboard</li>
            </ul>
            <Link to="/login"><button>Login</button></Link>
            {" "}
            
            <Link to="/register"><button>Register</button></Link>
        </div>
    );
}
export default Home;