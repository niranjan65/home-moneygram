import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import { SettingsProvider } from "./context/SettingsContext";
import { UserProvider } from "./context/UserContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UserProvider>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </UserProvider>
  </React.StrictMode>
);
