import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import { SettingsProvider } from "./context/SettingsContext";
import { UserProvider } from "./context/UserContext";
import { Provider } from "react-redux";
import { store } from "./store";

// Apply saved document font size and theme on app startup
try {
  const savedFontSize = localStorage.getItem("document_font_size");
  if (savedFontSize) {
    const FONT_MAP = { small: 14, normal: 16, large: 18, larger: 20 };
    const px = FONT_MAP[savedFontSize] || (!isNaN(savedFontSize) ? Number(savedFontSize) : null);
    if (px) {
      document.documentElement.style.fontSize = `${px}px`;
    }
  }

  const savedTheme = localStorage.getItem("app_theme");
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.setAttribute("data-theme", "light");
  }
} catch {
  document.documentElement.classList.remove("dark");
  document.documentElement.setAttribute("data-theme", "light");
}

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
