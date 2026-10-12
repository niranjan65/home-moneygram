import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

export default function PublicRoute({ children }) {
  if (isAuthenticated()) {
    try {
      const session = JSON.parse(localStorage.getItem("erpnext_session"));
      if (session?.user_type === "Admin") {
        window.location.href = "/app";
        return null;
      }
    } catch {
      // fallback
    }
    return <Navigate to="/money-transfer" replace />;
  }

  return children;
}
