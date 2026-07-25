import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import "../styles/Layout.css";

function Layout({ children }) {
  return (
    <div className="app-layout">

      <Sidebar />

      <div className="main-layout">

        <Topbar />

        <div className="content-area">
          {children}
        </div>

      </div>

    </div>
  );
}

export default Layout;