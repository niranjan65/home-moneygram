import React, { useEffect, useState } from "react";
import { sessionAxios as axios } from "../api/sessionClient.js";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const ERPNEXT_API_URL =
  "/api/resource/Money Transfer";

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(ERPNEXT_API_URL, {
        headers: {
        },
        params: {
          fields: JSON.stringify([
            "name",
            "customer_name",
            "receiver_name",
            "date",
            "local_currency",
            "foreign_currency",
            "total_payable",
          ]),
          order_by: "creation desc",
        },
      });

      setTransactions(response.data.data || []);
    } catch (error) {
      console.error("Error fetching transactions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <>
      <Navbar />

      <section className="min-h-screen bg-[var(--color-background-light)] py-16 px-6">
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-lg p-10">

          <h1 className="text-3xl font-bold mb-8">
            Transaction History
          </h1>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-[#E00000]/20 animate-ping absolute" />
                <div className="w-10 h-10 rounded-full border-3 border-gray-200 border-t-[#E00000] animate-spin" />
              </div>
              <p className="mt-4 text-sm font-semibold text-gray-700 animate-pulse">Loading transaction records…</p>
              <p className="text-xs text-gray-400 mt-1">Please wait while transactions are being retrieved…</p>
            </div>
          ) : transactions.length === 0 ? (
            <p>No transactions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">

                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-4">ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Receiver</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Sent</th>
                    <th className="p-4">Received</th>
                    <th className="p-4">Total</th>
                  </tr>
                </thead>

                <tbody>
                  {transactions.map((txn) => (
                    <tr
                      key={txn.name}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-4">{txn.name}</td>
                      <td className="p-4">{txn.customer_name}</td>
                      <td className="p-4">{txn.receiver_name}</td>
                      <td className="p-4">{txn.date}</td>
                      <td className="p-4">{txn.local_currency}</td>
                      <td className="p-4">{txn.foreign_currency}</td>
                      <td className="p-4 font-semibold">
                        {txn.total_payable}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
};

export default TransactionHistory;
