import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Navbar from "../components/layout/Navbar";
import { sessionAxios as axios } from "../api/sessionClient.js";
import { useUser } from "../context/UserContext";
import { useSettings } from "../context/SettingsContext";
import { useAppConfiguration } from "../hooks/useAppConfiguration";
import { customPos } from "../api/customPos";
import {
  ChevronDown,
  Download,
  Search,
  X,
  User,
  Check,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CalendarRange,
  ClipboardCheck,
  CheckCircle2,
} from "lucide-react";
import { printThermalReceipt } from "../components/ThermalReceiptPrint";

const CASH_COUNTER_COUNTRY = {
  AUD: "Australia", CAD: "Canada", CHF: "Switzerland", EUR: "Euro", FJD: "Fiji",
  GBP: "UK", HKD: "HongKong", JPY: "Japan", KRW: "Korea", NZD: "New Zealand",
  PGK: "Papua New Guinea", SGD: "Singapore", TOP: "Tonga", USD: "USA",
  VUV: "Vanuatu", WST: "Samoa", XPF: "French Pacific",
};
const registerLabel = value => String(value || "").toLowerCase() === "opening" ? "Open Register" : String(value || "").toLowerCase() === "closing" ? "Close Register" : String(value || "Register");
const currencyPair = row => `${row?.from_currency || "—"} → ${row?.to_currency || "—"}`;
const transactionTypeLabel = row => {
  const type = row?.type || "Currency Exchange";
  const action = String(row?.transfer_type || "").trim();
  return action ? `${type} (${action[0].toUpperCase()}${action.slice(1).toLowerCase()})` : type;
};

