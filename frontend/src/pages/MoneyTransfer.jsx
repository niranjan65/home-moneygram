//MoneyTransfer.jsx
import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useERPFileUpload } from "../hooks/useERPFileUpload";
import { useUser } from "../context/UserContext";
import { getCustomerById, createCustomer } from "../features/exchange/api/customer";
import FileUploadBox from "../features/exchange/config/FileUploadBox";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, CheckCircle2 } from "lucide-react";
import { createMoneyTransfer } from "../features/exchange/api/createMoneyTransfer";
import TransferAmountSection from "../features/exchange/components/TransferAmountSection";
import { DenominationPanel } from "../features/exchange/components/sections/DenominationPanel";
import { InvoiceDocument } from "../components/SalesInvoice";
import { useBaseCurrency } from "../hooks/useDenomination";
import { getBaseURL, getHeaders, ERP_ENV } from "../features/exchange/config/erpConfig";
import { useSettings } from "../context/SettingsContext";
import { validateStockAvailability } from "../hooks/useStockValidation";

const MoneyTransfer = () => {
  const { uploadFile } = useERPFileUpload();
  const loginUser = useUser();
  const [metaFields, setMetaFields] = useState([]);
  const [form, setForm] = useState({});
  const [currencyDenominationRows, setCurrencyDenominationRows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const { data: baseCurrencyData, loading: baseDenomLoading, error: baseDenomError } = useBaseCurrency();

  // console.log("Current User:", loginUser);
 const settings = useSettings();
const selectedWarehouse =
  settings?.selectedWarehouse ||
  (settings?.warehouses?.length > 0 ? settings.warehouses[0] : null);

// Stock validation states
const [stockError, setStockError] = useState("");
const [stockLoading, setStockLoading] = useState(false);

const handleDenominationRowsChange = useCallback((rows) => {
  setCurrencyDenominationRows(
    rows
      .filter((row) => row.count > 0)
      .map((row) => {
        const denom = Number(row.denom);
        const itemCode = denom >= 1
          ? `FJD $${denom}`
          : `FJD ${Math.round(denom * 100)}c`;

        return {
          denomination: itemCode,
          qty: Number(row.count),
          amount: denom * Number(row.count),
        };
      })
  );
}, []);

useEffect(() => {
  console.log("⚙️ Settings Context:", settings);
  console.log("🏬 Selected Warehouse from Context:", settings?.selectedWarehouse);
  console.log(
    "💾 selected_warehouse from localStorage:",
    localStorage.getItem("selected_warehouse")
  );
}, [settings]);

const runStockCheck = async () => {
  // -----------------------------------------
  // 1. Get warehouse from Settings Context
  // -----------------------------------------
  let warehouseObj = selectedWarehouse;

  // -----------------------------------------
  // 2. Fallback to localStorage if context is not yet loaded
  // -----------------------------------------
  if (!warehouseObj) {
    try {
      const stored = localStorage.getItem("selected_warehouse");

      if (stored) {
        warehouseObj = JSON.parse(stored);
        console.log("💾 Loaded warehouse from localStorage:", warehouseObj);
      }
    } catch (err) {
      console.error("❌ Failed to parse selected_warehouse:", err);
    }
  }

  // -----------------------------------------
  // 3. Resolve warehouse name
  // Supports:
  // - { warehouse: "Main Branch - MG" }
  // - { name: "Main Branch - MG" }
  // - { label: "Main Branch - MG" }
  // - "Main Branch - MG"
  // -----------------------------------------
  const warehouseName =
    warehouseObj?.warehouse ||
    warehouseObj?.name ||
    warehouseObj?.label ||
    (typeof warehouseObj === "string" ? warehouseObj : "") ||
    "";

  console.log("🏬 Selected Warehouse Object:", warehouseObj);
  console.log("🏬 Resolved Warehouse Name:", warehouseName);
  console.log("💰 Currency Denomination Rows:", currencyDenominationRows);

  // -----------------------------------------
  // 4. Warehouse is mandatory
  // -----------------------------------------
  if (!warehouseName) {
    console.error("❌ No warehouse selected in Settings.");

    setStockError(
      "No warehouse is selected. Please select a warehouse before submitting."
    );

    return false;
  }

  // -----------------------------------------
  // 5. If no denomination rows, skip validation
  // -----------------------------------------
  if (!currencyDenominationRows.length) {
    console.log("ℹ️ No denomination rows entered. Stock validation skipped.");
    setStockError("");
    return true;
  }

  // -----------------------------------------
  // 6. Prepare items array exactly as required
  // validateStockAvailability(items, warehouse, loginUser)
  // -----------------------------------------
  const items = currencyDenominationRows.map((row) => ({
    item_code: row.denomination,
    requested_qty: Number(row.qty || 0),
  }));

  console.log("📤 Sending Stock Validation Request:");
  console.table(items);

  setStockLoading(true);

  try {
    // IMPORTANT:
    // validateStockAvailability expects:
    // 1. items      -> array
    // 2. warehouse  -> string
    // 3. loginUser  -> actual loginUser object (NOT { user })
    const result = await validateStockAvailability(
      items,
      warehouseName,
      loginUser
    );

    console.log("📥 Stock Validation Response:", result);

    const { outOfStock = [], qtyMap = {} } = result;

    // Log stock availability for each denomination
    items.forEach((item) => {
      const availableQty = qtyMap[item.item_code] ?? 0;

      console.log(
        `📦 ${item.item_code}: Requested ${item.requested_qty}, Available ${availableQty}`
      );
    });

    // If any item is out of stock, block submission
    if (outOfStock.length > 0) {
      console.warn("❌ Out of Stock Items:", outOfStock);

      setStockError(
        `Insufficient stock available in ${warehouseName} for: ${outOfStock.join(
          ", "
        )}`
      );

      return false;
    }

    // Success
    console.log("✅ All selected denominations have sufficient stock.");
    setStockError("");
    return true;
  } catch (err) {
    console.error("❌ Stock validation failed:", err);

    setStockError(
      err.message || "Unable to validate stock. Please try again."
    );

    return false;
  } finally {
    setStockLoading(false);
  }
};
const usableFields = metaFields.filter(
  (f) =>
    !f.hidden &&
    !["Section Break", "Column Break"].includes(f.fieldtype)
);

const orderedFields = React.useMemo(() => {
  const getParentFieldname = (field) => {
    if (!field.depends_on) return null;
    const condition = field.depends_on.replace("eval:", "");
    const matches = [...condition.matchAll(/doc\.([a-zA-Z0-9_]+)/g)];
    const parents = matches.map((m) => m[1]).filter((name) => name && name !== field.fieldname);
    return parents.length ? parents[0] : null;
  };

  const dependents = new Map();
  const roots = [];

  usableFields.forEach((field) => {
    const parent = getParentFieldname(field);
    if (parent) {
      dependents.set(parent, [...(dependents.get(parent) || []), field]);
    } else {
      roots.push(field);
    }
  });

  const sorted = [];
  const visited = new Set();

  const addFieldWithDependents = (field) => {
    if (visited.has(field.fieldname)) return;
    visited.add(field.fieldname);
    sorted.push(field);
    const children = dependents.get(field.fieldname) || [];
    children.forEach(addFieldWithDependents);
  };

  usableFields.forEach((field) => {
    if (!visited.has(field.fieldname) && !getParentFieldname(field)) {
      addFieldWithDependents(field);
    }
  });

  usableFields.forEach((field) => {
    if (!visited.has(field.fieldname)) {
      addFieldWithDependents(field);
    }
  });

  return sorted;
}, [usableFields]);

  const inputStyle =
  "w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E00000] focus:bg-white transition-all duration-200";
  
  const labelStyle =
    "text-xs uppercase font-bold text-gray-400 mb-2 block";

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  useEffect(() => {
  const fetchMeta = async () => {
  try {
    const baseURL = getBaseURL(ERP_ENV.DEMO);
    // const headers = getHeaders(loginUser.api_key, loginUser.api_secret);
    const headers = getHeaders(loginUser, ERP_ENV.PROD);

    const url = `${baseURL}/api/resource/DocType/${encodeURIComponent("Money Transfer")}`;

    console.log("🔥 Fetching URL:", url);
    console.log("🔥 Headers:", headers);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...headers,
        Accept: "application/json",
      },
    });

    const data = await res.json();

    console.log("🔥 FULL RESPONSE STATUS:", res.status);
    console.log("🔥 FULL DOCTYPE RESPONSE:", data);

    if (!res.ok) {
      console.error("❌ Meta fetch failed:", data);
      return;
    }

    if (!data?.data?.fields) {
      console.error("❌ Invalid meta response:", data);
      return;
    }

    setMetaFields(data.data.fields);

    console.log("✅ FIELDS:", data.data.fields);
  } catch (err) {
    console.error("❌ Meta fetch error:", err);
  }
};

  fetchMeta();
}, [loginUser]);



