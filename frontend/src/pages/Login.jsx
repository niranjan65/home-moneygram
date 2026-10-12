import { sessionFetch as fetch } from "../api/sessionClient.js";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import mhlogo from "../assets/mhlogo.png";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const ERPNEXT_BASE_URL = "/";

import { useUser } from "../context/UserContext";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useUser();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };


  const getCsrfToken = async () => {
  const response = await fetch(
    "/api/method/moneygram.moneygram.api.allow_login.get_csrf_token",
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Unable to initialize authentication session");
  }

  const data = await response.json();

  return data?.message?.csrf_token || null;
};

  const loginToERPNext = async (username, password) => {
    try {
      //  const csrfToken = await getCsrfToken();

      const response = await fetch(
        `/api/method/login`,
        {
          method: "POST",
          headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          // ...(csrfToken
          //   ? { "X-Frappe-CSRF-Token": csrfToken }
          //   : {}),
        },
          body: JSON.stringify({ usr: username, pwd: password }),
          credentials: "include",
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        let errMsg = "Invalid credentials";
        if (result && typeof result === "object") {
          if (typeof result.message === "string") {
            errMsg = result.message;
          } else if (result.message && typeof result.message.message === "string") {
            errMsg = result.message.message;
          }
        }
        return {
          success: false,
          error: errMsg,
        };
      }

      return { success: true, data: result };
    } catch (err) {
      return {
        success: false,
        error: err.message || "Network error. Please try again.",
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);

    try {
      const loginResult = await loginToERPNext(
        formData.email.trim(),
        formData.password
      );

      if (!loginResult.success) {
        setError(
          typeof loginResult.error === "string"
            ? loginResult.error
            : "Invalid credentials"
        );
        return;
      }

      const payload = loginResult.data?.user_details || loginResult.data?.message;

      // Check if authentication was successful
      const isSuccess =
        (payload && typeof payload === "object" && payload.success_key === 1) ||
        payload === "Logged In" ||
        payload === "No App";

      if (isSuccess) {
        const nestedPayload =
          payload && typeof payload === "object" ? payload : {};
        const userType = nestedPayload.user_type || "Teller";
        const primaryWarehouse = nestedPayload.warehouse || null;
        const userWarehouses = Array.isArray(nestedPayload.warehouses) ? nestedPayload.warehouses : [];

        const sessionData = {
          user:
            nestedPayload.full_name ||
            nestedPayload.username ||
            loginResult.data?.full_name ||
            formData.email.trim(),
          email: nestedPayload.email || formData.email.trim(),
          loginTime: nestedPayload.login_time || new Date().toISOString(),
          creation: nestedPayload.creation || "",
          sessionActive: true,
          user_type: userType,
          warehouse: primaryWarehouse,
          warehouses: userWarehouses,
          has_branch_assigned: Boolean(primaryWarehouse && userWarehouses.length > 0),
          branch_warning: userWarehouses.length > 0 ? null : "User is not assigned to any branch location",
          ...nestedPayload,
        };

        setUser(sessionData);

        // Store active branch location if assigned, otherwise remove
        if (primaryWarehouse) {
          localStorage.setItem("selected_warehouse", JSON.stringify({ warehouse: primaryWarehouse }));
        } else {
          localStorage.removeItem("selected_warehouse");
        }

        if (userType === "Admin") {
          window.location.href = `/app`;
        } else {
          // Tellers route directly to Teller Portal (/money-transfer)
          navigate("/money-transfer", { replace: true });
        }
      } else {
        // Handle failed authentication
        let errorMsg = "Invalid credentials";

        if (payload && typeof payload === "object") {
          if (typeof payload.message === "string") {
            errorMsg = payload.message;
          }
        } else if (typeof payload === "string") {
          errorMsg = payload;
        }

        if (
          typeof errorMsg === "string" &&
          (errorMsg.toLowerCase().includes("authentication error") ||
            errorMsg.toLowerCase().includes("invalid") ||
            errorMsg.toLowerCase().includes("password") ||
            errorMsg.toLowerCase().includes("user") ||
            errorMsg.toLowerCase().includes("not found"))
        ) {
          setError("Invalid email or password. Please check your credentials and try again.");
        } else {
          setError(typeof errorMsg === "string" ? errorMsg : "Invalid credentials. Please try again.");
        }
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    formData.email.trim() !== "" &&
    formData.password.trim() !== "";

  return (
    <>
      <Navbar />

      <section className="min-h-[85vh] bg-[var(--color-background-light)] flex items-start justify-center px-6 pt-8 pb-10 font-sans">
        <div className="w-full max-w-md relative">

          {/* Background Logo Watermark */}
          <div
            className="absolute inset-0 bg-center bg-no-repeat bg-contain opacity-15"
            style={{ backgroundImage: `url(${mhlogo})` }}
          />


          {/* Login Card */}
          <div className="relative bg-white rounded-2xl shadow-lg p-8">

            <div className="flex justify-center mb-6">
              <img
                src={mhlogo}
                alt="MH Logo"
                className="h-16 object-contain"
              />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Login
            </h2>


            {/* <p className="text-gray-500 text-center mb-6">
        Access your account to manage transfers.
      </p> */}

            {error && (
              <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* EMAIL */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />

                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 select-none"
                  >
                    {showPassword ? "🙈" : "👁"}
                  </span>
                </div>
              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full bg-[var(--color-primary)] hover:opacity-90 text-black font-semibold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Login"
                )}
              </button>

            </form>
          </div>
        </div>
      </section>


      {/* <Footer /> */}
    </>
  );
}