// ── CSV Export Helper ──────────────────────────────────────────────────────
function downloadCSV(filename, headers, rows) {
  if (!rows || rows.length === 0) return;

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return "";
    const str = String(val).trim();
    if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
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

// ── Excel Export Helper (.xls XML/HTML format) ──────────────────────────────
function downloadExcel(filename, headers, rows, sheetTitle = "Report") {
  if (!rows || rows.length === 0) return;

  const escapeHTML = (val) => {
    if (val === null || val === undefined) return "";
    return String(val)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const headerCells = headers
    .map(
      (h) =>
        `<th style="background-color:#E00000;color:#ffffff;font-weight:bold;padding:9px 12px;border:1px solid #d00000;font-size:11pt;text-align:${h.align === "right" ? "right" : "left"
        };">${escapeHTML(typeof h === "object" ? h.label : h)}</th>`
    )
    .join("");

  const bodyRows = rows
    .map((row) => {
      const cells = headers
        .map((h) => {
          const key = typeof h === "object" ? (h.key || h.fieldname) : h;
          const accessor = typeof h === "object" ? h.accessor : null;
          let val = accessor ? accessor(row) : row[key];
          const isNum =
            typeof val === "number" ||
            (!isNaN(parseFloat(val)) &&
              isFinite(val) &&
              (String(key).includes("total") ||
                String(key).includes("amount") ||
                String(key).includes("qty") ||
                String(key).includes("rate") ||
                String(key).includes("value")));
          const align = h.align === "right" || isNum ? "right" : "left";
          const msoFormat = isNum ? 'mso-number-format:"\\#,\\#\\#0.00";' : 'mso-number-format:"\\@";';
          return `<td style="border:1px solid #e2e8f0;padding:6px 12px;text-align:${align};${msoFormat}">${escapeHTML(
            val
          )}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const tableHTML = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${escapeHTML(sheetTitle.slice(0, 31))}</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Inter', Calibri, Arial, sans-serif; font-size: 11pt; }
        table { border-collapse: collapse; width: 100%; margin-top: 12px; }
        h2 { color: #E00000; font-family: 'Inter', Calibri, Arial, sans-serif; margin-bottom: 2px; }
        h3 { color: #1e293b; font-family: 'Inter', Calibri, Arial, sans-serif; margin-top: 2px; margin-bottom: 4px; }
        p { color: #64748b; font-size: 10pt; margin-top: 0; }
      </style>
    </head>
    <body>
      <h2>MH MONEY EXPRESS</h2>
      <h3>${escapeHTML(sheetTitle)}</h3>
      <p>Exported: ${new Date().toLocaleString()} · Total Records: ${rows.length}</p>
      <table>
        <thead>
          <tr>${headerCells}</tr>
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([tableHTML], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".xls") ? filename : `${filename}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── PDF / Print Export Helper ──────────────────────────────────────────────
function exportToPDF(title, headers, rows, metadata = {}) {
  if (!rows || rows.length === 0) return;
  const printWindow = window.open("", "_blank", "width=1200,height=800");
  if (!printWindow) {
    alert("Please allow pop-ups to export report to PDF or print.");
    return;
  }

  const escapeHTML = (val) => {
    if (val === null || val === undefined) return "—";
    return String(val)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  const totalGrand = rows.reduce(
    (s, r) => s + (parseFloat(r.grand_total || r.amount || r.stock_value || 0) || 0),
    0
  );

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHTML(title)}</title>
        <style>
          @font-face {
            font-family: 'Inter';
            src: url('${window.location.origin}/assets/home/frontend/Inter.ttf') format('truetype');
            font-weight: 100 900;
            font-style: normal;
          }
          @page {
            size: landscape;
            margin: 12mm 10mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #1f2937;
            margin: 0;
            padding: 16px;
            font-size: 11px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #E00000;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }
          .brand { font-size: 20px; font-weight: 800; color: #E00000; letter-spacing: 0.5px; }
          .subtitle { font-size: 13px; font-weight: 700; color: #374151; margin-top: 2px; }
          .meta { font-size: 10px; color: #6b7280; text-align: right; }
          .meta-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            padding: 8px 12px;
            border-radius: 6px;
            margin-bottom: 12px;
            font-size: 10px;
          }
          .meta-item { display: flex; flex-direction: column; }
          .meta-item .label { font-weight: 600; color: #6b7280; text-transform: uppercase; font-size: 9px; }
          .meta-item .val { font-weight: 700; color: #111827; }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
          th {
            background-color: #f3f4f6;
            color: #374151;
            font-weight: 700;
            text-transform: uppercase;
            padding: 6px 8px;
            border: 1px solid #e5e7eb;
            font-size: 9px;
            letter-spacing: 0.5px;
          }
          td {
            padding: 5px 8px;
            border: 1px solid #e5e7eb;
            vertical-align: middle;
          }
          tbody tr:nth-child(even) { background-color: #fafafa; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
          .badge {
            display: inline-block;
            padding: 1px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 700;
          }
          .badge-paid { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
          .badge-cancelled { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
          .tfoot td {
            font-weight: 800;
            background: #f9fafb;
            border-top: 2px solid #E00000;
            padding: 8px;
            font-size: 11px;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">MH MONEY EXPRESS</div>
            <div class="subtitle">${escapeHTML(title)}</div>
          </div>
          <div class="meta">
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
            <div><strong>Total Records:</strong> ${rows.length}</div>
          </div>
        </div>

        ${Object.keys(metadata).length > 0
      ? `
          <div class="meta-grid">
            ${Object.entries(metadata)
        .map(
          ([k, v]) => `
              <div class="meta-item">
                <span class="label">${escapeHTML(k)}</span>
                <span class="val">${escapeHTML(v)}</span>
              </div>
            `
        )
        .join("")}
          </div>
        `
      : ""
    }

        <table>
          <thead>
            <tr>
              <th style="width: 30px;" class="text-center">#</th>
              ${headers
      .map(
        (h) =>
          `<th class="${h.align === "right" ? "text-right" : "text-left"}">${escapeHTML(
            typeof h === "object" ? h.label : h
          )}</th>`
      )
      .join("")}
            </tr>
          </thead>
          <tbody>
            ${rows
      .map(
        (row, idx) => `
              <tr>
                <td class="text-center font-mono">${idx + 1}</td>
                ${headers
            .map((h) => {
              const key = typeof h === "object" ? (h.key || h.fieldname) : h;
              const accessor = typeof h === "object" ? h.accessor : null;
              let val = accessor ? accessor(row) : row[key];
              const align = h.align === "right" ? "text-right" : "";
              const isStatus = key === "status";
              if (isStatus) {
                const badgeCls =
                  String(val).toLowerCase() === "paid"
                    ? "badge-paid"
                    : "badge-cancelled";
                return `<td><span class="badge ${badgeCls}">${escapeHTML(val)}</span></td>`;
              }
              if (h.align === "right" && val != null && !isNaN(parseFloat(val))) {
                val = parseFloat(val).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
              }
              return `<td class="${align}">${escapeHTML(val)}</td>`;
            })
            .join("")}
              </tr>
            `
      )
      .join("")}
          </tbody>
          ${totalGrand > 0
      ? `
            <tfoot class="tfoot">
              <tr>
                <td colspan="${Math.max(
        1,
        headers.findIndex(
          (h) =>
            (h.key || h) === "grand_total" ||
            (h.key || h) === "amount" ||
            (h.key || h) === "stock_value"
        ) + 1
      )}" style="text-align: right; text-transform: uppercase; color: #E00000;">
                  Total Amount:
                </td>
                <td class="text-right" style="color: #111827;">
                  ${totalGrand.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
                </td>
                <td colspan="${headers.length -
      (headers.findIndex(
        (h) =>
          (h.key || h) === "grand_total" ||
          (h.key || h) === "amount" ||
          (h.key || h) === "stock_value"
      ) + 1)
      }"></td>
              </tr>
            </tfoot>
          `
      : ""
    }
        </table>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// ── Date Range Helper ───────────────────────────────────────────────────────
function getDateBounds(preset, customFrom = "", customTo = "", selectedMonth = "") {
  const pad = (n) => String(n).padStart(2, "0");
  const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const today = new Date();
  const todayStr = toYMD(today);

  if (preset === "this_week") {
    // Current week: Monday to Sunday
    const day = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.getFullYear(), today.getMonth(), diffToMonday);
    const sunday = new Date(today.getFullYear(), today.getMonth(), diffToMonday + 6);
    return {
      fromDate: toYMD(monday),
      toDate: toYMD(sunday),
      label: `This Week (${toYMD(monday)} to ${toYMD(sunday)})`,
    };
  }

  if (preset === "weekly") {
    // Last 7 days: 7 days ago to today
    const past7 = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
    return {
      fromDate: toYMD(past7),
      toDate: todayStr,
      label: `Weekly (${toYMD(past7)} to ${todayStr})`,
    };
  }

  if (preset === "monthly") {
    // Specified month in YYYY-MM format, or fallback to current month
    const target = selectedMonth || `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;
    const [y, m] = target.split("-").map(Number);
    if (y && m) {
      const firstDay = new Date(y, m - 1, 1);
      const lastDay = new Date(y, m, 0);
      const monthName = firstDay.toLocaleString("default", { month: "long" });
      return {
        fromDate: toYMD(firstDay),
        toDate: toYMD(lastDay),
        label: `${monthName} ${y} (${toYMD(firstDay)} to ${toYMD(lastDay)})`,
      };
    }
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      fromDate: toYMD(firstDay),
      toDate: todayStr,
      label: `Monthly (${toYMD(firstDay)} to ${todayStr})`,
    };
  }

  if (preset === "custom") {
    const from = customFrom || (customTo ? "" : todayStr);
    const to = customTo || (customFrom ? "" : todayStr);
    return {
      fromDate: from,
      toDate: to,
      label:
        from && to
          ? from === to
            ? `Today (${from})`
            : `${from} to ${to}`
          : from
            ? `From ${from}`
            : to
              ? `Up to ${to}`
              : `Today (${todayStr})`,
    };
  }

  return { fromDate: "", toDate: "", label: "All Time" };
}

// ── Export Dropdown Component ───────────────────────────────────────────────
function ExportDropdown({ onExportCSV, onExportExcel, onExportPDF, disabled }) {
  const [open, setOpen] = useState(false);
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

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-xs ${disabled
          ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"
          : "border-gray-200 bg-white text-gray-700 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50 cursor-pointer"
          }`}
        title="Export Report"
      >
        <Download size={14} />
        <span>Export</span>
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden py-1 divide-y divide-gray-100 animate-in fade-in duration-100">
          <div className="px-3.5 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50">
            Export Format
          </div>
          <div className="py-1">
            <button
              onClick={() => {
                setOpen(false);
                onExportCSV();
              }}
              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-red-50 hover:text-[#E00000] flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <FileText size={15} className="text-gray-400" />
              <div>
                <div className="font-bold">Export as CSV</div>
                <div className="text-[10px] text-gray-400 font-normal">Comma-separated (.csv)</div>
              </div>
            </button>

            <button
              onClick={() => {
                setOpen(false);
                onExportExcel();
              }}
              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet size={15} className="text-emerald-600" />
              <div>
                <div className="font-bold">Export as Excel</div>
                <div className="text-[10px] text-gray-400 font-normal">Excel Workbook (.xls)</div>
              </div>
            </button>

            <button
              onClick={() => {
                setOpen(false);
                onExportPDF();
              }}
              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Printer size={15} className="text-blue-600" />
              <div>
                <div className="font-bold">Export as PDF / Print</div>
                <div className="text-[10px] text-gray-400 font-normal">Formatted print / PDF document</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reusable Pagination Component ───────────────────────────────────────────
function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}) {
  if (totalRecords === 0) return null;

  const isAll = pageSize === "all" || pageSize === "All";
  const numericPageSize = isAll ? totalRecords : Number(pageSize);
  const startRecord = isAll ? 1 : Math.min((currentPage - 1) * numericPageSize + 1, totalRecords);
  const endRecord = isAll ? totalRecords : Math.min(currentPage * numericPageSize, totalRecords);

  const getPageNumbers = () => {
    if (totalPages <= 1) return [];
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between flex-wrap gap-4 py-3 px-4 bg-white border border-gray-200 rounded-2xl shadow-xs text-xs">
      <div className="flex items-center gap-3">
        <span className="text-gray-500 font-medium">
          Showing <span className="font-bold text-gray-800">{startRecord}</span> to{" "}
          <span className="font-bold text-gray-800">{endRecord}</span> of{" "}
          <span className="font-bold text-[#E00000]">{totalRecords}</span> records
        </span>

        <div className="flex items-center gap-1.5 ml-2 border-l border-gray-200 pl-3">
          <span className="text-gray-400">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const val = e.target.value;
              onPageSizeChange(val === "all" || val === "All" ? val : Number(val));
            }}
            className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold bg-gray-50 text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#E00000]"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "all" || opt === "All" ? "All" : opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* First page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="First Page"
          >
            <ChevronsLeft size={14} />
          </button>
          {/* Prev page */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Previous Page"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Page pills */}
          <div className="flex items-center gap-1 mx-1">
            {getPageNumbers().map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`ell-${idx}`} className="px-1.5 text-gray-400 font-bold select-none">
                    …
                  </span>
                );
              }
              const isCurrent = p === currentPage;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`min-w-[28px] h-7 px-2 rounded-lg font-bold transition-all text-xs cursor-pointer ${isCurrent
                    ? "bg-[#E00000] text-white shadow-xs"
                    : "border border-gray-200 bg-white text-gray-700 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50/50"
                    }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next page */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Next Page"
          >
            <ChevronRight size={14} />
          </button>
          {/* Last page */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Last Page"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
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
    Cancelled: "bg-red-50 text-red-700 border-red-200",
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
      <td className="px-5 py-3.5 text-body font-semibold text-gray-700">{label}</td>
      <td className="px-5 py-3.5 text-right">
        <span className={`tnum font-bold text-btn-lg ${highlight ? "text-[#E00000]" : "text-gray-900"}`}>
          {value ?? "—"}
        </span>
      </td>
      {sub !== undefined && (
        <td className="px-5 py-3.5 text-right text-caption text-gray-400">{sub}</td>
      )}
    </tr>
  );
}

// ── Report Loader ──────────────────────────────────────────────────────────
function ReportLoader({ label = "Loading report records…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#E00000]/20 animate-ping absolute" />
        <div className="w-10 h-10 rounded-full border-3 border-gray-200 border-t-[#E00000] animate-spin" />
      </div>
      <p className="mt-4 text-sm font-semibold text-gray-700 animate-pulse">{label}</p>
      <p className="text-xs text-gray-400 mt-1">Please wait while report data is being fetched…</p>
    </div>
  );
}

function CashCounterReportTab({ warehouse, warehouses = [] }) {
  const assignedLocations = useMemo(
    () => warehouses.filter(row => row?.warehouse && row.warehouse_type !== "Vault"),
    [warehouses]
  );
  const [allBranchLocations, setAllBranchLocations] = useState([]);
  const locations = allBranchLocations.length ? allBranchLocations : assignedLocations;
  const [reportWarehouse, setReportWarehouse] = useState(warehouse?.warehouse || "");
  const location = reportWarehouse || warehouse?.warehouse;
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [expandedCurrencies, setExpandedCurrencies] = useState({});
  const [summary, setSummary] = useState(null);
  const countDetailRef = useRef(null);

  useEffect(() => {
    if (!selected) return;
    const frame = window.requestAnimationFrame(() => countDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [selected?.name]);

  useEffect(() => {
    let live = true;
    axios.get("/api/method/moneygram.moneygram.api.get_transactions.get_warehouses_list")
      .then(response => {
        if (!live) return;
        const rows = response.data?.message || [];
        const normalized = rows
          .filter(row => !row?.is_group && !row?.custom_is_vault && row?.warehouse_type !== "Vault")
          .map(row => ({ ...row, warehouse: row.warehouse || row.name || row.warehouse_name }))
          .filter(row => row.warehouse);
        setAllBranchLocations(normalized);
      })
      .catch(() => { if (live) setAllBranchLocations([]); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!reportWarehouse || (reportWarehouse !== "All Locations" && !locations.some(row => row.warehouse === reportWarehouse))) {
      setReportWarehouse(warehouse?.warehouse || locations[0]?.warehouse || "");
    }
  }, [warehouse?.warehouse, locations, reportWarehouse]);

  const load = useCallback(async (append = false, start = 0) => {
    if (!location) { setEntries([]); setLoading(false); return; }
    if (append) setBusy(true); else setLoading(true);
    setError("");
    try {
      const result = await customPos.getReportEntries(location, {
        search: appliedSearch,
        status: statusFilter,
        entry_type: typeFilter === "all" ? "" : `${typeFilter[0].toUpperCase()}${typeFilter.slice(1)}`,
        start,
        page_length: 20,
      });
      const rows = result?.entries || [];
      // An incident approval is stored as Approved plus the manager decision.
      // Present it explicitly in the report list instead of hiding it as a normal approval.
      const displayRows = rows.map(entry => ({ ...entry, status: entry.manager_decision === "Approve With Incident" ? "Approved with Incident" : entry.status }));
      setEntries(current => append ? [...current, ...displayRows] : displayRows);
      setTotalRecords(Number(result?.total || 0));
      setHasMore(Boolean(result?.has_more));
      if (result?.summary) {
        setSummary(result.summary);
      }
    }
    catch (cause) { setError(cause.message); }
    finally { setLoading(false); setBusy(false); }
  }, [location, appliedSearch, statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const filteredEntries = entries;
  const allCount = summary?.all ?? totalRecords;
  const openingCount = summary?.opening ?? entries.filter(entry => String(entry.entry_type || "").toLowerCase() === "opening").length;
  const closingCount = summary?.closing ?? entries.filter(entry => String(entry.entry_type || "").toLowerCase() === "closing").length;
  const pendingCount = summary?.pending ?? entries.filter(entry => entry.status === "Pending Approval").length;

  const isPendingActive = statusFilter === "Pending Approval";
  const isOpeningActive = typeFilter === "opening" && !isPendingActive;
  const isClosingActive = typeFilter === "closing" && !isPendingActive;
  const isAllActive = typeFilter === "all" && statusFilter === "All";

  const handleCardClick = (type, status = "All") => {
    if (type === "all" && status === "All") {
      setTypeFilter("all");
      setStatusFilter("All");
    } else if (status === "Pending Approval") {
      if (isPendingActive) {
        setStatusFilter("All");
        setTypeFilter("all");
      } else {
        setStatusFilter("Pending Approval");
        setTypeFilter("all");
      }
    } else if (type === "opening") {
      if (isOpeningActive) {
        setTypeFilter("all");
        setStatusFilter("All");
      } else {
        setTypeFilter("opening");
        setStatusFilter("All");
      }
    } else if (type === "closing") {
      if (isClosingActive) {
        setTypeFilter("all");
        setStatusFilter("All");
      } else {
        setTypeFilter("closing");
        setStatusFilter("All");
      }
    }
  };
  const statusStyle = status => status === "Pending Approval" ? "border-amber-200 bg-amber-50 text-amber-800" : status === "Approved with Incident" ? "border-orange-200 bg-orange-50 text-orange-800" : status === "Approved" || status === "Warning" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : status === "Rejected" ? "border-red-200 bg-red-50 text-red-700" : "border-gray-200 bg-gray-50 text-gray-700";
  const denominationHeaders = [{ label: "Currency", key: "currency" }, { label: "Denomination", key: "denomination" }, { label: "Expected quantity", key: "expected_qty" }, { label: "Counted quantity", key: "counted_qty" }, { label: "Difference", key: "difference" }];
  const denominationRows = (selected?.counts || []).map(count => ({ ...count, difference: Number(count.counted_qty || 0) - Number(count.expected_qty || 0) }));
  const varianceNotes = (selected?.currency_summary || []).filter(item => Number(item.variance || 0) !== 0).map(item => {
    const variance = Number(item.variance || 0);
    const country = item.country || CASH_COUNTER_COUNTRY[item.currency] || item.currency;
    return { currency: item.currency, country, variance, direction: variance < 0 ? "Short" : "Over" };
  });
  const exportFileName = selected ? `Cash_Counter_${String(selected.entry_type || "count")}_${selected.name}`.replace(/[^a-z0-9_-]/gi, "_") : "Cash_Counter_Record";
  const exportMetadata = selected ? { Location: selected.warehouse || location, "Record ID": selected.name, "Register type": registerLabel(selected.entry_type), Status: selected.status, Teller: selected.submitted_by || "—", Submitted: selected.submitted_at || "—" } : {};
  const toggleCurrency = currency => setExpandedCurrencies(current => ({ ...current, [currency]: !current[currency] }));
  const exportCSV = () => downloadCSV(exportFileName, denominationHeaders, denominationRows);
  const exportExcel = () => downloadExcel(exportFileName, denominationHeaders, denominationRows, registerLabel(selected?.entry_type));
  const exportPDF = () => exportToPDF(registerLabel(selected?.entry_type), denominationHeaders, denominationRows, exportMetadata);
  const formatSubmittedAt = value => {
    if (!value) return "—";
    const normalized = String(value).replace("T", " ");
    const [date, time = ""] = normalized.split(" ");
    return `${date} ${time.slice(0, 5)}`.trim();
  };

  const decide = async decision => {
    if (!selected || !remarks.trim()) { setError("Enter manager remarks before making a decision."); return; }
    setBusy(true); setError("");
    try {
      await customPos.reviewEntry(selected.name, decision, remarks.trim());
      setSelected(null); setRemarks(""); setExpandedCurrencies({}); await load();
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  };

  if (!location) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">Select an active location to view Cash Counter reports.</div>;
  if (loading) return <ReportLoader label="Loading Cash Counter records…" />;

  return <div className="space-y-5">
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-overline font-semibold uppercase tracking-wider text-[#E00000]">Manager-only report</p>
          <h2 className="mt-1 text-xl font-bold text-gray-900">Cash Counter records</h2>
          <p className="mt-1 text-caption text-gray-500">Open and close register history for <b className="text-gray-700">{location}</b>.</p>
        </div>
        <button onClick={load} disabled={loading || busy} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-label font-semibold text-gray-700 hover:border-[#E00000] hover:text-[#E00000] disabled:opacity-50 cursor-pointer">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => handleCardClick("all", "All")}
          className={`group rounded-xl px-3.5 py-3 text-left transition-all duration-150 cursor-pointer border ${
            isAllActive
              ? "border-[#E00000] bg-white ring-2 ring-[#E00000]/20 shadow-xs"
              : "border-gray-200/80 bg-gray-50 hover:bg-gray-100/80 hover:border-gray-300"
          }`}
          title="Filter by all records"
        >
          <div className="flex items-center justify-between gap-1">
            <p className="text-overline font-semibold uppercase tracking-wider text-gray-500">All records</p>
            {isAllActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E00000] px-1.5 py-0.5 text-[10px] font-bold text-white">
                <Check size={10} strokeWidth={3} /> Active
              </span>
            )}
          </div>
          <p className="mt-1 text-xl font-bold tnum text-gray-900">{allCount}</p>
        </button>

        <button
          type="button"
          onClick={() => handleCardClick("opening", "All")}
          className={`group rounded-xl px-3.5 py-3 text-left transition-all duration-150 cursor-pointer border ${
            isOpeningActive
              ? "border-[#E00000] bg-blue-50/80 ring-2 ring-[#E00000]/20 shadow-xs"
              : "border-blue-200/60 bg-blue-50 hover:bg-blue-100/60 hover:border-blue-300"
          }`}
          title="Filter by Open Register records"
        >
          <div className="flex items-center justify-between gap-1">
            <p className="text-overline font-semibold uppercase tracking-wider text-blue-600">Open registers</p>
            {isOpeningActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E00000] px-1.5 py-0.5 text-[10px] font-bold text-white">
                <Check size={10} strokeWidth={3} /> Active
              </span>
            )}
          </div>
          <p className="mt-1 text-xl font-bold tnum text-blue-900">{openingCount}</p>
        </button>

        <button
          type="button"
          onClick={() => handleCardClick("closing", "All")}
          className={`group rounded-xl px-3.5 py-3 text-left transition-all duration-150 cursor-pointer border ${
            isClosingActive
              ? "border-[#E00000] bg-violet-50/80 ring-2 ring-[#E00000]/20 shadow-xs"
              : "border-violet-200/60 bg-violet-50 hover:bg-violet-100/60 hover:border-violet-300"
          }`}
          title="Filter by Close Register records"
        >
          <div className="flex items-center justify-between gap-1">
            <p className="text-overline font-semibold uppercase tracking-wider text-violet-600">Close registers</p>
            {isClosingActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E00000] px-1.5 py-0.5 text-[10px] font-bold text-white">
                <Check size={10} strokeWidth={3} /> Active
              </span>
            )}
          </div>
          <p className="mt-1 text-xl font-bold tnum text-violet-900">{closingCount}</p>
        </button>

        <button
          type="button"
          onClick={() => handleCardClick("all", "Pending Approval")}
          className={`group rounded-xl px-3.5 py-3 text-left transition-all duration-150 cursor-pointer border ${
            isPendingActive
              ? `${pendingCount ? "bg-amber-50/90" : "bg-emerald-50/90"} border-[#E00000] ring-2 ring-[#E00000]/20 shadow-xs`
              : pendingCount
                ? "border-amber-200/60 bg-amber-50 hover:bg-amber-100/60 hover:border-amber-300"
                : "border-emerald-200/60 bg-emerald-50 hover:bg-emerald-100/60 hover:border-emerald-300"
          }`}
          title="Filter by pending approval records"
        >
          <div className="flex items-center justify-between gap-1">
            <p className={`text-overline font-semibold uppercase tracking-wider ${pendingCount ? "text-amber-700" : "text-emerald-700"}`}>
              Pending approval
            </p>
            {isPendingActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E00000] px-1.5 py-0.5 text-[10px] font-bold text-white">
                <Check size={10} strokeWidth={3} /> Active
              </span>
            )}
          </div>
          <p className={`mt-1 text-xl font-bold tnum ${pendingCount ? "text-amber-900" : "text-emerald-900"}`}>{pendingCount}</p>
        </button>
      </div>
    </section>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-label font-semibold text-danger">{error}</div>}
    <form onSubmit={event => { event.preventDefault(); setAppliedSearch(search.trim()); }} className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <label className="min-w-[16rem] text-overline font-semibold uppercase tracking-wider text-gray-500">
        Location
        <select value={location || ""} onChange={event => { setReportWarehouse(event.target.value); setSelected(null); setRemarks(""); setExpandedCurrencies({}); }} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-body font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#E00000] focus:ring-2 focus:ring-red-100">
          <option value="All Locations">All Locations</option>
          {locations.map(row => <option key={row.warehouse} value={row.warehouse}>{row.warehouse}</option>)}
        </select>
      </label>
      <label className="min-w-[15rem] flex-1 text-overline font-semibold uppercase tracking-wider text-gray-500">
        Record ID
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search count record ID" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-body font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#E00000] focus:ring-2 focus:ring-red-100" />
      </label>
      <label className="w-48 text-overline font-semibold uppercase tracking-wider text-gray-500">
        Status
        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-body font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#E00000] focus:ring-2 focus:ring-red-100">
          <option value="All">All statuses</option>
          <option value="Pending Approval">Pending approval</option>
          <option value="Approved">Approved</option>
          <option value="Approved with Incident">Approved with incident</option>
          <option value="Warning">Warning</option>
          <option value="Rejected">Rejected</option>
        </select>
      </label>
      <button type="submit" className="rounded-xl bg-[#E00000] px-4 py-2.5 text-btn-lg font-semibold text-white hover:bg-[#B70000] cursor-pointer">Search</button>
      <button type="button" onClick={() => { setSearch(""); setAppliedSearch(""); setStatusFilter("All"); setTypeFilter("all"); }} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-btn-lg font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">Clear</button>
      <span className="ml-auto pb-2 text-caption font-semibold text-gray-500">Showing {entries.length} of {totalRecords} records</span>
    </form>
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {[["all", "All"], ["opening", "Open Register"], ["closing", "Close Register"]].map(([value, label]) => {
            const isActive = value === "all" ? isAllActive : (typeFilter === value && !isPendingActive);
            return (
              <button
                key={value}
                onClick={() => {
                  setTypeFilter(value);
                  if (statusFilter === "Pending Approval" || value === "all") {
                    setStatusFilter("All");
                  }
                }}
                className={`rounded-lg px-3 py-1.5 text-label font-semibold transition-colors cursor-pointer ${
                  isActive ? "bg-[#E00000] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <p className="text-caption font-semibold text-gray-500">
          {filteredEntries.length} record{filteredEntries.length === 1 ? "" : "s"}
        </p>
      </div>
      {!entries.length ? (
        <div className="p-10 text-center text-sm text-gray-500">
          No open or close register records exist for this location.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-gray-50 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="w-12 px-3 py-3 text-center"></th>
                <th className="px-5 py-3">Record</th>
                <th className="px-5 py-3">Register type</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Teller</th>
                <th className="px-5 py-3">Submitted</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => {
                const isSelected = selected?.name === entry.name;
                return (
                  <tr
                    key={entry.name}
                    onClick={() => { setSelected(isSelected ? null : entry); setRemarks(""); setExpandedCurrencies({}); }}
                    className={`cursor-pointer border-t border-gray-100 transition-colors ${isSelected ? "bg-red-50 font-medium" : "hover:bg-gray-50"
                      }`}
                  >
                    <td
                      className="w-12 px-3 py-3.5 text-center cursor-pointer"
                      onClick={event => { event.stopPropagation(); setSelected(isSelected ? null : entry); setRemarks(""); setExpandedCurrencies({}); }}
                    >
                      {isSelected ? (
                        <div className="flex items-center justify-center">
                          <CheckCircle2 size={18} className="text-[#E00000]" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center border rounded-full border-gray size-[18px]">
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-bold text-gray-900">{entry.name}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-md px-2 py-1 text-caption font-semibold ${String(entry.entry_type).toLowerCase() === "opening"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-violet-50 text-violet-700"
                          }`}
                      >
                        {registerLabel(entry.entry_type)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-600">{entry.warehouse || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full border px-2.5 py-1 text-caption font-semibold ${statusStyle(entry.status)}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">{entry.submitted_by}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-500">{formatSubmittedAt(entry.submitted_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={event => { event.stopPropagation(); setSelected(isSelected ? null : entry); setRemarks(""); setExpandedCurrencies({}); }}
                        className="text-label font-semibold text-[#E00000] hover:underline cursor-pointer"
                      >
                        {isSelected ? "Hide details" : "View details"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
    {hasMore && (
      <div className="flex justify-center">
        <button
          type="button"
          disabled={busy}
          onClick={() => load(true, entries.length)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-btn-lg font-semibold text-gray-700 hover:border-[#E00000] hover:text-[#E00000] disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={15} className={busy ? "animate-spin" : ""} /> {busy ? "Loading…" : "Load more records"}
        </button>
      </div>
    )}
    {selected && (
      <section ref={countDetailRef} className="scroll-mt-24 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-5">
          <div>
            <p className="text-overline font-semibold uppercase tracking-wider text-[#E00000]">{registerLabel(selected.entry_type)} detail</p>
            <h3 className="mt-1 text-h2 font-bold text-gray-900">{selected.name}</h3>
            <p className="mt-1 text-caption text-gray-500">{selected.warehouse || "—"} · {selected.submitted_by} · {selected.submitted_at}</p>
          </div>
          <div className="flex items-center gap-2">
            <ExportDropdown onExportCSV={exportCSV} onExportExcel={exportExcel} onExportPDF={exportPDF} disabled={!denominationRows.length} />
            <span className={`rounded-full border px-3 py-1.5 text-caption font-semibold ${statusStyle(selected.status)}`}>{selected.status}</span>
          </div>
        </div>
        <div className="p-5">
          {varianceNotes.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-body text-amber-950">
              <p className="font-bold">Automatic reconciliation note</p>
              <p className="mt-1 text-caption text-amber-800">Calculated from the submitted count. This is separate from teller and manager remarks.</p>
              <ul className="mt-2 space-y-1.5">
                {varianceNotes.map(note => (
                  <li key={note.currency} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-lg bg-white/70 px-2.5 py-2">
                    <span className="font-semibold">{note.country} · {note.currency}</span>
                    <span className={`font-bold tnum ${note.variance < 0 ? "text-red-700" : "text-emerald-700"}`}>
                      {note.direction} by {note.currency} {Math.abs(note.variance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {selected.remarks && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-body text-gray-700">
              <b>Teller remarks:</b> {selected.remarks}
            </div>
          )}
          <div className="mt-5">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h4 className="text-h3 font-bold text-gray-900">Denomination reconciliation report</h4>
                <p className="mt-1 text-caption text-gray-500">Expand a currency row to review every denomination.</p>
              </div>
              <span className="text-caption text-gray-500">{(selected.currency_summary || []).length} currencies</span>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
              <div className="grid grid-cols-[minmax(12rem,1.5fr)_minmax(7rem,1fr)_minmax(7rem,1fr)_auto] gap-3 border-b border-slate-300 bg-slate-100 px-4 py-3 text-overline font-bold uppercase tracking-wider text-slate-700">
                <span>Country / currency</span>
                <span className="text-right">Counted total</span>
                <span className="text-right">Variance</span>
                <span>Detail</span>
              </div>
              <div className="divide-y divide-slate-200">
                {(selected.currency_summary || []).map(item => {
                  const currency = item.currency;
                  const country = item.country || CASH_COUNTER_COUNTRY[currency] || currency;
                  const currencyRows = denominationRows.filter(row => row.currency === currency);
                  const isExpanded = Boolean(expandedCurrencies[currency]);
                  const variance = Number(item.variance || 0);
                  return (
                    <div key={currency}>
                      <button
                        type="button"
                        onClick={() => toggleCurrency(currency)}
                        aria-expanded={isExpanded}
                        className={`grid w-full grid-cols-[minmax(12rem,1.5fr)_minmax(7rem,1fr)_minmax(7rem,1fr)_auto] items-center gap-3 border-l-4 px-4 py-3.5 text-left text-body transition-all cursor-pointer ${isExpanded ? "border-l-[#E00000] bg-gradient-to-r from-red-50 via-rose-50 to-white shadow-inner" : "border-l-transparent bg-white hover:bg-slate-50"}`}
                      >
                        <span>
                          <b className="font-bold text-slate-950">{country}</b>
                          <span className={`ml-2 rounded-md px-2 py-1 text-caption font-bold ${isExpanded ? "bg-[#E00000] text-white" : "bg-slate-200 text-slate-700"}`}>{currency}</span>
                        </span>
                        <span className="text-right font-bold tnum text-slate-950">
                          {currency} {Number(item.counted_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`text-right font-bold tnum ${variance < 0 ? "text-red-700" : variance > 0 ? "text-emerald-700" : "text-slate-600"}`}>
                          {variance > 0 ? "+" : ""}{currency} {variance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${isExpanded ? "bg-[#E00000] text-white" : "bg-slate-100 text-slate-500"}`}><ChevronDown size={16} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} /></span>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] text-body">
                              <thead className="bg-slate-200/70 text-left text-overline font-bold uppercase tracking-wider text-slate-700">
                                <tr>
                                  <th className="px-3 py-2">Country</th>
                                  <th className="px-3 py-2">Currency</th>
                                  <th className="px-3 py-2">Denomination</th>
                                  <th className="px-3 py-2 text-right">Expected qty</th>
                                  <th className="px-3 py-2 text-right">Counted qty</th>
                                  <th className="px-3 py-2 text-right">Difference</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {currencyRows.map((count, index) => {
                                  const difference = Number(count.difference || 0);
                                  return (
                                    <tr key={`${count.item_code}-${index}`} className={index % 2 ? "bg-white" : "bg-slate-50/70"}>
                                      <td className="px-3 py-2.5 font-medium text-slate-700">{country}</td>
                                      <td className="px-3 py-2.5 font-bold text-slate-950">{currency}</td>
                                      <td className="px-3 py-2.5 font-bold tnum text-slate-950">{currency} {count.denomination}</td>
                                      <td className="px-3 py-2.5 text-right font-bold tnum text-blue-700">{count.expected_qty}</td>
                                      <td className="px-3 py-2.5 text-right font-bold tnum text-slate-950">{count.counted_qty}</td>
                                      <td className={`px-3 py-2.5 text-right font-bold tnum ${difference < 0 ? "text-red-700" : difference > 0 ? "text-emerald-700" : "text-slate-600"}`}>
                                        {difference > 0 ? `+${difference}` : difference}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          {!currencyRows.length && <p className="py-2 text-caption text-gray-500">No denomination rows are available for this currency.</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {selected.status === "Pending Approval" && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <label className="block text-label font-semibold text-gray-800">
                Manager remarks <span className="text-[#E00000]">*</span>
              </label>
              <textarea
                value={remarks}
                onChange={event => setRemarks(event.target.value)}
                rows="3"
                placeholder="Required reason and decision remarks"
                className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-body font-normal outline-none focus:border-[#E00000] focus:ring-2 focus:ring-red-100"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  disabled={busy}
                  onClick={() => decide("approve")}
                  className="rounded-xl bg-emerald-700 px-4 py-2.5 text-btn-lg font-semibold text-white disabled:opacity-50 cursor-pointer"
                >
                  Approve
                </button>
                <button
                  disabled={busy}
                  onClick={() => decide("reject")}
                  className="rounded-xl border border-red-300 bg-white px-4 py-2.5 text-btn-lg font-semibold text-red-700 disabled:opacity-50 cursor-pointer"
                >
                  Recount required
                </button>
              </div>
            </div>
          )}
          {selected.manager_remarks && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-body text-emerald-900">
              <b>Manager decision:</b> {selected.manager_decision || "—"}<br />
              <b>Remarks:</b> {selected.manager_remarks}
            </div>
          )}
        </div>
      </section>
    )}
  </div>;
}

// ── Tab Button ─────────────────────────────────────────────────────────────
function TabButton({ label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-btn-lg font-semibold border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E00000] cursor-pointer
        ${active
          ? "bg-[#E00000] text-white border-[#E00000] shadow-md shadow-[#E00000]/20"
          : "bg-gray-50 text-gray-500 border-gray-200 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50"
        }`}
    >
      {label}
      {count != null && (
        <span className={`text-overline px-2 py-0.5 rounded-full font-semibold tnum
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
// ── Searchable Remote Autocomplete Customer Filter (Server-side Search) ───
function CustomerLinkFilter({ selectedCustomer, onSelect, loginUser }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedObj, setSelectedObj] = useState(null);
  const ref = useRef(null);
  const debounceRef = useRef(null);
  const masterListRef = useRef([]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Fetch customers from backend with limit (20) and search query
  const searchCustomers = useCallback(
    async (searchTerm = "") => {
      if (!loginUser?.user) return;
      setLoading(true);
      try {
        const res = await axios.get(
          "/api/method/moneygram.moneygram.api.get_transactions.get_customers_list",
          {
            params: {
              search: searchTerm.trim() || undefined,
              limit: 20,
              selected: selectedCustomer || undefined,
            },
            headers: {
            },
          }
        );
        const list = res.data?.message ?? [];
        if (Array.isArray(list)) {
          // If backend returned all records, cache as master list for instant client filtering
          if (!searchTerm && list.length > 20) {
            masterListRef.current = list;
          }
          setCustomers(list);
          if (selectedCustomer) {
            const match =
              list.find((c) => c.name === selectedCustomer) ||
              masterListRef.current.find((c) => c.name === selectedCustomer);
            if (match) setSelectedObj(match);
          }
        }
      } catch (err) {
        console.error("Error searching customers:", err);
      } finally {
        setLoading(false);
      }
    },
    [loginUser, selectedCustomer]
  );

  // Initial load
  useEffect(() => {
    searchCustomers("");
  }, [searchCustomers]);

  // Keep selectedObj in sync if selectedCustomer changes externally
  useEffect(() => {
    if (!selectedCustomer) {
      setSelectedObj(null);
    } else {
      const match =
        customers.find((c) => c.name === selectedCustomer) ||
        masterListRef.current.find((c) => c.name === selectedCustomer);
      if (match) {
        setSelectedObj(match);
      }
    }
  }, [selectedCustomer, customers]);

  // Debounced search when user types in the search input
  const handleQueryChange = (val) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchCustomers(val);
    }, 300);
  };

  // Only display 10 to 20 customers at once, matching the search query
  const visibleCustomers = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    const source = masterListRef.current.length > 0 ? masterListRef.current : customers;
    let list = source;
    if (q) {
      list = source.filter((c) => {
        const id = (c.name || "").toLowerCase();
        const name = (c.customer_name || "").toLowerCase();
        const fullName = (c.custom_full_name || "").toLowerCase();
        return id.includes(q) || name.includes(q) || fullName.includes(q);
      });
      if (list.length === 0 && customers.length > 0) {
        list = customers.filter((c) => {
          const id = (c.name || "").toLowerCase();
          const name = (c.customer_name || "").toLowerCase();
          const fullName = (c.custom_full_name || "").toLowerCase();
          return id.includes(q) || name.includes(q) || fullName.includes(q);
        });
      }
    }
    return list.slice(0, 20);
  }, [customers, query]);

  const displayName = selectedObj
    ? selectedObj.custom_full_name || selectedObj.customer_name
    : selectedCustomer;

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
              {selectedObj?.name && (
                <span className="text-[10px] text-gray-400 font-mono ml-1.5">({selectedObj.name})</span>
              )}
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
                setSelectedObj(null);
                setQuery("");
                searchCustomers("");
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
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search customer name or ID…"
              className="w-full bg-transparent text-xs text-gray-800 focus:outline-none placeholder-gray-400"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  searchCustomers("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
            <div
              onClick={() => {
                onSelect("");
                setSelectedObj(null);
                setOpen(false);
                setQuery("");
                searchCustomers("");
              }}
              className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors
                ${!selectedCustomer ? "bg-red-50 text-[#E00000] font-bold" : "hover:bg-gray-50 text-gray-700"}`}
            >
              <span>All Customers</span>
              {!selectedCustomer && <Check size={14} />}
            </div>

            {loading && visibleCustomers.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                <RefreshCw size={12} className="animate-spin text-gray-400" />
                <span>Searching customers…</span>
              </div>
            ) : visibleCustomers.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">No matching customers found</div>
            ) : (
              visibleCustomers.map((c) => {
                const isSelected = selectedCustomer === c.name;
                const name = c.custom_full_name || c.customer_name;
                return (
                  <div
                    key={c.name}
                    onClick={() => {
                      onSelect(c.name);
                      setSelectedObj(c);
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
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [countsByType, setCountsByType] = useState({
    All: 0,
    "Currency Exchange": 0,
    "Dealer Exchange": 0,
    "Money Transfer": 0,
  });
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("Currency Exchange"); // Default to Currency Exchange
  const [selectedStatus, setSelectedStatus] = useState("All"); // "All" | "Paid" | "Cancelled"
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const isInitialLoad = useRef(true);

  // Resolve active branch location from prop or localStorage
  const getActiveLocationName = useCallback(() => {
    if (warehouse?.warehouse) return warehouse.warehouse;
    if (warehouse?.name) return warehouse.name;
    if (typeof warehouse === "string" && warehouse) return warehouse;
    try {
      const stored = localStorage.getItem("selected_warehouse");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.warehouse || parsed?.name || (typeof parsed === "string" ? parsed : "") || "";
      }
    } catch {
      // fallback
    }
    return "";
  }, [warehouse]);

  const userManuallyChangedWarehouse = useRef(false);
  const isVaultLocation = useCallback((locName) => {
    if (!locName || typeof locName !== "string") return false;
    const lower = locName.toLowerCase().trim();
    return lower.endsWith(" vault") || lower.includes("vault");
  }, []);

  const { warehouses: settingsWarehouses } = useSettings();

  // Extract all warehouse names assigned to the logged-in user
  const userAssignedWarehouseNames = useMemo(() => {
    const list = [];
    const seen = new Set();

    const add = (val) => {
      if (!val) return;
      let name = "";
      if (typeof val === "string") {
        name = val.trim();
      } else if (typeof val === "object") {
        name = (val.warehouse || val.warehouse_name || val.name || "").trim();
      }
      if (name && !isVaultLocation(name) && !seen.has(name)) {
        seen.add(name);
        list.push(name);
      }
    };

    if (Array.isArray(loginUser?.user?.warehouses)) {
      loginUser.user.warehouses.forEach(add);
    }
    if (Array.isArray(loginUser?.user?.warehouse)) {
      loginUser.user.warehouse.forEach(add);
    } else if (loginUser?.user?.warehouse) {
      add(loginUser.user.warehouse);
    }
    if (Array.isArray(settingsWarehouses)) {
      settingsWarehouses.forEach(add);
    }
    if (warehouse) {
      add(warehouse);
    }

    return list;
  }, [loginUser?.user, settingsWarehouses, warehouse, isVaultLocation]);

  const [selectedWarehouse, setSelectedWarehouse] = useState(() => {
    const activeLoc = getActiveLocationName();
    if (activeLoc && !isVaultLocation(activeLoc)) {
      if (userAssignedWarehouseNames.length === 0 || userAssignedWarehouseNames.includes(activeLoc)) {
        return activeLoc;
      }
    }
    if (userAssignedWarehouseNames.length > 0) {
      return userAssignedWarehouseNames[0];
    }
    return "All";
  });

  // Keep selectedWarehouse in sync with active location if user has not manually changed branch selection
  useEffect(() => {
    if (!userManuallyChangedWarehouse.current) {
      const activeLoc = getActiveLocationName();
      if (activeLoc && !isVaultLocation(activeLoc)) {
        if (userAssignedWarehouseNames.length === 0 || userAssignedWarehouseNames.includes(activeLoc)) {
          setSelectedWarehouse(activeLoc);
          return;
        }
      }
      if (userAssignedWarehouseNames.length > 0) {
        setSelectedWarehouse(userAssignedWarehouseNames[0]);
      } else {
        setSelectedWarehouse("All");
      }
    }
  }, [warehouse, getActiveLocationName, isVaultLocation, userAssignedWarehouseNames, selectedWarehouse]);

  const [warehousesList, setWarehousesList] = useState([]);

  // Show every non-vault branch returned by the server.
  const displayedWarehouses = warehousesList;
  const [cancellingRowId, setCancellingRowId] = useState(null);
  const [printingRowId, setPrintingRowId] = useState(null);

  const getTodayStr = useCallback(() => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  const [dateFilter, setDateFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  });
  const [customFromDate, setCustomFromDate] = useState(getTodayStr);
  const [customToDate, setCustomToDate] = useState(getTodayStr);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load warehouses list (only is_group=0 and custom_is_vault=0)
  useEffect(() => {
    if (!loginUser?.user) return;
    axios
      .get("/api/method/moneygram.moneygram.api.get_transactions.get_warehouses_list", {
        headers: {
        },
      })
      .then((res) => {
        const rawList = res.data?.message ?? [];
        const filtered = rawList.filter((wh) => {
          if (wh.is_group) return false;
          if (wh.custom_is_vault) return false;
          if (wh.warehouse_type === "Vault") return false;
          const name = String(wh.name || wh.warehouse_name || "").toLowerCase().trim();
          if (name.endsWith(" vault") || name.includes("vault")) return false;
          return true;
        });
        setWarehousesList(filtered);
      })
      .catch((err) => {
        console.error("Error fetching warehouses list:", err);
      });
  }, [loginUser]);

  // Log logged-in user's warehouse information in TransactionsTab
  useEffect(() => {
    if (!loginUser?.user) return;
    console.log(
      "[TransactionsTab] Logged-in user's 'warehouse':",
      loginUser.user.warehouse,
      "| 'warehouses' (multiple):",
      loginUser.user.warehouses
    );
  }, [loginUser?.user]);

  // Fetch unified transactions page by page directly from backend
  const fetchData = useCallback(async () => {
    if (!loginUser?.user) return;
    setLoading(true);
    try {
      const { fromDate, toDate } = getDateBounds(dateFilter, customFromDate, customToDate, selectedMonth);
      const limitStart = (currentPage - 1) * pageSize;

      const res = await axios.post(
        "/api/method/moneygram.moneygram.api.get_transactions.get_all_transactions",
        {
          warehouse: selectedWarehouse === "All" ? undefined : selectedWarehouse,
          party: selectedCustomer || undefined,
          transaction_type: selectedType === "All" ? undefined : selectedType,
          status: selectedStatus === "All" ? undefined : selectedStatus,
          search: search.trim() || undefined,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          limit_start: limitStart,
          limit_page_length: pageSize,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const msg = res.data?.message;
      const loadedRecords = msg?.data ?? [];
      if (isInitialLoad.current) {
        console.log("Initial Transaction Records loaded in Reports:", loadedRecords);
        isInitialLoad.current = false;
      } else {
        console.log("Transaction Records loaded:", loadedRecords);
      }
      setRows(loadedRecords);
      setTotalRecords(msg?.total_count ?? 0);
      setTotalAmount(msg?.total_amount ?? 0);
      if (msg?.counts_by_type) {
        setCountsByType(msg.counts_by_type);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [
    loginUser,
    selectedWarehouse,
    selectedType,
    selectedCustomer,
    selectedStatus,
    search,
    dateFilter,
    customFromDate,
    customToDate,
    selectedMonth,
    currentPage,
    pageSize,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset pagination to page 1 on any filter criteria changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    selectedType,
    selectedStatus,
    selectedCustomer,
    selectedWarehouse,
    dateFilter,
    customFromDate,
    customToDate,
    selectedMonth,
    pageSize,
  ]);

  // Cancellation handling
  const handleCancelRow = async (row) => {
    if (!window.confirm(`Are you sure you want to cancel ${row.type || "transaction"} ${row.name}?`)) {
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
                "Content-Type": "application/json",
              },
            }
          );
        }
      }

      alert(`${row.type || "Transaction"} has been successfully cancelled.`);
      fetchData();
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
              },
            }
          );
          printThermalReceipt(response.data?.data);
        } catch (siErr) {
          printThermalReceipt({
            name: row.name,
            posting_date: row.posting_date,
            custom_customer_full_name: row.custom_customer_full_name || row.party,
            grand_total: row.grand_total,
            currency: row.currency || "FJD",
            docstatus: row.docstatus,
            company: row.company || "MH MONEY EXPRESS",
            set_warehouse: row.set_warehouse,
            conversion_rate: row.conversion_rate,
            exchange_rate: row.exchange_rate,
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

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const pageGrand = rows.reduce((s, r) => s + (parseFloat(r.grand_total) || 0), 0);

  // Helper to extract and format Date + Timestamp for table display and exports
  const extractDateTime = (r) => {
    if (!r) return { date: "—", time: "", full: "—" };
    const rawDate = r.posting_date || "";
    const rawTime = r.posting_time || "";
    const dt = r.posting_datetime || r.creation || "";

    let datePart = "";
    let timePart = "";

    // 1. If explicit time field provided
    if (rawTime) {
      timePart = String(rawTime).split(".")[0];
    }

    // 2. Check rawDate if it has time attached (e.g. "2026-09-30 14:32:05")
    if (rawDate && (String(rawDate).includes(" ") || String(rawDate).includes("T"))) {
      const parts = String(rawDate).split(/[\sT]/);
      datePart = parts[0];
      if (!timePart && parts[1]) {
        timePart = parts[1].split(".")[0];
      }
    } else if (rawDate) {
      datePart = String(rawDate).split(".")[0];
    }

    // 3. Check dt (posting_datetime or creation)
    if (dt && (String(dt).includes(" ") || String(dt).includes("T"))) {
      const parts = String(dt).split(/[\sT]/);
      if (!datePart) datePart = parts[0];
      if (!timePart && parts[1]) {
        timePart = parts[1].split(".")[0];
      }
    } else if (dt && !datePart) {
      datePart = String(dt).split(".")[0];
    }

    datePart = datePart || "—";
    const full = timePart ? `${datePart} ${timePart}` : datePart;
    return { date: datePart, time: timePart, full };
  };

  const formatTransactionDateTime = (r) => extractDateTime(r).full;

  // Common Headers for Exports
  const exportHeaders = [
    { label: "Reference ID", key: "name" },
    { label: "Type", accessor: transactionTypeLabel, key: "type" },
    { label: "Date & Time", accessor: (r) => formatTransactionDateTime(r), key: "posting_datetime" },
    { label: "OET / Txn ID", key: "oet_code" },
    { label: "Customer", accessor: (r) => r.custom_customer_full_name || r.party || "" },
    { label: "Customer ID", key: "party" },
    { label: "Amount", key: "grand_total", align: "right" },
    { label: "Currency", key: "currency" },
    { label: "Currency pair", accessor: currencyPair, key: "currency_pair" },
    { label: "Status", key: "status" },
    { label: "Branch Location", key: "set_warehouse" },
    { label: "Created By", key: "owner" },
    { label: "Company", key: "company" },
  ];

  // Fetch full filtered records across all pages when user requests export
  const fetchAllForExport = async () => {
    try {
      const { fromDate, toDate } = getDateBounds(dateFilter, customFromDate, customToDate, selectedMonth);
      const res = await axios.post(
        "/api/method/moneygram.moneygram.api.get_transactions.get_all_transactions",
        {
          warehouse: selectedWarehouse === "All" ? undefined : selectedWarehouse,
          party: selectedCustomer || undefined,
          transaction_type: selectedType === "All" ? undefined : selectedType,
          status: selectedStatus === "All" ? undefined : selectedStatus,
          search: search.trim() || undefined,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          limit_start: 0,
          limit_page_length: 5000,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return res.data?.message?.data ?? rows;
    } catch (err) {
      console.error("Error fetching full dataset for export:", err);
      return rows;
    }
  };

  // CSV Export
  const handleExportCSV = async () => {
    const dataToExport = await fetchAllForExport();
    if (!dataToExport || dataToExport.length === 0) return;
    const safeDate = new Date().toISOString().slice(0, 10);
    const typeLabel = selectedType.replace(/\s+/g, "_");
    downloadCSV(`Transactions_Report_${typeLabel}_${safeDate}`, exportHeaders, dataToExport);
  };

  // Excel Export (.xls)
  const handleExportExcel = async () => {
    const dataToExport = await fetchAllForExport();
    if (!dataToExport || dataToExport.length === 0) return;
    const safeDate = new Date().toISOString().slice(0, 10);
    const typeLabel = selectedType.replace(/\s+/g, "_");
    downloadExcel(
      `Transactions_Report_${typeLabel}_${safeDate}`,
      exportHeaders,
      dataToExport,
      `Transactions Report (${selectedType})`
    );
  };

  // PDF / Print Export
  const handleExportPDF = async () => {
    const dataToExport = await fetchAllForExport();
    if (!dataToExport || dataToExport.length === 0) return;
    const { label: dateLabel } = getDateBounds(dateFilter, customFromDate, customToDate, selectedMonth);
    const metadata = {
      "Transaction Type": selectedType,
      "Branch Location": selectedWarehouse === "All" ? "All Locations" : selectedWarehouse,
      "Date Range": dateLabel,
      "Status Filter": selectedStatus,
      ...(selectedCustomer ? { Customer: selectedCustomer } : {}),
      ...(search ? { Search: search } : {}),
    };
    exportToPDF(`Transactions Report - ${selectedType}`, exportHeaders, dataToExport, metadata);
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
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-label font-semibold border transition-all duration-150 cursor-pointer ${active
                ? "bg-[#E00000] text-white border-[#E00000] shadow-sm shadow-[#E00000]/20"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50/50"
                }`}
            >
              <span>{tab.label}</span>
              {selectedType === "All" && countsByType[tab.id] != null && (
                <span
                  className={`text-overline px-1.5 py-0.5 rounded-full font-semibold tnum ${active ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"
                    }`}
                >
                  {countsByType[tab.id]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Date Range Presets & Custom/Month Filter Bar ─────────────────── */}
      <div className="flex items-center gap-2 flex-wrap bg-gray-50/90 p-2.5 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 px-1">
          <CalendarRange size={15} className="text-[#E00000]" />
          <span>Date Filter:</span>
        </div>

        {[
          { id: "all", label: "All Time" },
          { id: "this_week", label: "This Week" },
          { id: "monthly", label: "Monthly" },
          { id: "custom", label: "Custom Range" },
        ].map((preset) => {
          const active = dateFilter === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => {
                setDateFilter(preset.id);
                if (preset.id === "custom" && (!customFromDate || !customToDate)) {
                  const today = getTodayStr();
                  setCustomFromDate(today);
                  setCustomToDate(today);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${active
                ? "bg-[#E00000] text-white border-[#E00000] shadow-xs"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50"
                }`}
            >
              {preset.label}
            </button>
          );
        })}

        {/* Month Selector when 'monthly' is active */}
        {dateFilter === "monthly" && (
          <div className="flex items-center gap-2 ml-auto flex-wrap animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2.5 py-1 text-xs shadow-xs">
              <span className="text-gray-400 font-semibold text-[11px]">Select Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>
            {selectedMonth && (
              <span className="text-[11px] text-gray-500 font-semibold hidden md:inline-block pr-1">
                {getDateBounds("monthly", "", "", selectedMonth).label}
              </span>
            )}
          </div>
        )}

        {/* Custom Date Pickers when 'custom' is active */}
        {dateFilter === "custom" && (
          <div className="flex items-center gap-2 ml-auto flex-wrap animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2.5 py-1 text-xs shadow-xs">
              <span className="text-gray-400 font-semibold text-[11px]">Start:</span>
              <input
                type="date"
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
                className="text-xs font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>
            <span className="text-gray-400 text-xs font-bold">→</span>
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2.5 py-1 text-xs shadow-xs">
              <span className="text-gray-400 font-semibold text-[11px]">End:</span>
              <input
                type="date"
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
                className="text-xs font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>
            {(customFromDate || customToDate) && (
              <button
                onClick={() => {
                  const today = getTodayStr();
                  setCustomFromDate(today);
                  setCustomToDate(today);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                title="Reset to Today"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {dateFilter !== "custom" && dateFilter !== "monthly" && dateFilter !== "all" && (
          <span className="text-[11px] text-gray-400 font-medium ml-auto pr-2 hidden md:inline-block">
            Range: <span className="text-gray-700 font-bold">{getDateBounds(dateFilter).label}</span>
          </span>
        )}
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
          selectedCustomer={selectedCustomer}
          onSelect={setSelectedCustomer}
          loginUser={loginUser}
        />

        {/* Branch Location Dropdown */}
        <select
          value={selectedWarehouse}
          onChange={(e) => {
            userManuallyChangedWarehouse.current = true;
            setSelectedWarehouse(e.target.value);
          }}
          className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#E00000]/30 cursor-pointer"
          title="Filter by Branch Location"
        >
          <option value="All">All Branch Locations</option>
          {displayedWarehouses.map((wh) => (
            <option key={wh.name} value={wh.name}>
              {wh.name || wh.warehouse_name}
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

        {/* Export Dropdown (CSV, Excel, PDF/Print) */}
        <ExportDropdown
          onExportCSV={handleExportCSV}
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          disabled={totalRecords === 0}
        />

        <span className="text-xs text-gray-400 font-semibold tabular-nums ml-auto">
          {totalRecords} {totalRecords === 1 ? "record" : "records"}
        </span>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 overflow-x-auto bg-white shadow-xs">
        {loading ? (
          <ReportLoader label="Loading transaction records…" />
        ) : (
          <table className="w-full text-sm border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                {[
                  "#",
                  "Type",
                  "Reference ID",
                  "Date & Time",
                  "OET / Txn ID",
                  "Customer",
                  "Amount",
                  "Currency",
                  "Currency Pair",
                  "Status",
                  "Branch Location",
                  "Created By",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap ${h === "Amount" ? "text-right" : ""
                      }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-5 py-14 text-center text-gray-400 text-sm">
                    No transactions found for the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                  const isMoneyTransfer = row.type === "Money Transfer";
                  const isDealerExchange = row.type === "Dealer Exchange";
                  const isCurrencyExchange = row.type === "Currency Exchange";

                  return (
                    <tr
                      key={`${row.name}_${idx}`}
                      className={`border-b border-gray-100 transition-colors hover:bg-gray-50/80 ${idx % 2 === 1 ? "bg-gray-50/30" : "bg-white"
                        }`}
                    >
                      <td className="px-4 py-3.5 text-xs text-gray-400 tabular-nums">
                        {startIndex + idx + 1}
                      </td>

                      {/* Dedicated Type Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isMoneyTransfer && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            {transactionTypeLabel(row)}
                          </span>
                        )}
                        {isDealerExchange && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            {transactionTypeLabel(row)}
                          </span>
                        )}
                        {(isCurrencyExchange || (!isMoneyTransfer && !isDealerExchange)) && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {transactionTypeLabel(row)}
                          </span>
                        )}
                      </td>

                      {/* Reference ID */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs border border-gray-200 rounded-lg px-2 py-0.5 bg-gray-50 text-gray-700 font-semibold truncate inline-block">
                          {row.name}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                        {(() => {
                          const { date, time } = extractDateTime(row);
                          return (
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-800">{date}</span>
                              {time ? (
                                <span className="text-[11px] text-gray-500 font-mono font-medium">
                                  {time}
                                </span>
                              ) : null}
                            </div>
                          );
                        })()}
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

                      {/* Source and destination currency */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-bold text-gray-700">
                        {currencyPair(row)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={row.status} />
                      </td>

                      {/* Warehouse */}
                      <td className="px-4 py-3.5 text-xs text-gray-500 max-w-[140px] truncate">
                        <TextCell value={row.set_warehouse} muted />
                      </td>

                      {/* Created By */}
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
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 border ${row.status === "Cancelled" || row.status === "Draft"
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
            {rows.length > 0 && (
              <tfoot>
                {totalPages > 1 && (
                  <tr className="bg-gray-50/50 border-t border-gray-200">
                    <td colSpan={6} className="px-4 py-2 text-overline font-semibold text-gray-500 uppercase tracking-wider">
                      Page Subtotal ({rows.length} items)
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-gray-700 tnum text-caption">
                      {pageGrand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td colSpan={5} />
                  </tr>
                )}
                <tr className="bg-gray-50 border-t-2 border-[#E00000]/15">
                  <td colSpan={6} className="px-4 py-3 text-overline font-semibold uppercase tracking-wider text-brand-600">
                    Total Amount ({totalRecords} {totalRecords === 1 ? "record" : "records"})
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900 tnum text-label">
                    {(totalAmount || pageGrand).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td colSpan={5} />
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      {/* ── Pagination Controls ────────────────────────────────────────── */}
      <Pagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}

// ── Day End Closing Report Tab ─────────────────────────────────────────────
function RegisterDayEndTab({ warehouse, warehouses = [] }) {
  const today = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [reportLocation, setReportLocation] = useState(warehouse?.warehouse || "All Locations");
  const [allLocations, setAllLocations] = useState([]);
  const [report, setReport] = useState(null);
  const [selectedSession, setSelectedSession] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    axios.get("/api/method/moneygram.moneygram.api.get_transactions.get_warehouses_list")
      .then(response => {
        if (!live) return;
        setAllLocations((response.data?.message || []).filter(row => !row?.is_group && !row?.custom_is_vault && row?.warehouse_type !== "Vault"));
      })
      .catch(() => { if (live) setAllLocations(warehouses || []); });
    return () => { live = false; };
  }, [warehouses]);

  const generate = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("/api/method/moneygram.custom_pos.api.get_register_day_end_report", { params: { from_date: fromDate, to_date: toDate, warehouse: reportLocation } });
      const result = response.data?.message || { registers: [], consolidated_stock: [] };
      setReport(result);
      setSelectedSession(current => result.registers?.some(row => row.session === current) ? current : "");
    } catch (cause) {
      setError(cause.response?.data?.message || cause.message || "Unable to generate the register report.");
      setReport(null);
    } finally { setLoading(false); }
  }, [fromDate, toDate, reportLocation]);

  useEffect(() => { generate(); }, [generate]);
  const registers = report?.registers || [];
  const selected = registers.find(row => row.session === selectedSession);
  const moneyValue = value => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return <div className="space-y-5">
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div><p className="text-overline font-bold uppercase tracking-wider text-[#E00000]">Register day-end report</p><h2 className="mt-1 text-h2 font-bold text-gray-900">Open and Close Register activity</h2><p className="mt-1 text-sm text-gray-500">Select an opening-date range to review each register, its transactions, and consolidated currency stock.</p></div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.4fr_auto] xl:items-end">
        <label className="text-overline font-bold uppercase tracking-wider text-gray-500">From date<input type="date" value={fromDate} onChange={event => setFromDate(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold normal-case text-gray-800 outline-none focus:border-[#E00000]" /></label>
        <label className="text-overline font-bold uppercase tracking-wider text-gray-500">To date<input type="date" value={toDate} onChange={event => setToDate(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold normal-case text-gray-800 outline-none focus:border-[#E00000]" /></label>
        <label className="text-overline font-bold uppercase tracking-wider text-gray-500">Location<select value={reportLocation} onChange={event => setReportLocation(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold normal-case text-gray-800 outline-none focus:border-[#E00000]"><option value="All Locations">All Locations</option>{allLocations.map(row => { const name = row.warehouse || row.name || row.warehouse_name; return <option key={name} value={name}>{name}</option>; })}</select></label>
        <button type="button" onClick={generate} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E00000] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Generate</button>
      </div>
    </section>

    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
    {loading ? <section className="rounded-2xl border border-gray-200 bg-white"><ReportLoader label="Generating register report…" /></section> : report && <>
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4"><h3 className="font-bold text-gray-900">Consolidated currency stock</h3><p className="mt-1 text-xs text-gray-500">Combined physical quantities and native-currency values for registers opened in the selected range.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead className="bg-slate-100 text-left text-xs font-bold uppercase tracking-wider text-slate-600"><tr><th className="px-5 py-3">Currency</th><th className="px-5 py-3 text-right">Opening qty</th><th className="px-5 py-3 text-right">Opening value</th><th className="px-5 py-3 text-right">Closing qty</th><th className="px-5 py-3 text-right">Closing value</th></tr></thead><tbody className="divide-y divide-gray-100">{(report.consolidated_stock || []).map(row => <tr key={row.currency}><td className="px-5 py-3 font-black text-gray-900">{row.currency}</td><td className="px-5 py-3 text-right tabular-nums">{moneyValue(row.opening_quantity)}</td><td className="px-5 py-3 text-right font-bold tabular-nums text-blue-700">{row.currency} {moneyValue(row.opening_value)}</td><td className="px-5 py-3 text-right tabular-nums">{moneyValue(row.closing_quantity)}</td><td className="px-5 py-3 text-right font-bold tabular-nums text-violet-700">{row.currency} {moneyValue(row.closing_value)}</td></tr>)}</tbody></table>{!report.consolidated_stock?.length && <p className="p-8 text-center text-sm text-gray-500">No register currency stock was recorded in this range.</p>}</div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4"><div><h3 className="font-bold text-gray-900">Registers</h3><p className="mt-1 text-xs text-gray-500">Select an Open Register to view its complete session report.</p></div><span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600">{registers.length} records</span></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[950px] text-sm"><thead className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wider text-gray-500"><tr><th className="px-5 py-3">Open Register</th><th className="px-5 py-3">Opened</th><th className="px-5 py-3">Location</th><th className="px-5 py-3">Teller</th><th className="px-5 py-3">Close Register</th><th className="px-5 py-3">Status</th><th className="px-5 py-3"></th></tr></thead><tbody className="divide-y divide-gray-100">{registers.map(row => <tr key={row.session} className={selectedSession === row.session ? "bg-red-50" : "hover:bg-gray-50"}><td className="px-5 py-3 font-black text-gray-900">{row.open_register || "—"}</td><td className="px-5 py-3 text-gray-600">{String(row.opened_at || row.business_date || "—")}</td><td className="px-5 py-3 font-medium text-gray-700">{row.location}</td><td className="px-5 py-3 text-gray-600">{row.opened_by || "—"}</td><td className="px-5 py-3">{row.close_register ? <span className="font-black text-gray-900">{row.close_register}</span> : <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">Close Register required</span>}</td><td className="px-5 py-3 text-gray-600">{row.status}</td><td className="px-5 py-3 text-right"><button type="button" onClick={() => setSelectedSession(current => current === row.session ? "" : row.session)} className="font-bold text-[#E00000] hover:underline">{selectedSession === row.session ? "Hide report" : "View report"}</button></td></tr>)}</tbody></table>{!registers.length && <p className="p-10 text-center text-sm text-gray-500">No Open Register records were found for this date range and location.</p>}</div>
      </section>

      {selected && <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4"><div><p className="text-overline font-bold uppercase tracking-wider text-[#E00000]">Register session report</p><h3 className="mt-1 text-xl font-black text-gray-900">{selected.open_register}</h3><p className="mt-1 text-sm text-gray-500">{selected.location} · {selected.session}</p></div>{selected.close_required ? <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">Close Register required</span> : <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">Closed with {selected.close_register}</span>}</div>
        <div className="grid gap-3 md:grid-cols-2"><div className="rounded-xl border border-blue-200 bg-blue-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Open Register</p><p className="mt-1 font-black text-blue-950">{selected.open_register}</p><p className="mt-2 text-sm text-blue-900">{selected.opened_by} · {String(selected.opened_at || "—")}</p>{selected.open_remarks && <p className="mt-2 text-sm text-blue-800">Note: {selected.open_remarks}</p>}</div><div className={`rounded-xl border p-4 ${selected.close_required ? "border-red-200 bg-red-50" : "border-violet-200 bg-violet-50"}`}><p className={`text-xs font-bold uppercase tracking-wider ${selected.close_required ? "text-red-700" : "text-violet-700"}`}>Close Register</p>{selected.close_required ? <><p className="mt-1 font-black text-red-900">Closing has not been completed</p><p className="mt-2 text-sm text-red-700">Complete the Close Register to record the final physical cash.</p></> : <><p className="mt-1 font-black text-violet-950">{selected.close_register}</p><p className="mt-2 text-sm text-violet-900">{selected.closed_by} · {String(selected.closed_at || "—")}</p>{selected.close_remarks && <p className="mt-2 text-sm text-violet-800">Note: {selected.close_remarks}</p>}</>}</div></div>

        <div><h4 className="mb-3 font-bold text-gray-900">Currency stock for this register</h4><div className="overflow-x-auto rounded-xl border border-gray-200"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-100 text-left text-xs font-bold uppercase tracking-wider text-slate-600"><tr><th className="px-4 py-3">Currency</th><th className="px-4 py-3 text-right">Opening qty</th><th className="px-4 py-3 text-right">Opening value</th><th className="px-4 py-3 text-right">Closing qty</th><th className="px-4 py-3 text-right">Closing value</th><th className="px-4 py-3 text-right">Value movement</th></tr></thead><tbody className="divide-y divide-gray-100">{selected.currency_stock.map(row => <tr key={row.currency}><td className="px-4 py-3 font-black">{row.currency}</td><td className="px-4 py-3 text-right">{moneyValue(row.opening_quantity)}</td><td className="px-4 py-3 text-right font-bold text-blue-700">{row.currency} {moneyValue(row.opening_value)}</td><td className="px-4 py-3 text-right">{row.closing_quantity == null ? "—" : moneyValue(row.closing_quantity)}</td><td className="px-4 py-3 text-right font-bold text-violet-700">{row.closing_value == null ? "—" : `${row.currency} ${moneyValue(row.closing_value)}`}</td><td className={`px-4 py-3 text-right font-black ${Number(row.value_difference || 0) < 0 ? "text-red-700" : "text-emerald-700"}`}>{row.value_difference == null ? "—" : `${row.currency} ${moneyValue(row.value_difference)}`}</td></tr>)}</tbody></table></div></div>

        <div><h4 className="mb-3 font-bold text-gray-900">Transaction summary</h4><div className="overflow-x-auto rounded-xl border border-gray-200"><table className="w-full min-w-[800px] text-sm"><thead className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wider text-gray-500"><tr><th className="px-4 py-3">Service</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Currency pair</th><th className="px-4 py-3 text-right">Transactions</th><th className="px-4 py-3 text-right">Foreign value</th><th className="px-4 py-3 text-right">FJD value</th></tr></thead><tbody className="divide-y divide-gray-100">{selected.activity_summary.map((row, index) => <tr key={`${row.category}-${row.action}-${index}`}><td className="px-4 py-3 font-bold">{row.category}</td><td className="px-4 py-3">{row.action}</td><td className="px-4 py-3 font-black">{row.from_currency} → {row.to_currency}</td><td className="px-4 py-3 text-right">{row.transactions}</td><td className="px-4 py-3 text-right">{moneyValue(row.foreign_value)}</td><td className="px-4 py-3 text-right font-bold">FJD {moneyValue(row.local_value)}</td></tr>)}</tbody></table>{!selected.activity_summary.length && <p className="p-6 text-center text-sm text-gray-500">No transactions are linked to this register session.</p>}</div></div>

        <div><h4 className="mb-3 font-bold text-gray-900">Transactions</h4><div className="overflow-x-auto rounded-xl border border-gray-200"><table className="w-full min-w-[1050px] text-sm"><thead className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wider text-gray-500"><tr><th className="px-4 py-3">Transaction</th><th className="px-4 py-3">Service</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Currency pair</th><th className="px-4 py-3 text-right">Foreign value</th><th className="px-4 py-3 text-right">FJD value</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created By</th><th className="px-4 py-3">Created</th></tr></thead><tbody className="divide-y divide-gray-100">{selected.transactions.map(row => <tr key={`${row.category}-${row.source_document}`}><td className="px-4 py-3 font-mono font-bold">{row.id}</td><td className="px-4 py-3 font-bold">{row.category}</td><td className="px-4 py-3">{row.action}</td><td className="px-4 py-3 font-black">{row.from_currency} → {row.to_currency}</td><td className="px-4 py-3 text-right">{moneyValue(row.foreign_value)}</td><td className="px-4 py-3 text-right font-bold">FJD {moneyValue(row.local_value)}</td><td className="px-4 py-3">{row.status}</td><td className="px-4 py-3">{row.created_by}</td><td className="px-4 py-3 text-gray-500">{String(row.created_at || "—")}</td></tr>)}</tbody></table>{!selected.transactions.length && <p className="p-6 text-center text-sm text-gray-500">No transactions are linked to this register session.</p>}</div></div>
      </section>}
    </>}
  </div>;
}

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

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const resultRows = report?.result || [];
  const totalRecords = resultRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const paginatedRows = resultRows.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [date, oetCode, pageSize]);

  const handleExportCSV = () => {
    if (!resultRows || resultRows.length === 0) return;

    const headers = orderedColumns.map((col) => ({
      label: col.label || col.fieldname,
      key: col.fieldname,
    }));

    const safeDate = date || new Date().toISOString().slice(0, 10);
    const safeOet = oetCode ? `_${oetCode}` : "";
    downloadCSV(`Day_End_Report_${safeDate}${safeOet}`, headers, resultRows);
  };

  const handleExportExcel = () => {
    if (!resultRows || resultRows.length === 0) return;

    const headers = orderedColumns.map((col) => ({
      label: col.label || col.fieldname,
      key: col.fieldname,
    }));

    const safeDate = date || new Date().toISOString().slice(0, 10);
    const safeOet = oetCode ? `_${oetCode}` : "";
    downloadExcel(
      `Day_End_Report_${safeDate}${safeOet}`,
      headers,
      resultRows,
      `Day End Closing Report - ${safeDate}`
    );
  };

  const handleExportPDF = () => {
    if (!resultRows || resultRows.length === 0) return;

    const headers = orderedColumns.map((col) => ({
      label: col.label || col.fieldname,
      key: col.fieldname,
    }));

    const metadata = {
      Date: date,
      Company: "MH Money Express",
      ...(oetCode ? { "OET Code": oetCode } : {}),
      ...(warehouse?.warehouse ? { "Branch Location": warehouse.warehouse } : {}),
    };
    exportToPDF(`Day End Closing Report - ${date}`, headers, resultRows, metadata);
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
            className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer"
          />
        </div>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-[#E00000]" : ""} />
          Generate
        </button>

        <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50 transition-all cursor-pointer">
          <label htmlFor="oet-code">OET Code</label>
          <select onChange={(e) => setOetCode(e.target.value)} name="oet-code" id="oet-code" className="bg-transparent focus:outline-none cursor-pointer">
            <option value="">--SELECT--</option>
            {potOptions.map((pot) => (
              <option key={pot.code} value={pot.code}>
                {pot.code}
              </option>
            ))}
          </select>
          <div className="pointer-events-none pl-1 text-gray-400">
            <ChevronDown size={14} />
          </div>
        </div>

        {/* Export Dropdown */}
        <ExportDropdown
          onExportCSV={handleExportCSV}
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          disabled={!resultRows || resultRows.length === 0}
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xs">
          <ReportLoader label="Generating Day End Closing report…" />
        </div>
      ) : !report ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-400 text-sm">
          No report data available for the selected date.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Summary Table */}
          <div className="rounded-2xl border border-gray-200 overflow-hidden md:col-span-2 bg-white shadow-xs">
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#E00000]">Day End Summary · {date}</p>
              <ExportDropdown
                onExportCSV={handleExportCSV}
                onExportExcel={handleExportExcel}
                onExportPDF={handleExportPDF}
                disabled={!resultRows || resultRows.length === 0}
              />
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 w-12">
                    #
                  </th>
                  {orderedColumns.map((col) => (
                    <th key={col.fieldname} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={orderedColumns.length + 1} className="px-5 py-8 text-center text-gray-400 text-sm">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, idx) => (
                    <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 1 ? "bg-gray-50/40" : "bg-white"}`}>
                      <td className="px-5 py-3 text-left text-xs text-gray-400 tabular-nums">
                        {startIndex + idx + 1}
                      </td>
                      {orderedColumns.map((col) => (
                        <td key={col.fieldname} className="px-5 py-3 text-left text-sm text-gray-700">
                          {row[col.fieldname] ?? "-"}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="p-3 border-t border-gray-100">
                <Pagination
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  totalRecords={totalRecords}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stock Tab ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, type = "default", suffix }) {
  const styles = {
    default: { card: "bg-white border-gray-200", label: "text-gray-500", val: "text-gray-900", sub: "text-gray-400" },
    green: { card: "bg-green-50 border-green-200", label: "text-green-600", val: "text-green-700", sub: "text-green-400" },
    red: { card: "bg-red-50 border-red-200", label: "text-red-500", val: "text-red-600", sub: "text-red-400" },
    muted: { card: "bg-gray-50 border-gray-100", label: "text-gray-400", val: "text-gray-400", sub: "text-gray-300" },
  };
  const s = styles[type];
  return (
    <div className={`flex-1 min-w-[140px] rounded-2xl border px-5 py-4 flex flex-col gap-1 ${s?.card}`}>
      <p className={`text-overline font-semibold uppercase tracking-wider ${s?.label}`}>{label}</p>
      <div className="flex items-baseline gap-2 flex-wrap">
        <p className={`text-amount font-bold tnum leading-tight ${s?.val}`}>{value}</p>
        {suffix && (
          <span className="text-btn-lg font-bold text-gray-500 tracking-wide">
            {suffix}
          </span>
        )}
      </div>
      {sub && <p className={`text-caption ${s.sub}`}>{sub}</p>}
    </div>
  );
}

function QtyBadge({ qty }) {
  const n = parseFloat(qty) || 0;
  if (n < 0)
    return <span className="inline-block text-xs font-bold px-3 py-1 rounded-full tabular-nums bg-red-50 text-red-500 border border-red-200">{n}</span>;
  if (n === 0)
    return <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-400 border border-gray-200">—</span>;
  return <span className="inline-block text-xs font-bold px-3 py-1 rounded-full tabular-nums bg-green-50 text-green-700 border border-green-200">{n.toLocaleString()}</span>;
}

function totalQty(items) { return items?.reduce((s, i) => s + (parseFloat(i.stock_qty) || 0), 0); }
function inStockQty(items) { return items?.filter(i => (parseFloat(i.stock_qty) || 0) > 0).reduce((s, i) => s + (parseFloat(i.stock_qty) || 0), 0); }
function totalValue(items) { return items?.reduce((sum, i) => sum + (parseFloat(i.stock_value) || 0), 0); }

const parseDenominationValue = (item) => {
  if (item.custom_attribute_value != null && item.custom_attribute_value !== "" && !isNaN(Number(item.custom_attribute_value))) {
    return Number(item.custom_attribute_value);
  }
  const str = String(item.item_name || item.item_code || "").trim();
  if (str.endsWith("c") || str.endsWith("C")) {
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num / 100;
  }
  const match = str.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
};

const getRowCurrencyValue = (item) => {
  if (item.total_currency_value != null && item.total_currency_value !== "" && !isNaN(Number(item.total_currency_value))) {
    return Number(item.total_currency_value);
  }
  const attr = parseDenominationValue(item);
  const qty = parseFloat(item.stock_qty) || 0;
  return attr * qty;
};

function totalCurrencyValue(items) {
  return items?.reduce((sum, i) => sum + (getRowCurrencyValue(i) || 0), 0);
}

function StockTab({ warehouse, loginUser }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(null);
  const [vaultInfo, setVaultInfo] = useState(null);
  const [locationMode, setLocationMode] = useState("counter"); // "counter" | "vault"

  const activeBranch = warehouse?.warehouse || (typeof warehouse === "string" ? warehouse : "");

  // Load linked vault info for the active warehouse
  useEffect(() => {
    if (!activeBranch || !loginUser?.user?.email) return;
    axios
      .get("/api/method/moneygram.moneygram.api.vault_transfer.get_vault_info", {
        params: { warehouse: activeBranch },
        headers: {
        },
      })
      .then((res) => {
        if (res.data?.message) {
          setVaultInfo(res.data.message);
        }
      })
      .catch((err) => console.error("Error loading vault info in reports:", err));
  }, [activeBranch, loginUser?.user?.email, loginUser?.user?.email]);

  const queryWarehouse =
    locationMode === "vault"
      ? vaultInfo?.vault_warehouse || activeBranch
      : vaultInfo?.branch_warehouse || activeBranch;

  const countries = Object.keys(data).filter((c) => data[c]?.length > 0);

  const fetchStock = useCallback(async () => {
    if (!loginUser?.user || !queryWarehouse) return;
    setLoading(true);
    try {
      const res = await axios.request({
        method: "POST",
        url: "/api/method/moneygram.moneygram.api.get_denomination.get_all_countries_stock",
        headers: {
          "Content-Type": "application/json",
        },
        data: { warehouse: queryWarehouse },
      });
      setData(res.data.message ?? {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [queryWarehouse, loginUser]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  useEffect(() => {
    if (countries.length > 0 && !active) setActive(countries[0]);
  }, [data]);

  const currCode = CURRENCY_CODE[active] || active || "Currency";
  const isFiji = active === "Fiji" || currCode === "FJD";
  const items = data[active];
  const total = totalQty(items);
  const positive = inStockQty(items);
  const inStockCount = items?.filter(i => (parseFloat(i.stock_qty) || 0) > 0).length ?? 0;
  const totalValueAmt = totalValue(items);
  const totalCurrValueAmt = totalCurrencyValue(items);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const rawItems = items || [];
  const totalRecords = rawItems.length;
  const isAll = pageSize === "all" || pageSize === "All";
  const effectivePageSize = isAll ? Math.max(1, totalRecords) : (Number(pageSize) || 25);
  const totalPages = Math.max(1, Math.ceil(totalRecords / effectivePageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = isAll ? 0 : (safeCurrentPage - 1) * effectivePageSize;
  const endIndex = isAll ? totalRecords : Math.min(startIndex + effectivePageSize, totalRecords);
  const paginatedItems = isAll ? rawItems : rawItems.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [active, pageSize]);

  const stockHeaders = [
    { label: "Item Code", key: "item_code" },
    { label: "Denomination", key: "item_name" },
    { label: "Branch Location", key: "warehouse" },
    {
      label: "Rate (FJD)",
      accessor: (r) => ((parseFloat(r.stock_qty) || 0) > 0 ? (r.valuation_rate || 0) : 0),
      align: "right",
    },
    ...(!isFiji
      ? [{ label: currCode, accessor: (r) => ((parseFloat(r.stock_qty) || 0) > 0 ? parseDenominationValue(r) : 0), align: "right" }]
      : []),
    { label: "Item Value (FJD)", key: "stock_value", align: "right" },
    ...(!isFiji
      ? [{ label: `${currCode} Value`, accessor: (r) => getRowCurrencyValue(r), align: "right" }]
      : []),
    { label: "Stock Qty", key: "stock_qty", align: "right" },
  ];

  const handleExportCSV = () => {
    if (!rawItems || rawItems.length === 0) return;
    const safeDate = new Date().toISOString().slice(0, 10);
    const countryName = active || "All";
    downloadCSV(`Stock_Report_${countryName}_${safeDate}`, stockHeaders, rawItems);
  };

  const handleExportExcel = () => {
    if (!rawItems || rawItems.length === 0) return;
    const safeDate = new Date().toISOString().slice(0, 10);
    const countryName = active || "All";
    downloadExcel(
      `Stock_Report_${countryName}_${safeDate}`,
      stockHeaders,
      rawItems,
      `Stock Report (${countryName})`
    );
  };

  const handleExportPDF = () => {
    if (!rawItems || rawItems.length === 0) return;
    const metadata = {
      Currency: `${active} (${currCode})`,
      "Branch Location": queryWarehouse || "All Branches",
      "Stock View": locationMode === "vault" ? "Vault" : "Cash Counter",
      "Total Quantity": total?.toLocaleString(),
      "Total Value (FJD)": totalValueAmt?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      ...(!isFiji
        ? { [`Total ${currCode}`]: totalCurrValueAmt?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
        : {}),
    };
    exportToPDF(`Currency Stock Report - ${active}`, stockHeaders, rawItems, metadata);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Vault vs Cash Counter Switcher ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-overline font-semibold uppercase tracking-wider text-gray-400">Stock Location:</span>
          <div className="inline-flex p-1 rounded-xl bg-gray-100 border border-gray-200">
            <button
              type="button"
              onClick={() => setLocationMode("counter")}
              className={`px-3.5 py-1.5 rounded-lg text-label font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${locationMode === "counter"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
                }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#E00000]" />
              <span>Cash Counter</span>
              <span className="text-caption text-gray-400 font-normal">
                ({vaultInfo?.branch_warehouse || activeBranch})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLocationMode("vault")}
              disabled={!vaultInfo?.vault_warehouse}
              className={`px-3.5 py-1.5 rounded-lg text-label font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${locationMode === "vault"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Vault</span>
              <span className="text-caption text-gray-400 font-normal">
                ({vaultInfo?.vault_warehouse || "No Vault"})
              </span>
            </button>
          </div>
        </div>

        <div className="text-caption text-gray-500 flex items-center gap-1.5">
          <span>Viewing Stock For:</span>
          <strong className="text-gray-900 font-semibold bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
            {queryWarehouse}
          </strong>
        </div>
      </div>

      {/* Currency tabs */}
      <div className="flex flex-wrap gap-2">
        {countries.map((c) => {
          const isFijiTab = c === "Fiji" || CURRENCY_CODE[c] === "FJD";
          const tot = isFijiTab ? totalValue(data[c]) : totalCurrencyValue(data[c]);
          const isActive = c === active;
          return (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-label font-semibold border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E00000] cursor-pointer
                ${isActive
                  ? "bg-[#E00000] text-white border-[#E00000] shadow-md shadow-[#E00000]/25"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50"
                }`}
            >
              <span>{c}</span>
              {CURRENCY_CODE[c] && (
                <span className={`text-caption font-semibold uppercase px-1.5 py-0.5 rounded tracking-wide ${isActive ? "bg-white/20 text-white" : "bg-gray-200/80 text-gray-600"
                  }`}>
                  {CURRENCY_CODE[c]}
                </span>
              )}
              <span className={`text-caption px-2 py-0.5 rounded-full font-semibold tnum
                ${isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}>
                {tot?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
            </button>
          );
        })}
        <div className="flex items-center gap-2 ml-auto">
          {/* Export Dropdown */}
          <ExportDropdown
            onExportCSV={handleExportCSV}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            disabled={!rawItems || rawItems.length === 0}
          />
          <button
            onClick={fetchStock}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-[#E00000]" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xs">
          <ReportLoader label="Loading currency stock report…" />
        </div>
      ) : countries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-400 text-sm">
          No stock data available for this branch location.
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="flex flex-wrap gap-3">
            <StatCard label="Total Qty" value={total?.toLocaleString()} sub={`${currCode} · all denominations`} type="default" />
            <StatCard label="In Stock" value={positive?.toLocaleString()} sub={`${inStockCount} denomination${inStockCount !== 1 ? "s" : ""}`} type="green" />
            <StatCard
              label="Total Value"
              value={
                isFiji
                  ? totalValueAmt?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : totalCurrValueAmt?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              }
              suffix={currCode ? `(${currCode})` : ""}
              sub={
                isFiji
                  ? "total worth in FJD"
                  : `FJD: ${totalValueAmt?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              }
              type="default"
            />
          </div>

          <div className="border-t border-gray-100" />

          {/* Active currency label */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs font-bold tracking-widest uppercase text-[#E00000]">Denominations</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 text-xs text-gray-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                <span className="font-bold text-gray-900">{active}</span>
                {CURRENCY_CODE[active] && (
                  <>
                    <span className="text-gray-400">·</span>
                    <span className="font-semibold text-gray-800">{CURRENCY_CODE[active]}</span>
                  </>
                )}
                <span className="text-gray-400">·</span>
                <span>{rawItems.length} items</span>
              </span>

              {/* Rows per page selector in header */}
              <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                <span className="text-gray-500 font-medium">Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPageSize(val === "All" ? "All" : Number(val));
                  }}
                  className="bg-transparent font-semibold text-gray-800 cursor-pointer focus:outline-none"
                >
                  {[10, 25, 50, 100, "All"].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === "All" ? "All items" : `${opt} items`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-gray-200 overflow-x-auto bg-white shadow-xs">
            <table className="w-full text-sm border-collapse min-w-[780px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">#</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Item Code</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Denomination</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Branch Location</th>
                  <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Rate (FJD)</th>
                  {!isFiji && (
                    <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">{currCode}</th>
                  )}
                  <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Item Value (FJD)</th>
                  {!isFiji && (
                    <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">{currCode} Value</th>
                  )}
                  <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Stock Qty</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((row, idx) => {
                  const qty = parseFloat(row.stock_qty) || 0;
                  const isVault = locationMode === "vault";
                  const valRate = qty <= 0 ? 0 : (row.valuation_rate || 0);
                  const attrVal = qty <= 0 ? 0 : parseDenominationValue(row);
                  const currVal = qty <= 0 ? 0 : getRowCurrencyValue(row);
                  const stVal = qty <= 0 ? 0 : (row.stock_value || 0);
                  return (
                    <tr key={row.item_code} className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50/40" : "bg-white"}`}>
                      <td className="px-5 py-3.5 text-xs text-gray-400 tabular-nums">{startIndex + idx + 1}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-block border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium tracking-wide text-gray-700 bg-gray-50 font-mono">{row.item_code}</span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-gray-800">{row.item_name}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">{row.warehouse}</td>
                      <td className="px-5 py-3.5 text-right"><QtyBadge qty={valRate} /></td>
                      {!isFiji && (
                        <td className="px-5 py-3.5 text-right"><QtyBadge qty={attrVal} /></td>
                      )}
                      <td className="px-5 py-3.5 text-right"><QtyBadge qty={stVal} /></td>
                      {!isFiji && (
                        <td className="px-5 py-3.5 text-right"><QtyBadge qty={currVal} /></td>
                      )}
                      <td className="px-5 py-3.5 text-right"><QtyBadge qty={row.stock_qty} /></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-[#E00000]/15">
                  <td colSpan={4} className="px-5 py-3 text-overline font-semibold uppercase tracking-wider text-brand-600">Total ({rawItems.length} items)</td>
                  <td className="px-5 py-3 text-right text-caption text-gray-400 font-semibold">—</td>
                  {!isFiji && (
                    <td className="px-5 py-3 text-right text-caption text-gray-400 font-semibold">—</td>
                  )}
                  <td className="px-5 py-3 text-right font-bold text-gray-900 tnum">{totalValueAmt?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  {!isFiji && (
                    <td className="px-5 py-3 text-right font-bold text-[#E00000] tnum">{totalCurrValueAmt?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  )}
                  <td className="px-5 py-3 text-right font-bold text-gray-900 tnum">{total?.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalRecords > 0 && (
            <Pagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              totalRecords={totalRecords}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50, 100, "All"]}
            />
          )}
        </>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function Reports() {
  const [tab, setTab] = useState("transactions");
  const loginUser = useUser();
  const { selectedWarehouse, warehouses } = useSettings();
  const [cashCounterManager, setCashCounterManager] = useState(false);

  useEffect(() => {
    const warehouse = selectedWarehouse?.warehouse;
    if (!warehouse) { setCashCounterManager(false); return; }
    let live = true;
    // This deliberately avoids getStatus(), which assembles a full inventory
    // snapshot and denomination catalog that the report-tab permission check
    // does not need.
    customPos.getManagerAccess(warehouse).then(result => { if (live) setCashCounterManager(Boolean(result?.manager)); }).catch(() => { if (live) setCashCounterManager(false); });
    return () => { live = false; };
  }, [selectedWarehouse?.warehouse]);

  useEffect(() => {
    const userObj = loginUser?.user;
    if (!userObj) return;

    console.group("Logged in User Warehouse Information (Reports Page)");
    console.log("Logged-in user:", userObj.email || userObj.name || userObj.username || userObj.user);
    console.log("Logged-in user's 'warehouse' field:", userObj.warehouse);
    console.log("Logged-in user's 'warehouses' field (all assigned):", userObj.warehouses);
    if (Array.isArray(userObj.warehouses) && userObj.warehouses.length > 0) {
      console.log(
        "Assigned Warehouse names:",
        userObj.warehouses.map((w) => (typeof w === "object" ? w.warehouse || w.name : w))
      );
    }
    console.log("Full user session object:", userObj);
    console.groupEnd();

    // Also fetch User document directly from ERPNext to inspect raw "warehouse" child table / field in DB
    const userIdentifier = userObj.email || userObj.name || userObj.username;
    if (userIdentifier) {
      axios
        .get(`/api/resource/User/${encodeURIComponent(userIdentifier)}`)
        .then((res) => {
          const userDoc = res.data?.data;
          console.group("User Doc directly from ERPNext ('warehouse' field)");
          console.log("User doc 'warehouse' field:", userDoc?.warehouse);
          if (Array.isArray(userDoc?.warehouse)) {
            console.log(
              "User doc warehouse list:",
              userDoc.warehouse.map((row) => row.warehouse || row)
            );
          }
          console.log("User doc full data:", userDoc);
          console.groupEnd();
        })
        .catch((err) => {
          console.log("Could not fetch User doctype directly:", err?.message || err);
        });
    }
  }, [loginUser?.user]);

  const sectionLabel = {
    transactions: "Transaction Records",
    stock: "Currency Stock",
    cash_counter: "Cash Counter Records",
  };

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gray-100 font-sans">
        <div className="max-w-[80%] mx-auto px-4 py-10 flex flex-col gap-6">

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
                label="Stock"
                active={tab === "stock"}
                onClick={() => setTab("stock")}
              />
              {cashCounterManager && <TabButton label="Cash Counter" active={tab === "cash_counter"} onClick={() => setTab("cash_counter")} />}
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
            {tab === "stock" && (
              <StockTab warehouse={selectedWarehouse} loginUser={loginUser} />
            )}
            {tab === "cash_counter" && cashCounterManager && <CashCounterReportTab warehouse={selectedWarehouse} warehouses={warehouses} />}

          </div>

          <p className="text-center text-xs text-gray-400 pb-2">MH Money Express · Reports · Stores - MME</p>
        </div>
      </div>
    </div>
  );
}