useEffect(() => {
  const amount = parseFloat(form.amount || 0);
  const fee = parseFloat(form.transfer_fee || 0);

  setForm(prev => ({
    ...prev,
    total_amount: amount + fee
  }));
}, [form.amount, form.transfer_fee]);

const getOptions = (fieldname) => {
  const field = metaFields.find(f => f.fieldname === fieldname);
  if (!field || !field.options) return [];

  return field.options.split("\n").map(opt => ({
    label: opt,
    value: opt,
  }));
};

useEffect(() => {
  const enabled =
    form.enable_currency_denomination === 1 ||
    form.enable_currency_denomination === "1" ||
    form.enable_currency_denomination === true;

  if (!enabled && form.amount) {
    setForm((prev) => ({
      ...prev,
      amount: "",
    }));
  }
}, [form.enable_currency_denomination]);

const formatLocalDate = (date) => {
  if (!date) return "";

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
};

const formatDate = (date) => {
  if (!date) return null;

  const d = new Date(date);

  if (isNaN(d.getTime())) {
    console.error("❌ Invalid date:", date);
    return null;
  }

  return d.toISOString().split("T")[0];
};
useEffect(() => {
  const fetchCustomer = async () => {
    if (!form.full_name || !form.dob) return;

    const formattedDate = formatDate(form.dob);
    if (!formattedDate) return;

    const cleanName = form.full_name.trim().replace(/\s+/g, " ");
    const customerId = `${cleanName}_${formattedDate}`;

    console.log("Searching customer:", customerId);

    try {
      const customer = await getCustomerById(customerId, loginUser);

      if (customer) {
        console.log("Customer Auto-filled:", customer);

       setForm((prev) => ({
  ...prev,
  full_name: customer.custom_full_name || customer.full_name || prev.full_name,
  custom_full_name: customer.custom_full_name || customer.full_name || "",
  dob: customer.custom_date_of_birth || customer.dob || prev.dob,
  custom_date_of_birth: customer.custom_date_of_birth || customer.dob || "",
  passport_number: customer.custom_passport_number || customer.passport_number || "",
  custom_passport_number: customer.custom_passport_number || customer.passport_number || "",
  document_upload:
    customer.custom_government_document || customer.document_upload || "",
  custom_government_document: customer.custom_government_document || "",

  // government_id_type: customer.custom_government_id || customer.government_id_type || "",
  custom_government_id: customer.custom_government_id || customer.government_id_type || "",

  government_id_type:
  customer.custom_government_id ||
  customer.government_id_type ||
  "",

government_id_number:
  customer.custom_passport_number ||
  customer.custom_drivers_licence_number ||
  customer.custom_tin_number ||
  customer.custom_voter_id_number ||
  prev.government_id_number ||
  "",

  
  customer: customer.name || "",
}));
      } else {
        console.log("Customer not found");
      }
    } catch (err) {
      console.error("Customer fetch error:", err);
    }
  };

  const delay = setTimeout(fetchCustomer, 500);
  return () => clearTimeout(delay);
}, [form.full_name, form.dob]);

