import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import MoneyExchange from "./pages/MoneyExchange";
import MoneyExchangeNew from "./pages/MoneyExchangeNew";
import Login from "./pages/Login";
import MoneyTransfer from "./pages/MoneyTransfer";
import MoneyTransferNew from "./pages/MoneyTransferNew";
import TransactionHistory from "./pages/TransactionHistory";
import Contact from "./pages/ContactUs";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import { useEffect } from "react";
// import { io } from "socket.io-client";
import SoldiLanding from "./components/SoldiLanding";
import SettingsPanel from "./components/Settingspanel";
import SettingsPanelNew from "./components/SettingspanelNew";
import CurrencyBalanceReport from "./components/CurrencyBalanceReport";
import Stocks from "./pages/Stocks";
import DealerExchange from "./pages/DealerExchange";
import Reports from "./pages/Reports";
import VaultTransfer from "./pages/VaultTransfer";
import BranchTransfer from "./pages/BranchTransfer";
import { Navigate } from "react-router-dom";
import CustomerRequests from "./pages/CustomerRequestsReports";
import CustomPos from "./pages/CustomPos";
import PosRouteGuard from "./components/PosRouteGuard";

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
    <BrowserRouter basename="/home" unstable_useTransitions={false}>
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

        {/* <Route
          path="/money-transfer"
          element={
            <ProtectedRoute>
              <PosRouteGuard><MoneyTransfer /></PosRouteGuard>
            </ProtectedRoute>
          }
        />*/}

        {/* <Route
          path="/exchange"
          element={
            <ProtectedRoute>
              <PosRouteGuard><MoneyExchange /></PosRouteGuard>
            </ProtectedRoute>
          }
        />*/}

        <Route
          path="/money-transfer"
          element={
            <ProtectedRoute>
              <PosRouteGuard><MoneyTransferNew /></PosRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/exchange"
          element={
            <ProtectedRoute>
              <PosRouteGuard><MoneyExchangeNew /></PosRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route path="/customer-requests" element={<ProtectedRoute><CustomerRequests /></ProtectedRoute>} />

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
              <PosRouteGuard><DealerExchange /></PosRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/vault-transfer"
          element={
            <ProtectedRoute>
              <PosRouteGuard><VaultTransfer /></PosRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/branch-transfer"
          element={
            <ProtectedRoute>
              <PosRouteGuard><BranchTransfer /></PosRouteGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/transfer"
          element={<Navigate to="/vault-transfer" replace />}
        />

        <Route path="/pos" element={<ProtectedRoute><CustomPos /></ProtectedRoute>} />
        <Route path="/pos/open" element={<ProtectedRoute><CustomPos /></ProtectedRoute>} />
        <Route path="/pos/close" element={<ProtectedRoute><CustomPos /></ProtectedRoute>} />
        <Route path="/pos/approvals" element={<ProtectedRoute><CustomPos /></ProtectedRoute>} />

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
        {/* <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPanel />
            </ProtectedRoute>
          }
        />*/}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPanelNew />
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
