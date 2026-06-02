import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import { SettingsProvider } from "./context/SettingsContext";
import { UserProvider } from "./context/UserContext";
import { Provider } from "react-redux";
import { store } from "./store";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <UserProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </UserProvider>
    </Provider>
  </React.StrictMode>
);