// Replace your existing warehouse extraction logic in MoneyTransfer.jsx
// inside runStockCheck() with the following:



const handleSubmit = async () => {
  setIsSubmitting(true);
  setSuccessInfo(null);
  setSubmitError("");

  if (!validateForm()) {
    setIsSubmitting(false);
    return;
  }

  try {
    let documentUrl = "";

    if (form.document_upload instanceof File) {
      documentUrl = await uploadFile(form.document_upload, { isPrivate: 1 });
    }

    console.log("Using loginUser for createCustomer:", loginUser);
    console.log("Currency Denomination Rows:", currencyDenominationRows);

    // If the user disables denomination, make sure rows are cleared before submitting.
    const denominationsEnabled =
      form.enable_currency_denomination === 1 ||
      form.enable_currency_denomination === "1" ||
      form.enable_currency_denomination === true;

    // const rowsToSubmit = denominationsEnabled ? currencyDenominationRows : [];
    const rowsToSubmit = denominationsEnabled ? currencyDenominationRows : [];

// Run stock validation only when denomination is enabled
if (denominationsEnabled && rowsToSubmit.length > 0) {
  const stockOk = await runStockCheck();

  if (!stockOk) {
    setIsSubmitting(false);
    return; // Stop submission if stock is insufficient
  }
}

    // Create / Fetch Customer
    const customer = await createCustomer(form, documentUrl, loginUser);
    const customerId = customer.name;
    const customerFullName = customer.custom_full_name;

    // Create Transaction
    const transfer = await createMoneyTransfer(
      form,
      customerId,
      loginUser,
      documentUrl,
      rowsToSubmit,
      selectedWarehouse
    );

    // success info
    setSuccessInfo({
      customer: customerId,
      customerFullName,
      transaction: transfer.name,
      amount: Number(form.amount || 0),
      transfer,
      message:
        form.enable_currency_denomination === 1 ||
        form.enable_currency_denomination === "1" ||
        form.enable_currency_denomination === true
          ? `Your transfer of ${Number(form.amount || 0)} has been securely processed. Your transaction ${transfer.name} is confirmed.`
          : `Your transaction ${transfer.name} has been securely processed and confirmed.`,
    });

    resetForm();
    setCurrencyDenominationRows([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error(err);
    setSubmitError(err.message || "Error processing transfer. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};

useEffect(() => {
  const denominationsEnabled =
    form.enable_currency_denomination === 1 ||
    form.enable_currency_denomination === "1" ||
    form.enable_currency_denomination === true;

  if (!denominationsEnabled && currencyDenominationRows.length > 0) {
    setCurrencyDenominationRows([]);
  }
}, [form.enable_currency_denomination]);

const shouldShowField = (field) => {
  if (!field.depends_on) return true;

  try {
    const condition = field.depends_on.replace("eval:", "");
    const fn = new Function("doc", `return ${condition}`);
    return fn(form);
  } catch (e) {
    console.warn("depends_on error:", field.fieldname);
    return true;
  }
};

const resetForm = () => {
  setForm({});
  setFieldErrors({});
  setSubmitError("");
};

const buildMoneyTransferInvoiceData = (transfer) => {
  if (!transfer) return null;

  const amount = Number(transfer.amount || 0);
  const rows = Array.isArray(transfer.currency_denomination)
    ? transfer.currency_denomination.map((row, idx) => ({
        item_code: row.denomination || row.item_name || `Denomination ${idx + 1}`,
        qty: Number(row.qty || 0),
        rate:
          Number(row.qty || 0) > 0
            ? Number(row.amount || 0) / Number(row.qty || 0)
            : Number(row.amount || 0),
        amount: Number(row.amount || 0),
      }))
    : [];

  return {
    ...transfer,
    company: transfer.company || "MoneyGram",
    currency: transfer.currency || "FJD",
    customer_name: transfer.full_name || transfer.customer_name || transfer.customer_id,
    customer: transfer.customer_id || transfer.customer || "",
    name: transfer.name || transfer.transaction_id || "",
    posting_date:
      transfer.posting_date || transfer.modified || transfer.creation || new Date().toISOString().split("T")[0],
    posting_time: transfer.posting_time || transfer.modified_time || "",
    net_total: amount,
    grand_total: amount,
    rounded_total: amount,
    total_taxes_and_charges: Number(transfer.total_taxes_and_charges || 0),
    items: rows,
  };
};

const handlePrintInvoice = (transfer) => {
  if (!transfer) {
    setSubmitError("Cannot print invoice: transfer data is unavailable.");
    return;
  }

  const printData = buildMoneyTransferInvoiceData(transfer);
  const hidden = document.getElementById("invoice-print-area");

  if (!hidden) {
    setSubmitError("Print template is not ready yet. Please try again.");
    return;
  }

  const invoiceHTML = hidden.innerHTML;
  const printWindow = window.open("", "_blank", "width=900,height=700");

  if (!printWindow) {
    setSubmitError("Unable to open print window. Please allow pop-ups.");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice - ${printData.name}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { margin: 0; padding: 0; background: #fff; }
          .print-hidden { display: none; }
        </style>
      </head>
      <body>
        ${invoiceHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
};

const validateForm = () => {
  const errors = {};

  usableFields.forEach((field) => {
    if (!field.reqd || !shouldShowField(field)) return;

    const value = form[field.fieldname];
    const isEmpty =
      value === undefined ||
      value === null ||
      value === "" ||
      (field.fieldtype === "Attach" && !value);

    if (isEmpty) {
      errors[field.fieldname] = `${field.label || field.fieldname} is required.`;
      return;
    }

    if (field.fieldname === "amount") {
      const amount = Number(value);
      if (Number.isNaN(amount) || amount <= 0) {
        errors[field.fieldname] = "Amount must be greater than zero.";
      }
    }

    if (field.fieldtype === "Date" && !formatDate(value)) {
      errors[field.fieldname] = `${field.label || "Date"} is required.`;
    }
  });

  const denominationsEnabled =
    form.enable_currency_denomination === 1 ||
    form.enable_currency_denomination === "1" ||
    form.enable_currency_denomination === true;

  if (denominationsEnabled && currencyDenominationRows.length === 0) {
    errors.currency_denomination =
      "Please enter at least one currency denomination row or disable denomination.";
  }

  setFieldErrors(errors);
  setSubmitError(
    Object.keys(errors).length
      ? "Please complete the highlighted required fields before saving."
      : ""
  );

  return Object.keys(errors).length === 0;
};

/**
 * Render field label with red mandatory asterisk
 */
const renderLabel = (field) => (
  <label className={labelStyle}>
    {field.label}
    {field.reqd ? (
      <span className="text-red-500 ml-1">*</span>
    ) : null}
  </label>
);

const renderFieldError = (fieldname) =>
  fieldErrors[fieldname] ? (
    <p className="mt-2 text-sm text-red-600">{fieldErrors[fieldname]}</p>
  ) : null;

const renderField = (field) => {
  if (!shouldShowField(field)) return null;

  const commonProps = {
    className: inputStyle,
    value: form[field.fieldname] || "",
    onChange: (e) =>
      handleChange(field.fieldname, e.target.value),
  };

  switch (field.fieldtype) {
    case "Data":
      return (
        <div key={field.fieldname}>
          {renderLabel(field)}
          <input {...commonProps} />
          {renderFieldError(field.fieldname)}
        </div>
      );

    case "Check":
      return (
        <div key={field.fieldname} className="col-span-2 flex items-center gap-3 py-1">
          <input
            id={field.fieldname}
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-[#E00000] focus:ring-[#E00000]"
            checked={
              form[field.fieldname] === 1 ||
              form[field.fieldname] === "1" ||
              form[field.fieldname] === true
            }
            onChange={(e) =>
              handleChange(field.fieldname, e.target.checked ? 1 : 0)
            }
          />
          <label htmlFor={field.fieldname} className="text-sm font-semibold text-gray-700">
            {field.label}
          </label>
        </div>
      );

    case "Date":
  return (
    <div key={field.fieldname}>
      {renderLabel(field)}
      <DatePicker
        selected={
          form[field.fieldname]
            ? new Date(form[field.fieldname])
            : null
        }
        onChange={(date) =>
          handleChange(field.fieldname, formatLocalDate(date))
        }
        className={inputStyle}
        dateFormat="yyyy-MM-dd"

        // ✅ KEY FIXES
        showYearDropdown
        showMonthDropdown
        dropdownMode="select"

        // ✅ Open to past (DOB friendly)
        maxDate={new Date()} // no future dates
        yearDropdownItemNumber={100} // last 100 years
        scrollableYearDropdown

        // ✅ Optional: open calendar around 2000 instead of today
        openToDate={new Date(2000, 0, 1)}
      />
      {renderFieldError(field.fieldname)}
    </div>
  );

    case "Select":
      const options = field.options?.split("\n") || [];

      return (
        <div key={field.fieldname}>
          {renderLabel(field)}
          <select {...commonProps}>
            <option value="">Select <>
  {field.label}
  {field.reqd ? (
    <span className="text-red-500 ml-1">*</span>
  ) : null}
</></option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {renderFieldError(field.fieldname)}
        </div>
      );

   case "Attach":
  return (
    <div key={field.fieldname}>
      {/* Do NOT render renderLabel(field) here because FileUploadBox
          already displays the label internally. Instead, pass the
          mandatory asterisk directly in the label prop. */}
      <FileUploadBox
        label={
          field.reqd
            ? `${field.label} *`
            : field.label
        }
        file={form[field.fieldname]}
        existingFileUrl={
          typeof form[field.fieldname] === "string"
            ? form[field.fieldname]
            : null
        }
        setFile={(file) =>
          handleChange(field.fieldname, file)
        }
      />

      {renderFieldError(field.fieldname)}
    </div>
  );


    case "Section Break":
      return (
        <div key={field.fieldname} className="col-span-2 mt-6">
          <h3 className="text-lg font-bold text-gray-700">
            {field.label}
          </h3>
        </div>
      );

    default:
      return null;
  }
};



 return (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <Navbar />

    <main className="grow py-10 px-4 sm:px-6 lg:px-12">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
     

        {/* HEADER */}
       <div>
  <h1 className="text-gray-900 text-3xl sm:text-5xl font-black tracking-tight leading-none">
    Money{" "}
    <span className="text-[#E00000] italic">
      Transfer
    </span>
  </h1>
{/* 
  <p className="text-xs font-semibold text-gray-400 mt-2">
    Enter customer details to securely send or receive funds
  </p> */}
</div>

        {/* FORM CARD */}
        <div className="rounded-3xl border border-gray-100 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-8 sm:p-10">

          {successInfo && (
            <div className="mb-6 rounded-2xl border border-green-100 bg-linear-to-r from-white to-green-50 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="text-green-600 text-3xl">✓</div>
                <div className="flex-1">
                  <h2 className="text-lg font-extrabold text-gray-800">Transfer Complete</h2>
                  <p className="text-sm text-gray-600 mt-1">{successInfo.message}</p>
                  <p className="mt-3 text-sm text-gray-700">
                    <strong>Customer:</strong> {successInfo.customerFullName} &nbsp;•&nbsp; <strong>Transaction:</strong> {successInfo.transaction}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handlePrintInvoice(successInfo.transfer)}
                    className="rounded-2xl bg-[#E00000] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#c70000]"
                  >
                    Print Invoice
                  </button>
                  <button
                    onClick={() => setSuccessInfo(null)}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {submitError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
  {orderedFields.map((field) => renderField(field))}
</div>

          {/* CURRENCY DENOMINATION PANEL */}
          
{form.enable_currency_denomination === 1 ||
 form.enable_currency_denomination === "1" ||
 form.enable_currency_denomination === true ? (
  <div className="mt-8 col-span-2">
    <div className="mb-4">
      <h3 className="text-lg font-bold text-gray-700">
        Currency Denomination
      </h3>
    </div>

    {baseDenomLoading ? (
      <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        Loading denomination panel...
      </div>
    ) : baseDenomError ? (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-600">
        {baseDenomError}
      </div>
    ) : baseCurrencyData ? (
      <DenominationPanel
        title="Local FJD Denomination"
        subtitle="Enter note counts for Fiji Dollars"
        flag={baseCurrencyData.flag}
        symbol={baseCurrencyData.symbol}
        currency={baseCurrencyData.currency}
        notes={baseCurrencyData.notes}
        coins={baseCurrencyData.coins}
        targetAmount={parseFloat(form.amount || 0)}
        onRowsChange={handleDenominationRowsChange}
        accentColor="#E00000"
      />
    ) : (
      <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        Fiji denomination data is not available.
      </div>
    )}

    {fieldErrors.currency_denomination ? (
      <div className="mt-4 text-sm text-red-600">
        {fieldErrors.currency_denomination}
      </div>
    ) : null}

    {stockError ? (
      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <div className="font-semibold">Stock validation issue</div>
        <p>{stockError}</p>
      </div>
    ) : null}
  </div>
) : null}

          {/* BUTTON */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || stockLoading}
            className={`mt-10 w-full bg-[#E00000] ${isSubmitting || stockLoading ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'} text-white rounded-2xl py-4 font-black transition`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                Processing Transfer...
              </span>
            ) : (
              'Submit Transfer'
            )}
          </button>
        </div>
      </div>

      {/* Hidden print template for Money Transfer invoice */}
      <div className="hidden">
        <InvoiceDocument
          invoiceData={
            successInfo?.transfer
              ? buildMoneyTransferInvoiceData(successInfo.transfer)
              : {}
          }
        />
      </div>
    </main>

    <Footer />
  </div>
);
};

export default MoneyTransfer;