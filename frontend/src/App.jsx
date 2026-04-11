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
import { io } from "socket.io-client";
import SoldiLanding from "./components/SoldiLanding";
import SettingsPanel from "./components/Settingspanel";
import CurrencyBalanceReport from "./components/CurrencyBalanceReport";
import Stocks from "./pages/Stocks";
import DealerExchange from "./pages/DealerExchange";
import Reports from "./pages/Reports";

function App() {

  //   const socket = io("http://182.71.135.110:8079");

  // useEffect(() => {
  //   console.log("object")
  //   socket.on("new-sales-invoice", (data) => {
  //     console.log("New Invoice:", data);

  //     // Update state here
  //   });
  // }, []);
  useEffect(() => {
    if (location.pathname === "/") {
      window.location.href = `https://mhmoneyexpress.anantdv.com/home`;
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
