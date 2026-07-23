import { Link, useNavigate } from "react-router-dom";
function Dashboard(){
    const navigate=useNavigate();
    const handleLogout=()=>{
        localStorage.removeItem("token");
        navigate("/login");
    };
    return(
        <div className="dashboard">
            <div className="welcome-card">
                <h1>Welcome Coach</h1>
                <p>AI Sports Injury Detection Dashboard</p>
            </div>
            <div className="stat-grid">
                <div className="stat-card">
                    <h3>Total Athletes</h3>

                    <h2>0</h2>
                </div>
                <div className="stat-card">
                    <h3>Uploaded Videos</h3>
                    <h2>0</h2>
                </div>
                <div>
                    <h3>Completed Analysis</h3>
                    <h2>0</h2>
                </div>
                <div className="stat-card">
                    <h3>High Risk Cases</h3>
                    <h2>0</h2>
                </div>
            </div>
            <div className="quick-actions">
                <h2>Quick Actions</h2>
                <Link to="/athletes">
                    <button>Add Athlete</button>
                </Link>
                <Link to="/athletes">
                    <button>Upload Video</button>
                </Link>
                <Link to="/upload-video">
                    <button>Upload Video</button>
                </Link>
            </div>
            <div className="recent-activity">
                <h2>Recent Activity</h2>
                <p>No activity yet.</p>
            </div>

            <br />
            
            <button onClick={handleLogout}>Logout</button>
           
        </div>
    )
}

export default Dashboard;