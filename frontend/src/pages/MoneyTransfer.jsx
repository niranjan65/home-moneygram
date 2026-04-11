import React, { useState, useEffect } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useERPFileUpload } from "../hooks/useERPFileUpload";
import { useUser } from "../context/UserContext";
import { getCustomerById, createCustomer } from "../features/exchange/api/customer";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, CheckCircle2 } from "lucide-react";
import { createMoneyTransfer } from "../features/exchange/api/createMoneyTransfer";

const MoneyTransfer = () => {
  const { uploadFile } = useERPFileUpload();
  const { user } = useUser();
  const loginUser =  user ;
  const [metaFields, setMetaFields] = useState([]);
  const [transferType, setTransferType] = useState("Send");

  const [form, setForm] = useState({
    full_name: "",
    date_of_birth: "",
    id_type: "",
    government_id: "",
    customer: "",
    passport_number: "",
    id_number: "",
    transaction_id: "",
  });

  const [passportFile, setPassportFile] = useState(null);
  const [govtFile, setGovtFile] = useState(null);

  const inputStyle =
    "w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black transition";

  const labelStyle =
    "text-xs uppercase font-bold text-gray-400 mb-2 block";

  const handleChange = (key, value) => {
  setForm((prev) => {
    let updated = { ...prev, [key]: value };

    if (key === "id_type") {
      if (value === "PASSPORT") {
        updated.government_id = "";
      }
      if (value === "GOVERNMENT_ID") {
        updated.passport_number = "";
      }
    }

    return updated;
  });
};

  useEffect(() => {
  const fetchMeta = async () => {
    try {
      const res = await fetch(
        "http://192.168.101.182:81/api/resource/DocType/Money Transfer for Customer",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `token ab5bd602e5f2950:47a1752c33990d9`,
          },
        }
      );

      if (!res.ok) {
        console.error("Meta fetch failed:", res.status);
        return;
      }

      const data = await res.json();

      if (!data?.data?.fields) {
        console.error("Invalid meta response:", data);
        return;
      }

      setMetaFields(data.data.fields);
      console.log("ERP Fields:", data.data.fields);

    } catch (err) {
      console.error("Meta fetch error", err);
    }
  };

  
    fetchMeta();

}, []);

const getOptions = (fieldname) => {
  const field = metaFields.find(f => f.fieldname === fieldname);
  if (!field || !field.options) return [];

  return field.options.split("\n").map(opt => ({
    label: opt,
    value: opt,
  }));
};

const cleanPayload = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([_, v]) => v !== "" && v !== null && v !== undefined
    )
  );
};

const formatDate = (date) => { if (!date) return null; const dObj = new Date(date); if (isNaN(dObj.getTime())) return null; const y = dObj.getFullYear(); const m = String(dObj.getMonth() + 1).padStart(2, "0"); const d = String(dObj.getDate()).padStart(2, "0"); return `${y}-${m}-${d}`; };

