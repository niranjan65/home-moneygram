import { useEffect, useState, useCallback, useRef } from "react";
import Navbar from "../components/layout/Navbar";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { useSettings } from "../context/SettingsContext";
import { useAppConfiguration } from "../hooks/useAppConfiguration";
import { ChevronDown, Download, Search, X, User, Check, RefreshCw } from "lucide-react";
import { printThermalReceipt } from "../components/ThermalReceiptPrint";

// ── CSV Export Helper ──────────────────────────────────────────────────────
function downloadCSV(filename, headers, rows) {
  if (!rows || rows.length === 0) return;

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return "";
    const str = String(val).trim();
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers
    .map((h) => escapeCSV(typeof h === "object" ? h.label : h))
    .join(",");

  const dataLines = rows.map((row) => {
    if (Array.isArray(row)) {
      return row.map(escapeCSV).join(",");
    }
    return headers
      .map((h) => {
        const key = typeof h === "object" ? (h.key || h.fieldname) : h;
        const accessor = typeof h === "object" ? h.accessor : null;
        const val = accessor ? accessor(row) : row[key];
        return escapeCSV(val);
      })
      .join(",");
  });

  const csvContent = "\uFEFF" + [headerLine, ...dataLines].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}




// ── Stock tab constants ─────────────────────────────────────────────────────
const CURRENCY_CODE = {
  Australia: "AUD",
  Canada: "CAD",
  China: "CNY",
  Euro: "EUR",
  Fiji: "FJD",
  "French Pacific": "XPF",
  HongKong: "HKD",
  Japan: "JPY",
  Korea: "KRW",
  Malaysia: "MYR",
  "New Zealand": "NZD",
  "Papua New Guinea": "PGK",
  Philippines: "PHP",
  Samoa: "WST",
  Singapore: "SGD",
  Switzerland: "CHF",
  Thailand: "THB",
  Tonga: "TOP",
  UK: "GBP",
  USA: "USD",
  Vanuatu: "VUV",
};

const FLAG = {
  Australia: "🇦🇺",
  Canada: "🇨🇦",
  China: "🇨🇳",
  Euro: "🇪🇺",
  Fiji: "🇫🇯",
  "French Pacific": "🇵🇫",
  HongKong: "🇭🇰",
  Japan: "🇯🇵",
  Korea: "🇰🇷",
  Malaysia: "🇲🇾",
  "New Zealand": "🇳🇿",
  "Papua New Guinea": "🇵🇬",
  Philippines: "🇵🇭",
  Samoa: "🇼🇸",
  Singapore: "🇸🇬",
  Switzerland: "🇨🇭",
  Thailand: "🇹🇭",
  Tonga: "🇹🇴",
  UK: "🇬🇧",
  USA: "🇺🇸",
  Vanuatu: "🇻🇺",
};

// ── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Paid: "bg-green-50 text-green-700 border-green-200",
    Unpaid: "bg-yellow-50 text-yellow-700 border-yellow-200",
    Overdue: "bg-red-50 text-red-500 border-red-200",
    "Part Paid": "bg-blue-50 text-blue-600 border-blue-200",
    Cancelled: "bg-gray-100 text-gray-400 border-gray-200",
    Draft: "bg-gray-50 text-gray-500 border-gray-200",
    Return: "bg-purple-50 text-purple-600 border-purple-200",
  };
  const cls = map[status] ?? "bg-gray-100 text-gray-400 border-gray-200";
  return (
    <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cls}`}>
      {status ?? "—"}
    </span>
  );
}

// ── Amount Cell ────────────────────────────────────────────────────────────
function AmtCell({ value, currency }) {
  if (value == null || value === "") return <span className="text-gray-300">—</span>;
  const num = parseFloat(value);
  const colored = num < 0 ? "text-red-500" : num === 0 ? "text-gray-400" : "text-gray-800";
  return (
    <span className={`tabular-nums font-semibold ${colored}`}>
      {num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      {currency ? <span className="ml-1 text-[10px] font-bold text-gray-400">{currency}</span> : null}
    </span>
  );
}

// ── Text Cell ──────────────────────────────────────────────────────────────
function TextCell({ value, mono = false, muted = false }) {
  if (!value) return <span className="text-gray-300">—</span>;
  return (
    <span className={`${mono ? "font-mono text-xs" : "text-sm"} ${muted ? "text-gray-400" : "text-gray-700"}`}>
      {value}
    </span>
  );
}

// ── Day End Row ────────────────────────────────────────────────────────────
function DayEndRow({ label, value, sub, highlight = false }) {
  return (
    <tr className={`border-b border-gray-100 ${highlight ? "bg-red-50/40" : "hover:bg-gray-50"} transition-colors`}>
      <td className="px-5 py-3.5 text-sm font-semibold text-gray-700">{label}</td>
      <td className="px-5 py-3.5 text-right">
        <span className={`tabular-nums font-black text-base ${highlight ? "text-[#E00000]" : "text-gray-900"}`}>
          {value ?? "—"}
        </span>
      </td>
      {sub !== undefined && (
        <td className="px-5 py-3.5 text-right text-xs text-gray-400">{sub}</td>
      )}
    </tr>
  );
}

// ── Tab Button ─────────────────────────────────────────────────────────────
function TabButton({ label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E00000]
        ${active
          ? "bg-[#E00000] text-white border-[#E00000] shadow-md shadow-[#E00000]/20"
          : "bg-gray-50 text-gray-500 border-gray-200 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50"
        }`}
    >
      {label}
      {count != null && (
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-black tabular-nums
          ${active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── Money Transfer Receipt Print Helper ────────────────────────────────────
function printMoneyTransferReceipt(transfer) {
  const printWindow = window.open("", "_blank", "width=420,height=750");
  if (!printWindow) {
    alert("Unable to open print window. Please allow pop-ups.");
    return;
  }

  const d = transfer || {};
  const company = d.company || "MH MONEY EXPRESS";
  const txnId = d.name || d.transaction_id || "—";
  const refCode = d.transaction_id || "—";
  const postingDate = (d.posting_date ? String(d.posting_date).split(/[\sT]/)[0] : '') || (d.creation ? d.creation.slice(0, 10) : "—");
  const rawTime = (d.posting_time ? String(d.posting_time).split('.')[0] : '') || (d.creation && d.creation.length >= 19 ? d.creation.slice(11, 19) : "");
  const customer = d.custom_customer_full_name || d.full_name || d.customer_id || "—";
  const customerId = d.customer_id || "—";
  const transferType = (d.transfer_type || "Send").toUpperCase();
  const currency = d.currency || "FJD";
  const status = d.docstatus === 2 || d.status === "Cancelled" ? "Cancelled" : "Paid";
  const amount = Number(d.amount || d.grand_total || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const warehouse = d.warehouse || d.set_warehouse || "—";
  const agent = d.owner || "—";

  const rows = (d.currency_denomination || []).map((row) => `
    <div style="margin-bottom:4px">
      <div style="font-weight:700">${row.denomination || "Denomination"}</div>
      <div style="display:flex; justify-content:space-between; font-size:10px; color:#444">
        <span>${row.qty || 1} pcs</span>
        <span style="font-weight:700">${Number(row.amount || 0).toFixed(2)} ${currency}</span>
      </div>
    </div>
  `).join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Money Transfer Receipt - ${txnId}</title>
        <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Libre+Barcode+39&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #f0f0f0; display: flex; justify-content: center; padding: 25px; }
          .receipt-root {
            font-family: 'Share Tech Mono', 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.5;
            color: #000;
            background: #fff;
            width: 320px;
            padding: 22px 18px 28px;
            border: 1px dashed #ccc;
          }
          .r-center { text-align: center; }
          .r-bold { font-weight: 700; letter-spacing: 0.04em; }
          .r-divider { border: none; border-top: 1px dashed #555; margin: 10px 0; }
          .r-divider-solid { border: none; border-top: 2px solid #000; margin: 10px 0; }
          .r-row { display: flex; justify-content: space-between; gap: 4px; }
          .r-row .label { flex: 1; color: #555; }
          .r-row .value { white-space: nowrap; font-weight: 600; }
          .r-heading { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; }
          .r-xl { font-size: 22px; font-weight: 700; letter-spacing: 0.05em; }
          .r-small { font-size: 10px; line-height: 1.6; color: #444; }
          .r-barcode { font-family: 'Libre Barcode 39', 'Courier New', monospace; font-size: 36px; letter-spacing: 4px; line-height: 1; }
          .r-status { display: inline-block; border: 1.5px solid #000; padding: 1px 8px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; }
          @media print {
            body { background: white; padding: 0; }
            @page { size: 80mm auto; margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-root">
          <div class="r-center" style="margin-bottom:12px">
            <div class="r-bold" style="font-size:15px;letter-spacing:0.1em;text-transform:uppercase">${company}</div>
            <div class="r-small" style="margin-top:3px">MONEY TRANSFER SERVICES</div>
            <div class="r-small">Branch Location: ${warehouse}</div>
          </div>
          <hr class="r-divider-solid" />
          <div class="r-center r-bold r-heading" style="margin-bottom:8px">*** MONEY TRANSFER RECEIPT (${transferType}) ***</div>

          <div class="r-row"><span class="label">DATE:</span><span class="value">${postingDate}</span></div>
          ${rawTime ? `<div class="r-row"><span class="label">TIME:</span><span class="value">${rawTime}</span></div>` : ''}
          <div class="r-row"><span class="label">TRANSFER REF:</span><span class="value r-bold">${txnId}</span></div>
          ${refCode && refCode !== "—" ? `<div class="r-row"><span class="label">TXN / OET ID:</span><span class="value r-bold">${refCode}</span></div>` : ''}
          <div class="r-row"><span class="label">STATUS:</span><span class="value"><span class="r-status">${status}</span></span></div>

          <hr class="r-divider" />
          <div class="r-row"><span class="label">CUSTOMER:</span><span class="value r-bold">${customer}</span></div>
          ${customerId && customerId !== customer ? `<div class="r-row"><span class="label">CUSTOMER ID:</span><span class="value r-small">${customerId}</span></div>` : ''}
          <div class="r-row"><span class="label">TRANSFER TYPE:</span><span class="value r-bold">${transferType}</span></div>
          <hr class="r-divider" />

          ${rows ? `
            <div class="r-heading r-bold" style="margin-bottom:6px">DENOMINATIONS</div>
            ${rows}
            <hr class="r-divider" />
          ` : ''}

          <div class="r-row" style="align-items:baseline">
            <span class="label r-bold r-heading">TOTAL AMOUNT:</span>
            <span class="value r-xl">${currency} ${amount}</span>
          </div>

          <hr class="r-divider-solid" />

          <div class="r-center" style="margin-top:12px">
            <div class="r-barcode">*${txnId}*</div>
            <div class="r-small" style="margin-top:2px;letter-spacing:0.08em">${txnId}</div>
            <div style="margin-top:14px" class="r-small">
              THANK YOU FOR CHOOSING<br>
              <span class="r-bold">${company}</span><br>
              Cashier / Operator: ${agent}
            </div>
            <div style="margin-top:16px" class="r-small">
              *** CUSTOMER ACKNOWLEDGEMENT ***<br><br>
              <span style="border-bottom:1px solid #000;display:inline-block;width:140px;margin-top:4px">&nbsp;</span><br>
              Signature
            </div>
          </div>
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// ── Searchable ERPNext Customer Link Filter ────────────────────────────────
function CustomerLinkFilter({ customers, selectedCustomer, onSelect, loading }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const selectedObj = customers.find((c) => c.name === selectedCustomer);
  const displayName = selectedObj ? (selectedObj.custom_full_name || selectedObj.customer_name) : "";

  const filtered = customers.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.customer_name?.toLowerCase().includes(q) ||
      c.custom_full_name?.toLowerCase().includes(q)
    );
  }).slice(0, 60);

  return (
    <div className="relative min-w-[240px] max-w-[320px] flex-1 sm:flex-initial" ref={ref}>
      <div
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer transition-all bg-white select-none
          ${open ? "border-[#E00000] ring-2 ring-[#E00000]/20 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <User size={15} className={selectedCustomer ? "text-[#E00000]" : "text-gray-400"} />
          {selectedCustomer ? (
            <div className="truncate">
              <span className="font-semibold text-gray-800 text-xs">{displayName}</span>
              <span className="text-[10px] text-gray-400 font-mono ml-1.5">({selectedObj?.name})</span>
            </div>
          ) : (
            <span className="text-gray-400 text-xs">All Customers (Filter…)</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedCustomer && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect("");
                setQuery("");
              }}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Clear Customer Filter"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </div>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[280px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in duration-100">
          <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customer name or ID…"
              className="w-full bg-transparent text-xs text-gray-800 focus:outline-none placeholder-gray-400"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600">
                <X size={12} />
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
            <div
              onClick={() => {
                onSelect("");
                setOpen(false);
                setQuery("");
              }}
              className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors
                ${!selectedCustomer ? "bg-red-50 text-[#E00000] font-bold" : "hover:bg-gray-50 text-gray-700"}`}
            >
              <span>All Customers</span>
              {!selectedCustomer && <Check size={14} />}
            </div>

            {loading ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">Loading customers…</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">No matching customers</div>
            ) : (
              filtered.map((c) => {
                const isSelected = selectedCustomer === c.name;
                const name = c.custom_full_name || c.customer_name;
                return (
                  <div
                    key={c.name}
                    onClick={() => {
                      onSelect(c.name);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`px-3 py-2 cursor-pointer transition-colors flex items-center justify-between
                      ${isSelected ? "bg-red-50 text-[#E00000]" : "hover:bg-gray-50 text-gray-700"}`}
                  >
                    <div className="truncate pr-2">
                      <div className={`text-xs ${isSelected ? "font-bold text-[#E00000]" : "font-medium text-gray-800"}`}>
                        {name}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono truncate">{c.name}</div>
                    </div>
                    {isSelected && <Check size={14} className="shrink-0 text-[#E00000]" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Transactions Tab ───────────────────────────────────────────────────────
function TransactionsTab({ warehouse, loginUser }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All"); // "All" | "Currency Exchange" | "Dealer Exchange" | "Money Transfer"
  const [selectedStatus, setSelectedStatus] = useState("All"); // "All" | "Paid" | "Cancelled"
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("All");
  const [warehousesList, setWarehousesList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [cancellingRowId, setCancellingRowId] = useState(null);
  const [printingRowId, setPrintingRowId] = useState(null);

  // Load customer list for filter
  const fetchCustomers = useCallback(async () => {
    if (!loginUser?.user) return;
    setCustomersLoading(true);
    try {
      const res = await axios.get(
        "/api/method/moneygram.moneygram.api.get_transactions.get_customers_list",
        {
          headers: {
            Authorization: `token ${loginUser.user.api_key}:${loginUser.user.api_secret}`,
          },
        }
      );
      setCustomers(res.data?.message ?? []);
    } catch (err) {
      console.error("Error fetching customers list:", err);
    } finally {
      setCustomersLoading(false);
    }
  }, [loginUser]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Load warehouses list
  useEffect(() => {
    if (!loginUser?.user) return;
    axios
      .get("/api/method/moneygram.moneygram.api.get_transactions.get_warehouses_list", {
        headers: {
          Authorization: `token ${loginUser.user.api_key}:${loginUser.user.api_secret}`,
        },
      })
      .then((res) => {
        setWarehousesList(res.data?.message ?? []);
      })
      .catch((err) => {
        console.error("Error fetching warehouses list:", err);
      });
  }, [loginUser]);

  // Fetch unified transactions
  const fetchData = useCallback(async () => {
    if (!loginUser?.user) return;
    setLoading(true);
    try {
      const res = await axios.post(
        "/api/method/moneygram.moneygram.api.get_transactions.get_all_transactions",
        {
          warehouse: selectedWarehouse === "All" ? undefined : selectedWarehouse,
          party: selectedCustomer || undefined,
          transaction_type: selectedType === "All" ? undefined : selectedType,
          status: selectedStatus === "All" ? undefined : selectedStatus,
          limit_start: 0,
          limit_page_length: 500,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `token ${loginUser.user.api_key}:${loginUser.user.api_secret}`,
          },
        }
      );
      setRows(res.data?.message?.data ?? []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [loginUser, selectedWarehouse, selectedType, selectedCustomer, selectedStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cancellation handling
  const handleCancelRow = async (row) => {
    if (!window.confirm(`Are you sure you want to cancel ${row.type || 'transaction'} ${row.name}?`)) {
      return;
    }

    setCancellingRowId(row.name);
    try {
      if (row.type === "Money Transfer") {
        await axios.post(
          "/api/method/frappe.client.cancel",
          {
            doctype: "Money Transfer",
            name: row.source_docname || row.name,
          },
          {
            headers: {
              Authorization: `token ${loginUser.user.api_key}:${loginUser.user.api_secret}`,
              "Content-Type": "application/json",
            },
          }
        );
      } else if (row.type === "Dealer Exchange") {
        const dealerDocName = row.source_docname || row.name;
        await axios.put(
          `/api/resource/Currency%20Exchange%20For%20Dealer/${encodeURIComponent(dealerDocName)}`,
          { docstatus: 2 },
          {
            headers: {
              Authorization: `token ${loginUser.user.api_key}:${loginUser.user.api_secret}`,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        // Currency Exchange (Retail Forex)
        let ceDocName = row.source_docname;
        if (!ceDocName) {
          const searchRes = await axios.get(
            "/api/resource/Currency%20Exchange%20For%20Customer",
            {
              params: {
                filters: JSON.stringify([["sales_invoice_number", "=", row.name]]),
                fields: JSON.stringify(["name"]),
                limit_page_length: 1,
              },
              headers: {
                Authorization: `token ${loginUser.user.api_key}:${loginUser.user.api_secret}`,
              },
            }
          );
          ceDocName = searchRes.data?.data?.[0]?.name;
        }

        if (ceDocName) {
          await axios.post(
            "/api/method/moneygram.moneygram.doctype.currency_exchange_for_customer.currency_exchange_for_customer.cancel_currency_exchange",
            { docname: ceDocName },
            {
              headers: {
                Authorization: `token ${loginUser.user.api_key}:${loginUser.user.api_secret}`,
                "Content-Type": "application/json",
              },
            }
          );
        } else {
          await axios.put(
            `/api/resource/Sales%20Invoice/${encodeURIComponent(row.name)}`,
            { docstatus: 2 },
            {
              headers: {
                Authorization: `token ${loginUser.user.api_key}:${loginUser.user.api_secret}`,
                "Content-Type": "application/json",
              },
            }
          );
        }
      }

      alert(`${row.type || 'Transaction'} has been successfully cancelled.`);

      // Update local state to reflect cancellation immediately
      setRows((prevRows) =>
        prevRows.map((r) => (r.name === row.name ? { ...r, status: "Cancelled", docstatus: 2 } : r))
      );
    } catch (error) {
      console.error("Error cancelling transaction:", error);
      const errMsg =
        error.response?.data?.message ||
        error.response?.data?._server_messages ||
        error.message ||
        "Failed to cancel the transaction.";
      alert(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
    } finally {
      setCancellingRowId(null);
    }
  };

  // Receipt printing handling
  const handlePrintRow = async (row) => {
    setPrintingRowId(row.name);
    try {
      if (row.type === "Money Transfer") {
        const response = await axios.get(
          `/api/resource/Money%20Transfer/${encodeURIComponent(row.source_docname || row.name)}`,
          {
            headers: {
              Authorization: `token ${loginUser.user.api_key}:${loginUser.user.api_secret}`,
            },
          }
        );
        const mtData = response.data?.data || row;
        printMoneyTransferReceipt({
          ...mtData,
          custom_customer_full_name: row.custom_customer_full_name,
        });
      } else {
        // Retail or Dealer Forex
        try {
          const response = await axios.get(
            `/api/resource/Sales%20Invoice/${encodeURIComponent(row.name)}`,
            {
              headers: {
                Authorization: `token ${loginUser.user.api_key}:${loginUser.user.api_secret}`,
              },
            }
          );
          printThermalReceipt(response.data?.data);
        } catch (siErr) {
          // If Sales Invoice not found directly (e.g. purged test records), print fallback receipt
          printThermalReceipt({
            name: row.name,
            posting_date: row.posting_date,
            custom_customer_full_name: row.custom_customer_full_name || row.party,
            grand_total: row.grand_total,
            currency: row.currency || "FJD",
            docstatus: row.docstatus,
            company: row.company || "MH MONEY EXPRESS",
            set_warehouse: row.set_warehouse,
          });
        }
      }
    } catch (error) {
      console.error("Error printing receipt:", error);
      alert("Failed to print receipt. Please try again.");
    } finally {
      setPrintingRowId(null);
    }
  };

  // Defensively filter rows locally across all active filters
  const filtered = rows.filter((r) => {
    // 1. Status Filter
    if (selectedStatus && selectedStatus !== "All") {
      if ((r.status || "").toLowerCase() !== selectedStatus.toLowerCase()) {
        return false;
      }
    }

    // 2. Type Filter
    if (selectedType && selectedType !== "All") {
      if (r.type !== selectedType) {
        return false;
      }
    }

    // 3. Customer Filter
    if (selectedCustomer) {
      const party = (r.party || "").toLowerCase();
      const fullName = (r.custom_customer_full_name || "").toLowerCase();
      const target = selectedCustomer.toLowerCase();

      const selObj = customers.find((c) => c.name === selectedCustomer);
      const cName = (selObj?.customer_name || "").toLowerCase();
      const cFullName = (selObj?.custom_full_name || "").toLowerCase();

      const match =
        party === target ||
        party.includes(target) ||
        fullName === target ||
        fullName.includes(target) ||
        (cName && (party.includes(cName) || fullName.includes(cName))) ||
        (cFullName && (party.includes(cFullName) || fullName.includes(cFullName)));

      if (!match) return false;
    }

    // 4. Warehouse Filter
    if (selectedWarehouse && selectedWarehouse !== "All") {
      if (r.set_warehouse !== selectedWarehouse) {
        return false;
      }
    }

    // 5. Search Text Filter
    if (search) {
      const q = search.toLowerCase();
      return [
        r.name,
        r.party,
        r.status,
        r.currency,
        r.company,
        r.owner,
        r.custom_customer_full_name,
        r.type,
        r.oet_code,
        r.set_warehouse,
      ].some((v) => v?.toString().toLowerCase().includes(q));
    }

    return true;
  });

  const totalGrand = filtered.reduce((s, r) => s + (parseFloat(r.grand_total) || 0), 0);

  // CSV Export with clean fields and NO outstanding amount
  const handleExportCSV = () => {
    if (!filtered || filtered.length === 0) return;

    const headers = [
      { label: "Reference ID", key: "name" },
      { label: "Type", key: "type" },
      { label: "Posting Date", key: "posting_date" },
      { label: "OET / Txn ID", key: "oet_code" },
      { label: "Customer", accessor: (r) => r.custom_customer_full_name || r.party || "" },
      { label: "Customer ID", key: "party" },
      { label: "Amount", key: "grand_total" },
      { label: "Currency", key: "currency" },
      { label: "Status", key: "status" },
      { label: "Branch Location", key: "set_warehouse" },
      { label: "Owner", key: "owner" },
      { label: "Company", key: "company" },
    ];

    const safeDate = new Date().toISOString().slice(0, 10);
    const typeLabel = selectedType.replace(/\s+/g, "_");
    downloadCSV(`Transactions_Report_${typeLabel}_${safeDate}`, headers, filtered);
  };

  // Compute counts for dedication pills
  const countsByType = {
    All: rows.length,
    "Currency Exchange": rows.filter((r) => r.type === "Currency Exchange").length,
    "Dealer Exchange": rows.filter((r) => r.type === "Dealer Exchange").length,
    "Money Transfer": rows.filter((r) => r.type === "Money Transfer").length,
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Dedicated Transaction Type Switcher ────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap border-b border-gray-100 pb-3">
        {[
          { id: "All", label: "All Transactions" },
          { id: "Currency Exchange", label: "Currency Exchange" },
          { id: "Dealer Exchange", label: "Dealer Exchange" },
          { id: "Money Transfer", label: "Money Transfer" },
        ].map((tab) => {
          const active = selectedType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-150 ${
                active
                  ? "bg-[#E00000] text-white border-[#E00000] shadow-sm shadow-[#E00000]/20"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50/50"
              }`}
            >
              <span>{tab.label}</span>
              {selectedType === "All" && countsByType[tab.id] != null && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-black tabular-nums ${
                    active ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {countsByType[tab.id]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Search, Customer Link Filter, Warehouse, Status, Actions ─────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Free text search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, customer, status, branch location…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#E00000]/30 focus:border-[#E00000]/50 placeholder-gray-400"
          />
        </div>

        {/* Customer Link Field Filter */}
        <CustomerLinkFilter
          customers={customers}
          selectedCustomer={selectedCustomer}
          onSelect={setSelectedCustomer}
          loading={customersLoading}
        />

        {/* Branch Location Dropdown */}
        <select
          value={selectedWarehouse}
          onChange={(e) => setSelectedWarehouse(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#E00000]/30 cursor-pointer"
          title="Filter by Branch Location"
        >
          <option value="All">All Branch Locations</option>
          {warehousesList.map((wh) => (
            <option key={wh.name} value={wh.name}>
              {wh.warehouse_name || wh.name}
            </option>
          ))}
        </select>

        {/* Status Dropdown */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#E00000]/30 cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        {/* Refresh */}
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50 transition-all shadow-xs cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-[#E00000]" : ""} />
          Refresh
        </button>

        {/* Export CSV */}
        <button
          onClick={handleExportCSV}
          disabled={filtered.length === 0}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-xs ${
            filtered.length === 0
              ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"
              : "border-gray-200 bg-white text-gray-700 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50 cursor-pointer"
          }`}
          title="Export CSV"
        >
          <Download size={14} />
          Export CSV
        </button>

        <span className="text-xs text-gray-400 font-semibold tabular-nums ml-auto">
          {filtered.length} {filtered.length === 1 ? "record" : "records"}
        </span>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 overflow-x-auto bg-white shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
            <svg className="w-5 h-5 animate-spin text-[#E00000]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading transaction records…
          </div>
        ) : (
          <table className="w-full text-sm border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                {[
                  "#",
                  "Type",
                  "Reference ID",
                  "Date",
                  "OET / Txn ID",
                  "Customer",
                  "Amount",
                  "Currency",
                  "Status",
                  "Branch Location",
                  "Owner",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap ${
                      h === "Amount" ? "text-right" : ""
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-5 py-14 text-center text-gray-400 text-sm">
                    No transactions found for the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => {
                  const isMoneyTransfer = row.type === "Money Transfer";
                  const isDealerExchange = row.type === "Dealer Exchange";
                  const isCurrencyExchange = row.type === "Currency Exchange";

                  return (
                    <tr
                      key={`${row.name}_${idx}`}
                      className={`border-b border-gray-100 transition-colors hover:bg-gray-50/80 ${
                        idx % 2 === 1 ? "bg-gray-50/30" : "bg-white"
                      }`}
                    >
                      <td className="px-4 py-3.5 text-xs text-gray-400 tabular-nums">{idx + 1}</td>

                      {/* Dedicated Type Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isMoneyTransfer && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Money Transfer {row.transfer_type ? `(${row.transfer_type})` : ""}
                          </span>
                        )}
                        {isDealerExchange && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            Dealer Exchange
                          </span>
                        )}
                        {(isCurrencyExchange || (!isMoneyTransfer && !isDealerExchange)) && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {row.type || "Currency Exchange"}
                          </span>
                        )}
                      </td>

                      {/* Reference ID */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs border border-gray-200 rounded-lg px-2 py-0.5 bg-gray-50 text-gray-700 font-semibold truncate inline-block">
                          {row.name}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                        {row.posting_date}
                      </td>

                      {/* OET / Txn ID */}
                      <td className="px-4 py-3.5">
                        {row.oet_code ? (
                          <span className="font-mono text-xs border border-gray-200 rounded-lg px-2 py-0.5 bg-gray-50 text-gray-700 truncate inline-block">
                            {row.oet_code}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5 font-medium text-gray-800 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{row.custom_customer_full_name || row.party || "—"}</span>
                          {row.custom_customer_full_name && row.party && row.party !== row.custom_customer_full_name && (
                            <span className="text-[10px] text-gray-400 font-mono">{row.party}</span>
                          )}
                        </div>
                      </td>

                      {/* Amount (Grand Total) */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <AmtCell value={row.grand_total} />
                      </td>

                      {/* Currency */}
                      <td className="px-4 py-3.5 text-xs font-bold text-gray-500">
                        {row.currency ?? "FJD"}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={row.status} />
                      </td>

                      {/* Warehouse */}
                      <td className="px-4 py-3.5 text-xs text-gray-500 max-w-[140px] truncate">
                        <TextCell value={row.set_warehouse} muted />
                      </td>

                      {/* Owner */}
                      <td className="px-4 py-3.5 text-xs text-gray-400 max-w-[140px] truncate">
                        <TextCell value={row.owner} muted />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {/* Cancel Button */}
                          <button
                            onClick={() => handleCancelRow(row)}
                            disabled={row.status === "Cancelled" || row.status === "Draft" || cancellingRowId === row.name}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 border ${
                              row.status === "Cancelled" || row.status === "Draft"
                                ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                : "bg-white text-red-600 border-red-200 hover:bg-red-50 cursor-pointer"
                            }`}
                            title="Cancel Transaction"
                          >
                            {cancellingRowId === row.name ? (
                              <div className="w-3.5 h-3.5 rounded-full border border-t-transparent border-red-600 animate-spin" />
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            )}
                            Cancel
                          </button>

                          {/* Print Receipt Button */}
                          <button
                            onClick={() => handlePrintRow(row)}
                            disabled={printingRowId === row.name}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-gray-700 border border-gray-200 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50 transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                            title="Print Receipt"
                          >
                            {printingRowId === row.name ? (
                              <div className="w-3.5 h-3.5 rounded-full border border-t-transparent border-[#E00000] animate-spin" />
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                />
                              </svg>
                            )}
                            Receipt
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-[#E00000]/15">
                  <td colSpan={6} className="px-4 py-3 text-xs font-black uppercase tracking-widest text-[#E00000]">
                    Total Amount
                  </td>
                  <td className="px-4 py-3 text-right font-black text-gray-900 tabular-nums text-sm">
                    {totalGrand.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={5} />
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </div>
  );
}

// ── Day End Closing Report Tab ─────────────────────────────────────────────
function DayEndClosingTab({ warehouse, loginUser }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [oetCode, setOetCode] = useState("")
  const { potOptions, loading: potLoading, error: potError } = useAppConfiguration();

  const fetchReport = useCallback(async () => {

    if (!loginUser?.user) return;
    setLoading(true);
    try {
      const res = await axios.post(
        "/api/method/frappe.desk.query_report.run",
        {
          report_name: "MH Day End Report",
          filters: { "company": "MH Money Express", "from_date": date, "to_date": date, "oet_code": oetCode }

        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `token ${loginUser.user.api_key}:${loginUser.user.api_secret}`,
          },
        }
      );
      setReport(res.data?.message ?? null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [warehouse, loginUser, date, oetCode]);

  useEffect(() => { fetchReport(); }, [fetchReport]);
  // Reorder columns so 'currency' appears immediately after 'invoice_amount' (or by label/fieldname)
  const orderedColumns = (() => {
    if (!report?.columns) return [];
    const cols = [...report.columns];
    const currencyIdx = cols.findIndex(c => c.fieldname?.toLowerCase().includes('currency') || c.label?.toLowerCase().includes('currency'));
    if (currencyIdx === -1) return cols;

    const [currencyCol] = cols.splice(currencyIdx, 1);
    const invoiceAmountIdx = cols.findIndex(c => c.fieldname?.toLowerCase().includes('invoice_amount') || c.label?.toLowerCase().includes('invoice amount'));

    if (invoiceAmountIdx !== -1) {
      cols.splice(invoiceAmountIdx + 1, 0, currencyCol);
    } else {
      cols.push(currencyCol);
    }
    return cols;
  })();

  const handleExportCSV = () => {
    if (!report?.result || report.result.length === 0) return;

    const headers = orderedColumns.map((col) => ({
      label: col.label || col.fieldname,
      key: col.fieldname,
    }));

    const safeDate = date || new Date().toISOString().slice(0, 10);
    const safeOet = oetCode ? `_${oetCode}` : "";
    downloadCSV(`Day_End_Report_${safeDate}${safeOet}`, headers, report.result);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Date picker + refresh */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none"
          />
        </div>
        <button
          onClick={fetchReport}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Generate
        </button>

        <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50 transition-all cursor-pointer">
          <label htmlFor="oet-code" >
            OET Code
          </label>

          <select onChange={(e) => setOetCode(e.target.value)} name="oet-code" id="oet-code">
            <option value="">--SELECT--</option>
            {potOptions.map(pot => (
              <option
                key={pot.code} value={pot.code}>
                {pot.code}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
            <ChevronDown size={16} />
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={!report?.result || report.result.length === 0}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
            !report?.result || report.result.length === 0
              ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"
              : "border-gray-200 bg-gray-50 text-gray-700 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50 shadow-xs cursor-pointer"
          }`}
          title="Export report to CSV"
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
          <svg className="w-5 h-5 animate-spin text-[#E00000]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Generating report…
        </div>
      ) : !report ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-400 text-sm">
          No report data available for the selected date.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Summary Table */}
          <div className="rounded-2xl border border-gray-200 overflow-hidden md:col-span-2">
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#E00000]">Day End Summary · {date}</p>
              <button
                onClick={handleExportCSV}
                disabled={!report?.result || report.result.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export CSV"
              >
                <Download size={14} />
                Export CSV
              </button>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  {
                    orderedColumns.map((col) => (
                      <th key={col.fieldname} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        {col.label}
                      </th>
                    ))
                  }
                </tr>
              </thead>
              <tbody>
                {
                  report?.result?.map((row, idx) => (
                    <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 1 ? "bg-gray-50/40" : "bg-white"}`}>
                      {orderedColumns.map((col) => (
                        <td key={col.fieldname} className="px-5 py-3 text-left text-sm text-gray-700">
                          {row[col.fieldname] ?? "-"}
                        </td>
                      ))}
                    </tr>
                  ))
                }
              </tbody>
            </table>

          </div>


        </div>
      )}
    </div>
  );
}

// ── Stock Tab ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, type = "default" }) {
  const styles = {
    default: { card: "bg-white border-gray-200", label: "text-gray-500", val: "text-gray-900", sub: "text-gray-400" },
    green: { card: "bg-green-50 border-green-200", label: "text-green-600", val: "text-green-700", sub: "text-green-400" },
    red: { card: "bg-red-50 border-red-200", label: "text-red-500", val: "text-red-600", sub: "text-red-400" },
    muted: { card: "bg-gray-50 border-gray-100", label: "text-gray-400", val: "text-gray-400", sub: "text-gray-300" },
  };
  const s = styles[type];
  return (
    <div className={`flex-1 min-w-[140px] rounded-2xl border px-5 py-4 flex flex-col gap-1 ${s?.card}`}>
      <p className={`text-[11px] font-bold uppercase tracking-widest ${s?.label}`}>{label}</p>
      <p className={`text-[28px] font-black tabular-nums leading-tight ${s?.val}`}>{value}</p>
      {sub && <p className={`text-xs ${s.sub}`}>{sub}</p>}
    </div>
  );
}

function QtyBadge({ qty }) {
  if (qty < 0)
    return <span className="inline-block text-xs font-bold px-3 py-1 rounded-full tabular-nums bg-red-50 text-red-500 border border-red-200">{qty}</span>;
  if (qty === 0)
    return <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-400 border border-gray-200">—</span>;
  return <span className="inline-block text-xs font-bold px-3 py-1 rounded-full tabular-nums bg-green-50 text-green-700 border border-green-200">{qty.toLocaleString()}</span>;
}

function totalQty(items) { return items?.reduce((s, i) => s + i.stock_qty, 0); }
function inStockQty(items) { return items?.filter(i => i.stock_qty > 0).reduce((s, i) => s + i.stock_qty, 0); }
function totalValue(items) { return items?.reduce((sum, i) => sum + (i.stock_value || 0), 0); }

function StockTab({ warehouse, loginUser }) {
  const [data, setData] = useState({});
  const [active, setActive] = useState(null);

  const countries = Object.keys(data).filter((c) => data[c]?.length > 0);

  const fetchStock = useCallback(async () => {
    if (!loginUser?.user || !warehouse) return;
    try {
      const res = await axios.request({
        method: "POST",
        url: "/api/method/moneygram.moneygram.api.get_denomination.get_all_countries_stock",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${loginUser.user.api_key}:${loginUser.user.api_secret}`,
        },
        data: { warehouse: warehouse?.warehouse },
      });
      setData(res.data.message ?? {});
    } catch (err) {
      console.error(err);
    }
  }, [warehouse, loginUser]);

  useEffect(() => { fetchStock(); }, [fetchStock]);

  useEffect(() => {
    if (countries.length > 0 && !active) setActive(countries[0]);
  }, [data]);

  const items = data[active];
  const total = totalQty(items);
  const positive = inStockQty(items);
  const inStockCount = items?.filter(i => i.stock_qty > 0).length ?? 0;
  const totalValueAmt = totalValue(items);

  const handleExportCSV = () => {
    if (!items || items.length === 0) return;

    const headers = [
      { label: "Item Code", key: "item_code" },
      { label: "Denomination", key: "item_name" },
      { label: "Branch Location", key: "warehouse" },
      { label: "Rate", key: "valuation_rate" },
      { label: "Item Value", key: "stock_value" },
      { label: "Stock Qty", key: "stock_qty" },
    ];

    const safeDate = new Date().toISOString().slice(0, 10);
    const countryName = active || "All";
    downloadCSV(`Stock_Report_${countryName}_${safeDate}`, headers, items);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Currency tabs */}
      <div className="flex flex-wrap gap-2">
        {countries.map((c) => {
          const tot = totalValue(data[c]);
          const isActive = c === active;
          return (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E00000]
                ${isActive
                  ? "bg-[#E00000] text-white border-[#E00000] shadow-md shadow-[#E00000]/25"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50"
                }`}
            >
              <span className="text-base leading-none">{FLAG[c]}</span>
              <span>{c}</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-black tabular-nums
                ${isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}>
                {tot?.toLocaleString()}
              </span>
            </button>
          );
        })}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleExportCSV}
            disabled={!items || items.length === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
              !items || items.length === 0
                ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"
                : "border-gray-200 bg-gray-50 text-gray-700 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50 shadow-xs cursor-pointer"
            }`}
            title="Export Stock to CSV"
          >
            <Download size={15} />
            Export CSV
          </button>
          <button
            onClick={fetchStock}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {countries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-400 text-sm">
          No stock data available for this branch location.
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="flex flex-wrap gap-3">
            <StatCard label="Total Qty" value={total?.toLocaleString()} sub={`${CURRENCY_CODE[active]} · all denominations`} type="default" />
            <StatCard label="In Stock" value={positive?.toLocaleString()} sub={`${inStockCount} denomination${inStockCount !== 1 ? "s" : ""}`} type="green" />
            <StatCard label="Total Value" value={totalValueAmt?.toLocaleString()} sub={`${CURRENCY_CODE[active]} · total worth`} type="default" />
          </div>

          <div className="border-t border-gray-100" />

          {/* Active currency label */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs font-bold tracking-widest uppercase text-[#E00000]">Denominations</p>
            <span className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 text-xs text-gray-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
              {FLAG[active]}&nbsp;
              <span className="font-bold text-gray-900">{active}</span>
              <span className="text-gray-400">·</span>
              <span>{CURRENCY_CODE[active]}</span>
              <span className="text-gray-400">·</span>
              <span>{items?.length} items</span>
            </span>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["#", "Item Code", "Denomination", "Branch Location", "Rate", "Item Value", "Stock Qty"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items?.map((row, idx) => (
                  <tr key={row.item_code} className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50/40" : "bg-white"}`}>
                    <td className="px-5 py-3.5 text-xs text-gray-300 tabular-nums">{idx + 1}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium tracking-wide text-gray-700 bg-gray-50 font-mono">{row.item_code}</span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-gray-800">{row.item_name}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{row.warehouse}</td>
                    <td className="px-5 py-3.5 text-right"><QtyBadge qty={row.valuation_rate} /></td>
                    <td className="px-5 py-3.5 text-right"><QtyBadge qty={row.stock_value} /></td>
                    <td className="px-5 py-3.5 text-right"><QtyBadge qty={row.stock_qty} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-[#E00000]/15">
                  <td colSpan={4} className="px-5 py-3 text-xs font-black uppercase tracking-widest text-[#E00000]">Total</td>
                  <td className="px-5 py-3 text-right font-black text-gray-900 tabular-nums">{total?.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right font-black text-gray-900 tabular-nums">{totalValueAmt?.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right font-black text-gray-900 tabular-nums">{total?.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function Reports() {
  const [tab, setTab] = useState("transactions");
  const loginUser = useUser();
  const { selectedWarehouse } = useSettings();

  const sectionLabel = {
    transactions: "Transaction Records",
    dayend: "Day End Closing Report",
    stock: "Currency Stock",
  };

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gray-100 font-sans">
        <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col gap-6">

          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 md:p-8 flex flex-col gap-7">

            {/* Section label */}
            <p className="text-xs font-bold tracking-widest uppercase text-[#E00000]">Reports</p>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
              <TabButton
                label="Transactions"
                active={tab === "transactions"}
                onClick={() => setTab("transactions")}
              />
              <TabButton
                label="Day End Closing Report"
                active={tab === "dayend"}
                onClick={() => setTab("dayend")}
              />
              <TabButton
                label="Stock"
                active={tab === "stock"}
                onClick={() => setTab("stock")}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Section label */}
            <p className="text-xs font-bold tracking-widest uppercase text-[#E00000]">
              {sectionLabel[tab]}
            </p>

            {/* Tab Content */}
            {tab === "transactions" && (
              <TransactionsTab warehouse={selectedWarehouse} loginUser={loginUser} />
            )}
            {tab === "dayend" && (
              <DayEndClosingTab warehouse={selectedWarehouse} loginUser={loginUser} />
            )}
            {tab === "stock" && (
              <StockTab warehouse={selectedWarehouse} loginUser={loginUser} />
            )}

          </div>

          <p className="text-center text-xs text-gray-400 pb-2">MH Money Express · Reports · Stores - MME</p>
        </div>
      </div>
    </div>
  );
}