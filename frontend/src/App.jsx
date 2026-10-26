import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import MoneyExchange from "./pages/MoneyExchange";
import Login from "./pages/Login";
import MoneyTransfer from "./pages/MoneyTransfer";
import TransactionHistory from "./pages/TransactionHistory";
import Contact from "./pages/ContactUs";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import { useEffect } from "react";
// import { io } from "socket.io-client";
import SoldiLanding from "./components/SoldiLanding";
import SettingsPanel from "./components/Settingspanel";
import CurrencyBalanceReport from "./components/CurrencyBalanceReport";
import Stocks from "./pages/Stocks";
import DealerExchange from "./pages/DealerExchange";
import Reports from "./pages/Reports";
import VaultTransfer from "./pages/VaultTransfer";
import BranchTransfer from "./pages/BranchTransfer";
import { Navigate } from "react-router-dom";

function App() {
  // Dynamic socket connection (if needed):
  // const socket = io(`${window.location.protocol}//${window.location.hostname}:8079`);
  // useEffect(() => {
  //   console.log("object")
  //   socket.on("new-sales-invoice", (data) => {
  //     console.log("New Invoice:", data);

  //     // Update state here
  //   });
  // }, []);
  useEffect(() => {
    if (location.pathname === "/") {
      window.location.href = `/home`;
    }
  }, [])


  return (
    <BrowserRouter basename="/home">
      <Routes>

        <Route path="/" element={<SoldiLanding />} />
        {/* Public Route */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              {/* <Home /> */}
              <SoldiLanding />
            </ProtectedRoute>
          }
        />

        <Route
          path="/money-transfer"
          element={
            <ProtectedRoute>
              <MoneyTransfer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/exchange"
          element={
            <ProtectedRoute>
              <MoneyExchange />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <TransactionHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dealer-exchange"
          element={
            <ProtectedRoute>
              <DealerExchange />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vault-transfer"
          element={
            <ProtectedRoute>
              <VaultTransfer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/branch-transfer"
          element={
            <ProtectedRoute>
              <BranchTransfer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transfer"
          element={<Navigate to="/vault-transfer" replace />}
        />

        <Route
          path="/test"
          element={
            <ProtectedRoute>
              <SettingsPanel />
            </ProtectedRoute>
          }
        />

        {/* <Route
          path="/report"
          element={
            <ProtectedRoute>
              <CurrencyBalanceReport />
            </ProtectedRoute>
          }
        /> */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPanel />
            </ProtectedRoute>
          }
        />

        <Route
          path="/stocks"
          element={
            <ProtectedRoute>
              <Stocks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/report"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