useEffect(() => {
  const fetchCustomer = async () => {
    if (!form.full_name || !form.date_of_birth) return;

    const formattedDate = formatDate(form.date_of_birth);
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
          full_name: customer.custom_full_name || prev.full_name,
          date_of_birth: customer.custom_date_of_birth || prev.date_of_birth,
          government_id: customer.custom_government_id || "",
          passport_number: customer.custom_passport_number || "",
          id_type: customer.custom_passport_number ? "PASSPORT" : "GOVERNMENT_ID",
          id_number:
            customer.custom_drivers_license_number ||
            customer.custom_tin_number ||
            customer.custom_voter_id_number ||
            customer.custom_passport_number ||
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
}, [form.full_name, form.date_of_birth]);
 
const handleSubmit = async () => {
  try {
    const fileToUpload =
      form.id_type === "PASSPORT" ? passportFile : govtFile;

    // ✅ Upload ONCE
    let documentUrl = "";
    if (fileToUpload) {
      documentUrl = await uploadFile(fileToUpload, { isPrivate: 1 });
    }

    // ✅ STEP 1: Create Customer
   const customer = await createCustomer(
  form,
  documentUrl // ✅ PASS DIRECTLY
);

    const customerId = customer.name;

    // ✅ STEP 2: Create Money Transfer
    const transfer = await createMoneyTransfer(
      form,
      customerId,
      transferType,
      loginUser,
      documentUrl // ✅ pass file URL
    );

    alert(`✅ Transfer Successful!
Customer: ${customerId}
Transaction: ${transfer.name}`);

    // reset...
  } catch (err) {
    console.error(err);
    alert(err.message || "Error processing transfer");
  }
};
const shouldShowField = (fieldname) => {
  const field = metaFields.find(f => f.fieldname === fieldname);

  if (!field || !field.depends_on) return true;

  try {
    const condition = field.depends_on.replace("eval:", "");
    const jsCondition = condition.replace(/doc\./g, "form.");
    return eval(jsCondition);
  } catch {
    return true;
  }
};

const getHeading = () => {
  if (transferType === "Send") {
    return {
      title: "Send Money",
      subtitle: "Enter sender details to initiate an outward transfer",
    };
  }

  if (transferType === "Receive") {
    return {
      title: "Receive Money",
      subtitle: "Enter recipient details to process incoming funds",
    };
  }

  return {
    title: "Money Transfer",
    subtitle: "Fill customer details for transfer",
  };
};

const heading = getHeading();

 return (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <Navbar />

    <main className="flex-grow py-10 px-4 sm:px-6 lg:px-12">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
     

        {/* HEADER */}
       <div>
  <h1 className="text-gray-900 text-3xl sm:text-5xl font-black tracking-tight leading-none">
    Money{" "}
    <span className="text-[#E00000] italic">
      Transfer
    </span>
  </h1>

  <p className="text-xs font-semibold text-gray-400 mt-2">
    Enter customer details to securely send or receive funds
  </p>
</div>

        {/* TRANSACTION TYPE CARD */}
<div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
  {/* HEADER */}
  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
    <ArrowLeftRight size={15} className="text-[#E00000]" />
    <div>
      <p className="text-sm font-semibold text-gray-800">Transfer Type</p>
      <p className="text-xs text-gray-400">
        Choose whether you are sending or receiving money
      </p>
    </div>
  </div>

  {/* OPTIONS */}
  <div className="px-5 py-5">
    <div className="grid grid-cols-2 gap-3">

      {/* SEND MONEY */}
      <button
        type="button"
        onClick={() => setTransferType("Send")}
        className={`relative py-4 px-4 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-2
          ${
            transferType === "Send"
              ? "border-[#E00000] bg-[#E00000]/5 text-[#B70000]"
              : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
          }`}
      >
        {transferType === "Send" && (
          <CheckCircle2
            size={13}
            className="absolute top-2.5 right-2.5 text-[#E00000]"
            strokeWidth={2.5}
          />
        )}

        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center
            ${
              transferType === "Send"
                ? "bg-[#E00000] text-white"
                : "bg-gray-100 text-gray-400"
            }`}
        >
          <ArrowUpRight size={17} strokeWidth={1.75} />
        </div>

        <span
          className={
            transferType === "Send"
              ? "text-[#B70000] font-semibold"
              : "text-gray-400"
          }
        >
          Send Money
        </span>
      </button>

      {/* RECEIVE MONEY */}
      <button
        type="button"
        onClick={() => setTransferType("Receive")}
        className={`relative py-4 px-4 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-2
          ${
            transferType === "Receive"
              ? "border-[#E00000] bg-[#E00000]/5 text-[#B70000]"
              : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
          }`}
      >
        {transferType === "Receive" && (
          <CheckCircle2
            size={13}
            className="absolute top-2.5 right-2.5 text-[#E00000]"
            strokeWidth={2.5}
          />
        )}

        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center
            ${
              transferType === "Receive"
                ? "bg-[#E00000] text-white"
                : "bg-gray-100 text-gray-400"
            }`}
        >
          <ArrowDownLeft size={17} strokeWidth={1.75} />
        </div>

        <span
          className={
            transferType === "Receive"
              ? "text-[#B70000] font-semibold"
              : "text-gray-400"
          }
        >
          Receive Money
        </span>
      </button>

    </div>
  </div>
</div>

<div>
  <h1 className="text-gray-900 text-3xl sm:text-5xl font-black tracking-tight leading-none">
    {heading.title.split(" ")[0]}{" "}
    <span className="text-[#E00000] italic">
      {heading.title.split(" ").slice(1).join(" ")}
    </span>
  </h1>

  <p className="text-xs font-semibold text-gray-400 mt-2">
    {heading.subtitle}
  </p>
</div>
        {/* FORM CARD */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-10">

          <div className="grid md:grid-cols-2 gap-10">

            {/* LEFT */}
            <div className="space-y-6">
              <div>
                <label className={labelStyle}>Full Name</label>
                <input
                  className={inputStyle}
                  value={form.full_name}
                  onChange={(e) =>
                    handleChange("full_name", e.target.value)
                  }
                />
              </div>

              <div>
  <label className={labelStyle}>Date of Birth</label>

  <DatePicker
    selected={form.date_of_birth ? new Date(form.date_of_birth) : null}
    onChange={(date) => {
      if (!date) return;

      const today = new Date();

      // ❌ Future date check
      if (date >= today) {
        alert("Date of birth must be in the past");
        return;
      }

      // ❌ Age < 18 check
      const minAgeDate = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
      );

      if (date > minAgeDate) {
        alert("You must be at least 18 years old");
        return;
      }

      // ✅ Format to YYYY-MM-DD (ERP format)
      const formatted = date.toISOString().split("T")[0];

      handleChange("date_of_birth", formatted);
    }}
    dateFormat="yyyy-MM-dd"
    placeholderText="YYYY-MM-DD"
    maxDate={
      new Date(
        new Date().getFullYear() - 18,
        new Date().getMonth(),
        new Date().getDate()
      )
    }
    showMonthDropdown
    showYearDropdown
    dropdownMode="select"
    yearDropdownItemNumber={100}
    scrollableYearDropdown
    className={inputStyle}
  />
</div>

              <div>
                <label className={labelStyle}>ID Type</label>
                <select
                  className={inputStyle}
                  value={form.id_type}
                  onChange={(e) =>
                    handleChange("id_type", e.target.value)
                  }
                >
                  <option value="">Select ID Type</option>
                  {getOptions("id_type").map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {shouldShowField("government_id") && (
                <div>
                  <label className={labelStyle}>Government ID</label>
                  <select
                    className={inputStyle}
                    value={form.government_id}
                    onChange={(e) =>
                      handleChange("government_id", e.target.value)
                    }
                  >
                    <option value="">Select Government ID</option>
                    {getOptions("government_id").map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              
            </div>

            {/* RIGHT */}
            <div className="space-y-6">

              {shouldShowField("passport_number") && (
                <div>
                  <label className={labelStyle}>Passport Number</label>
                  <input
                    className={inputStyle}
                    value={form.passport_number}
                    onChange={(e) =>
                      handleChange("passport_number", e.target.value)
                    }
                  />
                </div>
              )}

              <div>
                <label className={labelStyle}>ID Number</label>
                <input
                  className={inputStyle}
                  value={form.id_number}
                  onChange={(e) =>
                    handleChange("id_number", e.target.value)
                  }
                />
              </div>

              {shouldShowField("passport_photo_scan") && (
                <div>
                  <label className={labelStyle}>Passport Upload</label>
                  <input
                    type="file"
                    onChange={(e) =>
                      setPassportFile(e.target.files[0])
                    }
                  />
                </div>
              )}

              {shouldShowField("government_id_photo_scan") && (
                <div>
                  <label className={labelStyle}>
                    Government ID Upload
                  </label>
                  <input
                    type="file"
                    onChange={(e) =>
                      setGovtFile(e.target.files[0])
                    }
                  />
                </div>
              )}

              <div>
                <label className={labelStyle}>Transaction ID</label>
                <input
                  className={inputStyle}
                  value={form.transaction_id}
                  onChange={(e) =>
                    handleChange("transaction_id", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          {/* BUTTON */}
          <button
            onClick={handleSubmit}
            className="mt-10 w-full bg-[#E00000] hover:opacity-90 text-white rounded-2xl py-4 font-black transition"
          >
            Submit Transfer
          </button>
        </div>
      </div>
    </main>

    <Footer />
  </div>
);
};

export default MoneyTransfer;