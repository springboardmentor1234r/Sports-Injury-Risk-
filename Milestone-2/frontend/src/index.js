import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

import { AnalysisProvider } from "./context/AnalysisContext";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <AnalysisProvider>
      <App />
    </AnalysisProvider>
  </React.StrictMode>
);