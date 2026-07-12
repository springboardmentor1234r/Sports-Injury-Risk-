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
            <button>Upload Video</button>
            <br /><br />
            <button>Injury Detection</button>
            <br /><br />
            <button>Reports</button>
        </div>
    )
}
export default Dashboard;