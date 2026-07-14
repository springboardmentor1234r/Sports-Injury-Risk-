import {Link,useNavigate} from "react-router-dom";
function Dashboard(){
    const navigate=useNavigate();
    const handleLogout=()=>{
        localStorage.removeItem("token")
        navigate("/login");
    }
    return(
        <div>
            <h1>AI Sports Injury Detection</h1>
            <h3>Welcome</h3>
            <hr />
            <Link to="/athlete-profile">
                <button>Athlete Profiles</button>
            </Link>
            <br /><br />
            <Link to="/upload-video">
                <button>Upload Video</button>
            </Link>
            <br /><br />
            <Link to="/videos">
                <button>View Videos</button>
            </Link>
            <br /> <br />

            <Link to="/injury-detection">
                <button>Injury Detection</button>
            </Link>
            <br /><br />
            <Link to="/reports">
                <button>Reports</button>
            </Link>
            <br /><br />

            <button onClick={handleLogout}>
                Logout
            </button>


        </div>
    )
}
export default Dashboard;