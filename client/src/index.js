import React from "react";
import ReactDOM from "react-dom/client"; // Yangi import: 'react-dom/client'
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root")); // createRoot bilan root yaratamiz
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
