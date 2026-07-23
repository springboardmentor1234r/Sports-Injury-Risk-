import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

function Layout(){
    return(
        <div className="app-layout">
            <Sidebar />
        

            <div className="main-content">
                <Navbar />

                <div className="page-content">
                    <Outlet />
                </div>

            </div>



        </div>
    )   



}

export default Layout;