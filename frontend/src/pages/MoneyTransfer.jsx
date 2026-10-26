import { sessionFetch as fetch } from "../api/sessionClient.js";
//MoneyTransfer.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { sessionAxios as axios } from "../api/sessionClient.js";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useERPFileUpload } from "../hooks/useERPFileUpload";
import { useUser } from "../context/UserContext";
import { getCustomerById, createCustomer, updateCustomer, fetchNewCustomerId, updateCustomerRiskLevel } from "../features/exchange/api/customer";
import DocumentUploadTable from "../components/DocumentUploadTable";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  CheckCircle2,
  Wallet,
  ChevronDown,
  User,
  Phone,
  Search,
  RefreshCw,
  X,
  Check,
  Hash,
  FileText,
} from "lucide-react";
import { useAppConfiguration } from "../hooks/useAppConfiguration";
import { createMoneyTransfer } from "../features/exchange/api/createMoneyTransfer";
import TransferAmountSection from "../features/exchange/components/TransferAmountSection";
import { DenominationPanel } from "../features/exchange/components/sections/DenominationPanel";
import { MoneyTransferInvoiceDocument } from "../components/MoneyTransferInvoice";
import { CustomerPhotoCard } from "../features/exchange/components/CustomerPhotoCard";
import { useBaseCurrency } from "../hooks/useDenomination";
import { useCountries } from "../hooks/useCountry";
import { buildApiUrl, getFetchOptions } from "../features/exchange/config/erpConfig";
import { useSettings } from "../context/SettingsContext";
import { validateStockAvailability } from "../hooks/useStockValidation";

// ── Fuzzy Customer Autocomplete Input for full_name / phone_number ────────────
function CustomerAutocompleteInput({
  value,
  onChange,
  onSelectCustomer,
  inputStyle,
  disabled,
  loginUser,
  searchField = "name", // "name" | "phone"
  placeholder = "Start typing customer name or select…",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const masterListRef = useRef([]);

  // Sync internal query when value prop changes externally
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Fetch customers from backend API
  const searchCustomers = useCallback(
    async (searchTerm = "") => {
      if (!loginUser?.user) return;
      if (searchField === "phone" && searchTerm) {
        console.log(`📞 [Phone Search API] Querying backend with typed phone: "${searchTerm}"`);
      }
      setLoading(true);
      try {
        const authHeaders = {
        };

        const res = await axios.get(
          "/api/method/moneygram.moneygram.api.get_transactions.get_customers_list",
          {
            params: {
              search: searchTerm.trim() || undefined,
              limit: 25,
            },
            headers: authHeaders,
          }
        );
        let list = res.data?.message ?? [];
        if (!Array.isArray(list)) list = [];

        // Direct search on Customer DocType by mobile_no if searchField is phone
        if (searchField === "phone" && searchTerm.trim()) {
          try {
            const phoneFilters = [
              ["mobile_no", "like", `%${searchTerm.trim()}%`],
              ["customer_group", "not in", ["Warehouse Branch", "Warehouse Vault"]]
            ];
            const directCustRes = await axios.get("/api/resource/Customer", {
              params: {
                filters: JSON.stringify(phoneFilters),
                fields: JSON.stringify([
                  "name",
                  "customer_name",
                  "custom_customer_id",
                  "custom_full_name",
                  "custom_date_of_birth",
                  "mobile_no",
                  "custom_government_id",
                  "custom_passport_number",
                  "custom_drivers_licence_number",
                  "custom_voter_id_number",
                  "custom_tin_number",
                  "image",
                ]),
                limit_page_length: 25,
              },
              headers: authHeaders,
            });
            const directCusts = directCustRes.data?.data ?? [];
            directCusts.forEach((dc) => {
              dc.customer_id = dc.custom_customer_id || dc.name;
              dc.phone_number = dc.mobile_no || "";
              if (!list.some((existing) => existing.name === dc.name)) {
                list.push(dc);
              }
            });
          } catch (e) {
            console.warn("Direct Customer mobile_no search query error:", e);
          }
        }

        // Direct search on Customer DocType by custom_customer_id or name if searchField is id
        if (searchField === "id" && searchTerm.trim()) {
          try {
            const idTerm = searchTerm.trim();
            const directCustRes = await axios.get("/api/resource/Customer", {
              params: {
                filters: JSON.stringify([
                  ["customer_group", "not in", ["Warehouse Branch", "Warehouse Vault"]],
                ]),
                or_filters: JSON.stringify([
                  ["custom_customer_id", "like", `%${idTerm}%`],
                  ["name", "like", `%${idTerm}%`],
                ]),
                fields: JSON.stringify([
                  "name",
                  "customer_name",
                  "custom_customer_id",
                  "custom_full_name",
                  "custom_date_of_birth",
                  "mobile_no",
                  "custom_government_id",
                  "custom_passport_number",
                  "custom_drivers_licence_number",
                  "custom_voter_id_number",
                  "custom_tin_number",
                  "image",
                  "custom_risk_level",
                ]),
                limit_page_length: 25,
              },
              headers: authHeaders,
            });
            const directCusts = directCustRes.data?.data ?? [];
            directCusts.forEach((dc) => {
              dc.customer_id = dc.custom_customer_id || dc.name;
              dc.phone_number = dc.mobile_no || "";
              if (!list.some((existing) => existing.name === dc.name)) {
                list.push(dc);
              }
            });
          } catch (e) {
            console.warn("Direct Customer ID search query error:", e);
          }
        }

        // Check if any returned customers lack mobile_no, and fetch directly from Customer doctype
        const missingPhoneNames = list
          .filter((c) => !c.mobile_no && !c.phone_number)
          .map((c) => c.name);
        if (missingPhoneNames.length > 0) {
          try {
            const custLookupRes = await axios.get("/api/resource/Customer", {
              params: {
                filters: JSON.stringify([["name", "in", missingPhoneNames]]),
                fields: JSON.stringify(["name", "mobile_no"]),
                limit_page_length: missingPhoneNames.length,
              },
              headers: authHeaders,
            });
            const lookupList = custLookupRes.data?.data ?? [];
            const phoneMap = {};
            lookupList.forEach((cd) => {
              if (cd.mobile_no) phoneMap[cd.name] = cd.mobile_no;
            });
            list.forEach((c) => {
              if ((!c.mobile_no || !c.phone_number) && phoneMap[c.name]) {
                c.mobile_no = phoneMap[c.name];
                c.phone_number = phoneMap[c.name];
              }
            });
          } catch (e) {
            console.warn("Could not batch lookup Customer mobile_no:", e);
          }
        }

        if (Array.isArray(list)) {
          if (!searchTerm && list.length > 0) {
            masterListRef.current = list;
          }
          setCustomers(list);
          if (searchField === "phone" && searchTerm) {
            console.log(
              `📥 [Phone Search API Result] Received ${list.length} customer(s):`,
              list.map((c) => ({
                id: c.custom_customer_id || c.name,
                name: c.custom_full_name || c.customer_name || c.name,
                mobile_no: c.mobile_no,
                phone_number: c.phone_number,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Error searching customers:", err);
      } finally {
        setLoading(false);
      }
    },
    [loginUser, searchField]
  );

  // Initial load: fetch at least 10–25 customers
  useEffect(() => {
    searchCustomers("");
  }, [searchCustomers]);

  // Handle typing in input with debounced remote search
  const handleQueryChange = (val) => {
    setQuery(val);
    onChange(val);
    setIsOpen(true);
    setHighlightedIndex(-1);

    if (searchField === "phone") {
      console.log(`⌨️ [Phone Input] Typed Phone Number: "${val}"`);
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchCustomers(val);
    }, 250);
  };

  // Fuzzy match scoring function: higher score = closer match
  const getFuzzyScore = (c, q) => {
    if (!q) return 1;
    const cleanQ = q.trim().toLowerCase();
    const name = (c.custom_full_name || c.customer_name || "").toLowerCase();
    const id = (c.custom_customer_id || c.customer_id || c.name || "").toLowerCase();
    const idNum = (c.id_number || c.custom_passport_number || c.custom_drivers_licence_number || c.custom_voter_id_number || c.custom_tin_number || "").toLowerCase();
    const dob = (c.custom_date_of_birth || c.dob || "").toLowerCase();
    const phone = (c.phone_number || c.mobile_no || c.phone || "").toLowerCase();
    const phoneDigits = phone.replace(/[\s\-\(\)\+]/g, "");
    const cleanDigits = cleanQ.replace(/[\s\-\(\)\+]/g, "");

    // Phone matches
    if (cleanDigits && phoneDigits) {
      if (phoneDigits === cleanDigits) return 100;
      if (phoneDigits.endsWith(cleanDigits)) return 98;
      if (phoneDigits.startsWith(cleanDigits)) return 96;
      if (cleanDigits.endsWith(phoneDigits)) return 94;
      if (phoneDigits.includes(cleanDigits) || cleanDigits.includes(phoneDigits)) return 90;
    }

    if (phone && phone.includes(cleanQ)) return 88;

    if (searchField === "phone") {
      if (id === cleanQ) return 80;
      if (name === cleanQ) return 75;
      if (id.startsWith(cleanQ)) return 70;
      if (name.includes(cleanQ)) return 60;
      return 0;
    }

    if (searchField === "id") {
      if (id === cleanQ) return 100;
      if (id.startsWith(cleanQ)) return 95;
      if (id.endsWith(cleanQ)) return 90;
      if (id.includes(cleanQ)) return 85;
      if (name === cleanQ) return 70;
      if (name.includes(cleanQ)) return 60;
      return 0;
    }

    if (id === cleanQ) return 100;
    if (name === cleanQ) return 95;
    if (idNum === cleanQ) return 90;
    if (id.startsWith(cleanQ)) return 85;
    if (name.startsWith(cleanQ)) return 80;
    if (idNum.startsWith(cleanQ)) return 75;
    if (dob.includes(cleanQ)) return 70;
    if (name.includes(cleanQ)) return 60;
    if (id.includes(cleanQ)) return 55;
    if (idNum.includes(cleanQ)) return 50;

    return 0;
  };

  // Visible customers sorted by highest match score
  const visibleCustomers = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    const source = masterListRef.current.length > 0 ? masterListRef.current : customers;

    if (!q) {
      return source.slice(0, 20);
    }

    if (searchField === "phone") {
      console.log(`🔎 [Phone Match Check] Typed: "${q}" | Evaluating customers in list:`);
      source.forEach((c) => {
        const custPhone = c.mobile_no || c.phone_number || c.phone || "";
        const cleanTyped = q.replace(/[\s\-\(\)\+]/g, "");
        const cleanCust = custPhone.replace(/[\s\-\(\)\+]/g, "");
        const isMatch =
          (cleanTyped && cleanCust && (cleanCust.includes(cleanTyped) || cleanTyped.includes(cleanCust))) ||
          custPhone.toLowerCase().includes(q);
        console.log(
          `   👉 Customer: "${c.custom_full_name || c.customer_name || c.name}" | mobile_no: "${c.mobile_no || "(none)"}" | Match: ${
            isMatch ? "✅ MATCHED" : "❌ NO MATCH"
          }`
        );
      });
    }

    const scored = [];
    const seen = new Set();

    customers.forEach((c) => {
      const cId = c?.custom_customer_id || c?.name;
      if (!cId || seen.has(cId)) return;
      seen.add(cId);
      let score = getFuzzyScore(c, q);
      if (score === 0) {
        // Backend search found this customer for q, ensure it remains visible
        score = 80;
      }
      scored.push({ c, score });
    });

    masterListRef.current.forEach((c) => {
      const cId = c?.custom_customer_id || c?.name;
      if (!cId || seen.has(cId)) return;
      seen.add(cId);
      const score = getFuzzyScore(c, q);
      if (score > 0) scored.push({ c, score });
    });

    scored.sort((a, b) => b.score - a.score);
    const results = scored.map((item) => item.c).slice(0, 20);

    if (searchField === "phone") {
      console.log(`📋 [Matching Customers in Dropdown] (${results.length}):`, results.map((c) => ({
        name: c.custom_full_name || c.customer_name || c.name,
        id: c.custom_customer_id || c.name,
        mobile_no: c.mobile_no,
      })));
    }

    return results;
  }, [customers, query, searchField]);

  const handleSelect = (c) => {
    const chosenVal =
      searchField === "phone"
        ? (c.phone_number || c.mobile_no || c.phone || "")
        : searchField === "id"
        ? (c.custom_customer_id || c.customer_id || c.name || "")
        : (c.custom_full_name || c.customer_name || c.name || "");
    setQuery(chosenVal);
    setIsOpen(false);
    onSelectCustomer(c);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) =>
        prev < visibleCustomers.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : visibleCustomers.length - 1
      );
    } else if (
      e.key === "Enter" &&
      isOpen &&
      highlightedIndex >= 0 &&
      visibleCustomers[highlightedIndex]
    ) {
      e.preventDefault();
      handleSelect(visibleCustomers[highlightedIndex]);
    }
  };

  return (
    <div className="relative w-full min-w-0" ref={containerRef}>
      <input
        type="text"
        name={`search_customer_${searchField}_field`}
        id={`search_customer_${searchField}_input`}
        className={inputStyle}
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="one-time-code"
        data-lpignore="true"
        data-1p-ignore="true"
        data-form-type="other"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        onFocus={() => {
          setIsOpen(true);
          if (customers.length === 0) {
            searchCustomers("");
          }
        }}
        onChange={(e) => handleQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in duration-100">
          <div className="px-3.5 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-gray-500">
              {searchField === "phone" ? (
                <Phone size={12} className="text-[#E00000]" />
              ) : searchField === "id" ? (
                <Hash size={12} className="text-[#E00000]" />
              ) : (
                <User size={12} className="text-[#E00000]" />
              )}
              {searchField === "phone"
                ? "Matching Customers by Phone"
                : searchField === "id"
                ? "Matching Customers by Customer ID"
                : "Matching Customers"}{" "}
              ({visibleCustomers.length})
            </span>
            {loading ? (
              <span className="flex items-center gap-1 text-gray-400 text-[10px]">
                <RefreshCw size={10} className="animate-spin" /> Searching…
              </span>
            ) : (
              <span className="text-[10px] text-gray-400">Select to auto-populate</span>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
            {loading && visibleCustomers.length === 0 ? (
              <div className="px-4 py-5 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                <RefreshCw size={13} className="animate-spin text-gray-400" />
                <span>Searching customer records…</span>
              </div>
            ) : visibleCustomers.length === 0 ? (
              <div className="px-4 py-4 text-center text-xs text-gray-500">
                <p className="font-semibold text-gray-700">No matching customer found</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Try searching by Phone number, Customer ID, Name or ID number
                </p>
              </div>
            ) : (
              visibleCustomers.map((c, idx) => {
                const name = c.custom_full_name || c.customer_name || c.name;
                const cId = c.custom_customer_id || c.customer_id || c.name;
                const idNum = c.id_number || c.custom_passport_number || c.custom_drivers_licence_number || c.custom_voter_id_number || c.custom_tin_number || '';
                const phoneNum = c.phone_number || c.mobile_no || c.phone || c.custom_contact_number || c.contact_number || '';
                const isHighlighted = highlightedIndex === idx;
                return (
                  <div
                    key={c.name}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(c);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3.5 py-2.5 cursor-pointer transition-colors flex items-center justify-between ${
                      isHighlighted
                        ? "bg-red-50 text-[#E00000]"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div
                        className={`text-xs ${
                          isHighlighted ? "font-bold text-[#E00000]" : "font-medium text-gray-800"
                        } truncate flex items-center gap-2`}
                      >
                        {searchField === "id" ? (
                          <>
                            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 bg-red-100 text-[#E00000] rounded">
                              {cId}
                            </span>
                            <span className="font-semibold">{name}</span>
                          </>
                        ) : (
                          <>
                            <span>{name}</span>
                            <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 bg-gray-100 rounded text-gray-700">
                              {cId}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono truncate mt-0.5">
                        {phoneNum ? (
                          <strong className="text-gray-700">📞 {phoneNum}</strong>
                        ) : (
                          <span className="italic text-gray-400">No phone attached</span>
                        )}
                        {c.custom_date_of_birth ? ` • DOB: ${c.custom_date_of_birth}` : ''}
                        {idNum ? ` • ID: ${idNum}` : ''}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-gray-400">
                      <span className={isHighlighted ? "text-[#E00000]" : "text-gray-400"}>
                        Select &rarr;
                      </span>
                    </div>
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

const MoneyTransfer = () => {
  console.log("🚨🚨🚨 NEW MONEY TRANSFER FILE IS RUNNING 🚨🚨🚨");
  const { uploadFile } = useERPFileUpload();
  const loginUser = useUser();
  const { potOptions, loading: potLoading, error: potError } = useAppConfiguration();
  const [metaFields, setMetaFields] = useState([]);
  const [form, setForm] = useState({ transfer_type: "Send", oet_code: "18" });
  const [currencyDenominationRows, setCurrencyDenominationRows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const { data: baseCurrencyData, loading: baseDenomLoading, error: baseDenomError } = useBaseCurrency();
  const { countries: hookCountries, loading: hookCountriesLoading } = useCountries();
  const [linkOptionsMap, setLinkOptionsMap] = useState({});
  const [loadingLinkOptions, setLoadingLinkOptions] = useState({});
  const fetchedDoctypesRef = useRef(new Set());
  const selectedFromDropdownRef = useRef(false);

  // Populate Country options from useCountries hook whenever it resolves
  useEffect(() => {
    if (hookCountries && hookCountries.length > 0) {
      const mapped = hookCountries.map((c) => ({
        value: c.name,
        label: c.country_name || c.name,
      }));
      mapped.sort((a, b) => (a.label || a.value).localeCompare(b.label || b.value));
      fetchedDoctypesRef.current.add("Country");
      setLinkOptionsMap((prev) => {
        if (prev["Country"] && prev["Country"].length > 0) return prev;
        return { ...prev, Country: mapped };
      });
    }
  }, [hookCountries]);

  const fetchLinkOptions = useCallback(
    async (doctype) => {
      if (!doctype) return;
      if (fetchedDoctypesRef.current.has(doctype)) return;
      fetchedDoctypesRef.current.add(doctype);

      try {
        setLoadingLinkOptions((prev) => ({ ...prev, [doctype]: true }));

        const headers = {
          "Content-Type": "application/json",
          ...getFetchOptions().headers,
        };

        const isCountry = doctype.toLowerCase() === "country";
        const url = isCountry
          ? buildApiUrl(
              '/api/resource/Country?fields=["name","country_name"]&limit_page_length=300&order_by=name%20asc'
            )
          : buildApiUrl(
              `/api/resource/${encodeURIComponent(doctype)}?fields=["name"]&limit_page_length=300&order_by=name%20asc`
            );

        const res = await fetch(
          url,
          getFetchOptions({
            method: "GET",
            headers,
          })
        );

        if (res.ok) {
          const json = await res.json();
          const records = json.data || [];
          const mapped = records
            .map((item) => ({
              value: item.name,
              label: item.country_name || item.name,
            }))
            .filter((item) => Boolean(item.value));

          mapped.sort((a, b) =>
            (a.label || a.value).localeCompare(b.label || b.value)
          );

          setLinkOptionsMap((prev) => ({
            ...prev,
            [doctype]: mapped,
          }));
        } else {
          // Fallback if specific fields query failed
          const fallbackRes = await fetch(
            buildApiUrl(`/api/resource/${encodeURIComponent(doctype)}?limit_page_length=300`),
            getFetchOptions({ method: "GET", headers })
          );
          if (fallbackRes.ok) {
            const fallbackJson = await fallbackRes.json();
            const fallbackRecords = fallbackJson.data || [];
            const mapped = fallbackRecords
              .map((item) => ({
                value: item.name,
                label: item.country_name || item.name,
              }))
              .filter((item) => Boolean(item.value));

            mapped.sort((a, b) =>
              (a.label || a.value).localeCompare(b.label || b.value)
            );

            setLinkOptionsMap((prev) => ({
              ...prev,
              [doctype]: mapped,
            }));
          }
        }
      } catch (err) {
        console.error(`Failed to fetch Link options for ${doctype}:`, err);
        fetchedDoctypesRef.current.delete(doctype);
      } finally {
        setLoadingLinkOptions((prev) => ({ ...prev, [doctype]: false }));
      }
    },
    [loginUser]
  );

  // Automatically fetch options for any Link fields present in metaFields
  useEffect(() => {
    if (!metaFields || metaFields.length === 0) return;

    const linkDoctypes = [
      ...new Set(
        metaFields
          .filter(
            (f) =>
              f.fieldtype === "Link" &&
              f.options &&
              !["warehouse", "customer_id", "amended_from"].includes(f.fieldname)
          )
          .map((f) => f.options)
      ),
    ];

    linkDoctypes.forEach((dt) => {
      fetchLinkOptions(dt);
    });
  }, [metaFields, fetchLinkOptions]);

  const [defaultLimits, setDefaultLimits] = useState(null);

  useEffect(() => {
    getDefaultCustomerLimits().then((limits) => {
      if (limits) {
        setDefaultLimits(limits);
        setForm((prev) => ({
          ...prev,
          custom_available_currency_transfer_balance:
            prev.custom_available_currency_transfer_balance || limits.annual_fx_limit || 0,
          custom_annual_fx_and_moneygram_limit:
            prev.custom_annual_fx_and_moneygram_limit || limits.annual_fx_and_moneygram_limit || 0,
          custom_annual_compliance_limit:
            prev.custom_annual_compliance_limit || limits.annual_compliance_limit || 0,
        }));
      }
    });
  }, []);

  // console.log("Current User:", loginUser);
  const settings = useSettings();
  const selectedWarehouse =
    settings?.selectedWarehouse ||
    (settings?.warehouses?.length > 0 ? settings.warehouses[0] : null);

  // Stock validation states
  const [stockError, setStockError] = useState("");
  const [stockLoading, setStockLoading] = useState(false);

  // Denomination balance validation states matching MoneyExchange
  const [denomBalanceError, setDenomBalanceError] = useState("");
  const denomStatusRef = useRef({ total: 0, target: 0 });
  const denomErrorRef = useRef(null);

  const [customerLookupDone, setCustomerLookupDone] = useState(false);
  const [customerFound, setCustomerFound] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerImageFile, setCustomerImageFile] = useState(null);
  const [customerImageUrl, setCustomerImageUrl] = useState("");

  const [isIdSearchMode, setIsIdSearchMode] = useState(false);

  // Auto-generate 6-character unique ID for customer if empty
  useEffect(() => {
    if (!form.customer_id && loginUser?.user && !isIdSearchMode) {
      fetchNewCustomerId(loginUser).then((code) => {
        if (code) {
          setForm((prev) => ({ ...prev, customer_id: code }));
        }
      });
    }
  }, [form.customer_id, loginUser, isIdSearchMode]);

  const handleRegenerateId = async () => {
    const code = await fetchNewCustomerId(loginUser);
    if (code) {
      setForm((prev) => ({ ...prev, customer_id: code }));
    }
  };

  const handleCancelIdSearch = async () => {
    setIsIdSearchMode(false);
    if (!selectedCustomer) {
      const code = await fetchNewCustomerId(loginUser);
      if (code) {
        setForm((prev) => ({ ...prev, customer_id: code }));
      }
    } else {
      const curId =
        selectedCustomer.custom_customer_id ||
        selectedCustomer.customer_id ||
        selectedCustomer.name;
      setForm((prev) => ({ ...prev, customer_id: curId }));
    }
  };

  const handleDenominationRowsChange = useCallback((rows) => {
    const total = (rows || []).reduce(
      (sum, r) => sum + Number(r.denom || 0) * Number(r.count || 0),
      0
    );
    denomStatusRef.current.total = total;

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

    const target = parseFloat(form.amount || 0);
    denomStatusRef.current.target = target;
    const diff = total - target;

    if (Math.abs(diff) < 0.01) {
      setDenomBalanceError("");
      setFieldErrors((prev) => {
        if (!prev.currency_denomination) return prev;
        const next = { ...prev };
        delete next.currency_denomination;
        return next;
      });
    } else if (diff > 0.01) {
      const label = "overage";
      const err = `Currency Denomination has an ${label} of +${diff.toFixed(
        2
      )} (counted ${total.toFixed(2)}, expected ${target.toFixed(
        2
      )}). Denomination must be Balanced to proceed.`;
      setDenomBalanceError(err);
      setFieldErrors((prev) => ({ ...prev, currency_denomination: err }));
    } else if (total > 0 && diff < -0.01) {
      const label = "shortfall";
      const err = `Currency Denomination has a ${label} of -${Math.abs(diff).toFixed(
        2
      )} (counted ${total.toFixed(2)}, expected ${target.toFixed(
        2
      )}). Denomination must be Balanced to proceed.`;
      setDenomBalanceError(err);
      setFieldErrors((prev) => ({ ...prev, currency_denomination: err }));
    } else {
      setDenomBalanceError("");
    }
  }, [form.amount]);

  useEffect(() => {
    console.log("⚙️ Settings Context:", settings);
    console.log("🏬 Selected Warehouse from Context:", settings?.selectedWarehouse);
    console.log(
      "💾 selected_warehouse from localStorage:",
      localStorage.getItem("selected_warehouse")
    );
  }, [settings]);

  useEffect(() => {
    const shouldShow = Boolean(customerLookupDone && customerFound && form?.customer);
    console.log("📊 [CUSTOMER LIMITS VISIBILITY CHECK]:", {
      shouldShowCustomerLimits: shouldShow,
      customerLookupDone,
      customerFound,
      customer: form?.customer || "(none)",
    });
  }, [customerLookupDone, customerFound, form?.customer]);

  const runStockCheck = async () => {
    // -----------------------------------------
    // 0. Skip stock validation if transaction_type / transfer_type is "Send"
    // -----------------------------------------
    const activeTransferType = (
      form.transfer_type ||
      form.transaction_type ||
      "Send"
    ).trim();

    if (activeTransferType.toLowerCase() === "send") {
      console.log("ℹ️ Transaction type is 'Send'. Stock validation skipped.");
      setStockError("");
      return true;
    }

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
        "User is not assigned to any branch location. Please assign a branch in ERPNext before submitting."
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
  const sectionMap = React.useMemo(() => {
    const map = new Map();
    let currentSec = null;
    metaFields.forEach((f) => {
      if (f.fieldtype === "Section Break") {
        currentSec = f;
      } else if (currentSec) {
        map.set(f.fieldname, currentSec);
      }
    });
    return map;
  }, [metaFields]);

  const documentRows = form.documents ?? [
    ...(form.document_upload ? [{ document_type: "ID", attachment: form.document_upload, notes: "" }] : []),
    ...(form.upload_additional_info ? [{ document_type: "Additional Info", attachment: form.upload_additional_info, notes: "" }] : []),
  ];

  const usableFields = React.useMemo(() => {
    let fields = metaFields
      .map((f) => (f.fieldname === "amount" ? { ...f, reqd: 1, depends_on: "" } : f))
      .filter(
        (f) =>
          !f.hidden &&
          f.fieldtype !== "Attach" &&
          f.fieldname !== "documents" &&
          f.fieldname !== "documents_section" &&
          f.fieldtype !== "Column Break" &&
          f.fieldname !== "cash_denomination_section" &&
          f.fieldname !== "currency_denomination" &&
          f.fieldname !== "customer_details_section" &&
          f.fieldname !== "warehouse" &&
          f.fieldname !== "amended_from"
      );

    if (fields.length > 0 && !fields.some((f) => f.fieldname === "oet_code")) {
      const txnIdx = fields.findIndex((f) => f.fieldname === "transaction_id");
      const oetField = {
        fieldname: "oet_code",
        label: "OET Code",
        fieldtype: "Data",
        reqd: 1,
        default: "18",
      };
      if (txnIdx !== -1) {
        fields = [
          ...fields.slice(0, txnIdx + 1),
          oetField,
          ...fields.slice(txnIdx + 1),
        ];
      } else {
        fields = [...fields, oetField];
      }
    }

    return fields.map((f) => ({
      ...f,
      section: sectionMap.get(f.fieldname) || null,
    }));
  }, [metaFields, sectionMap]);

  const orderedFields = React.useMemo(() => {
    const getParentFieldname = (field) => {
      if (field.fieldname === "amount") return null;
      if (field.fieldtype === "Section Break") return null;
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

    const positionOetCode = (list) => {
      const tIdx = list.findIndex((f) => f.fieldname === "transaction_id");
      const oIdx = list.findIndex((f) => f.fieldname === "oet_code");
      if (tIdx !== -1 && oIdx !== -1 && oIdx !== tIdx + 1) {
        const [oetField] = list.splice(oIdx, 1);
        const newTIdx = list.findIndex((f) => f.fieldname === "transaction_id");
        list.splice(newTIdx + 1, 0, oetField);
      }
      return list;
    };

    // Reorder: transfer_type, then amount, and keep check fields (enable_currency_denomination) at the end of all fields
    const transferTypeField = sorted.find((f) => f.fieldname === "transfer_type");
    const amountField = sorted.find((f) => f.fieldname === "amount");
    const checkFields = sorted.filter(
      (f) => f.fieldname === "enable_currency_denomination" || f.fieldtype === "Check"
    );

    let result = [...sorted];

    if (transferTypeField) {
      const anchorIndex = result.findIndex(
        (f) => f.fieldname === "transfer_type" || f.fieldname === "amount"
      );

      const remaining = result.filter(
        (f) =>
          f.fieldname !== "transfer_type" &&
          f.fieldname !== "amount" &&
          !checkFields.some((c) => c.fieldname === f.fieldname)
      );

      // Ensure customer_id comes right before full_name if both present
      const cIdIdx = remaining.findIndex((f) => f.fieldname === "customer_id");
      const fnIdx = remaining.findIndex((f) => f.fieldname === "full_name");
      if (cIdIdx !== -1 && fnIdx !== -1 && cIdIdx > fnIdx) {
        const [cIdField] = remaining.splice(cIdIdx, 1);
        const newFnIdx = remaining.findIndex((f) => f.fieldname === "full_name");
        remaining.splice(newFnIdx, 0, cIdField);
      }

      positionOetCode(remaining);

      const insertAt =
        anchorIndex !== -1 ? Math.min(anchorIndex, remaining.length) : remaining.length;

      const orderedGroup = [transferTypeField];
      if (amountField) orderedGroup.push(amountField);

      remaining.splice(insertAt, 0, ...orderedGroup);
      remaining.push(...checkFields);
      return remaining;
    } else if (checkFields.length > 0) {
      const remaining = result.filter(
        (f) => !checkFields.some((c) => c.fieldname === f.fieldname)
      );

      const cIdIdx = remaining.findIndex((f) => f.fieldname === "customer_id");
      const fnIdx = remaining.findIndex((f) => f.fieldname === "full_name");
      if (cIdIdx !== -1 && fnIdx !== -1 && cIdIdx > fnIdx) {
        const [cIdField] = remaining.splice(cIdIdx, 1);
        const newFnIdx = remaining.findIndex((f) => f.fieldname === "full_name");
        remaining.splice(newFnIdx, 0, cIdField);
      }

      positionOetCode(remaining);

      remaining.push(...checkFields);
      return remaining;
    }

    return positionOetCode(sorted);
  }, [usableFields]);

  const inputStyle =
    "w-full min-w-0 box-border bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E00000] focus:bg-white transition-all duration-200";

  const getInputStyle = (fieldname, extra = "") => {
    const hasError = Boolean(fieldErrors && fieldErrors[fieldname]);
    const errorClasses = hasError
      ? "border-red-400 bg-red-50/20 ring-1 ring-red-400 focus:ring-red-500"
      : "border-gray-100 focus:ring-[#E00000]";
    return `${inputStyle} ${errorClasses} ${extra}`.trim();
  };

  const labelStyle =
    "text-xs uppercase font-bold text-gray-400 mb-2 block";

  const handleChange = (key, value) => {
    // Clear error for this field if user modifies it
    setFieldErrors((prev) => {
      if (!prev || !prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

    if (key === "full_name") {
      selectedFromDropdownRef.current = false;
      setCustomerFound(false);
      setForm((prev) => ({
        ...prev,
        customer: "",
        [key]: value,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [key]: value,
      }));
    }

    if (
      (key === "transfer_type" || key === "transaction_type") &&
      String(value).trim().toLowerCase() === "send"
    ) {
      setStockError("");
    }

    if (key === "amount") {
      const target = parseFloat(value || 0);
      denomStatusRef.current.target = target;
      const total = denomStatusRef.current.total || 0;
      if (total > 0) {
        const diff = total - target;
        if (Math.abs(diff) < 0.01) {
          setDenomBalanceError("");
          setFieldErrors((prev) => {
            if (!prev.currency_denomination) return prev;
            const next = { ...prev };
            delete next.currency_denomination;
            return next;
          });
        } else if (diff > 0.01) {
          const err = `Currency Denomination has an overage of +${diff.toFixed(
            2
          )} (counted ${total.toFixed(2)}, expected ${target.toFixed(
            2
          )}). Denomination must be Balanced to proceed.`;
          setDenomBalanceError(err);
          setFieldErrors((prev) => ({ ...prev, currency_denomination: err }));
        } else {
          const err = `Currency Denomination has a shortfall of -${Math.abs(diff).toFixed(
            2
          )} (counted ${total.toFixed(2)}, expected ${target.toFixed(
            2
          )}). Denomination must be Balanced to proceed.`;
          setDenomBalanceError(err);
          setFieldErrors((prev) => ({ ...prev, currency_denomination: err }));
        }
      }
    }

    if (key === "enable_currency_denomination" && !value) {
      setDenomBalanceError("");
      setFieldErrors((prev) => {
        if (!prev.currency_denomination) return prev;
        const next = { ...prev };
        delete next.currency_denomination;
        return next;
      });
    }

    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  useEffect(() => {
    const fetchMeta = async () => {
      if (!loginUser?.user?.sessionActive) return;

      try {
        const url = buildApiUrl(
          `api/resource/DocType/${encodeURIComponent("Money Transfer")}`
        );

        console.log("🔥 Fetching Money Transfer DocType URL:", url);

        const res = await fetch(
          url,
          getFetchOptions({
            method: "GET",
          })
        );

        const data = await res.json().catch(() => ({}));

        console.log("🔥 FULL RESPONSE STATUS:", res.status);
        console.log("🔥 FULL DOCTYPE RESPONSE:", data);

        if (!res.ok) {
          const message =
            res.status === 401
              ? "Your ERPNext login session is not active. Please log in again."
              : data?.exception || data?.message || "Unable to load Money Transfer fields.";

          setSubmitError(message);
          console.error("❌ Meta fetch failed:", data);
          return;
        }

        if (!data?.data?.fields) {
          setSubmitError("Money Transfer DocType metadata response is invalid.");
          console.error("❌ Invalid meta response:", data);
          return;
        }

        const fields = (data.data.fields || []).map((f) =>
          f.fieldname === "amount" ? { ...f, reqd: 1, depends_on: "" } : f
        );
        setMetaFields(fields);
        setSubmitError("");

        const transferField = fields.find((f) => f.fieldname === "transfer_type");
        const defaultType =
          transferField?.options
            ?.split("\n")
            .map((s) => s.trim())
            .filter(Boolean)[0] || "Send";

        const riskField = fields.find((f) => f.fieldname === "risk_level");
        const defaultRisk =
          riskField?.options
            ?.split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
            .find((o) => o === "Low") || "Low";

        setForm((prev) => ({
          transfer_type: prev.transfer_type || defaultType,
          risk_level: prev.risk_level || defaultRisk,
          ...prev,
          oet_code: prev.oet_code || "18",
        }));

        console.log("✅ FIELDS:", data.data.fields);
      } catch (err) {
        setSubmitError(err.message || "Unable to load Money Transfer fields.");
        console.error("❌ Meta fetch error:", err);
      }
    };

    fetchMeta();
  }, [loginUser?.user?.sessionActive]);

  useEffect(() => {
    const transferField = metaFields.find((f) => f.fieldname === "transfer_type");
    const defaultType =
      transferField?.options
        ?.split("\n")
        .map((s) => s.trim())
        .filter(Boolean)[0] || "Send";

    if (!form.transfer_type) {
      setForm((prev) => ({
        ...prev,
        transfer_type: defaultType,
      }));
    }
  }, [metaFields, form.transfer_type]);



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
  // useEffect(() => {
  //   const fetchCustomer = async () => {
  //     if (!form.full_name || !form.dob) return;

  //     const formattedDate = formatDate(form.dob);
  //     if (!formattedDate) return;

  //     const cleanName = form.full_name.trim().replace(/\s+/g, " ");
  //     const customerId = `${cleanName}_${formattedDate}`;

  //     console.log("Searching customer:", customerId);

  //     try {
  //       const customer = await getCustomerById(customerId, loginUser);

  //       if (customer) {
  //         console.log("Customer Auto-filled:", customer);

  //         setForm((prev) => ({
  //           ...prev,
  //           full_name: customer.custom_full_name || customer.full_name || prev.full_name,
  //           custom_full_name: customer.custom_full_name || customer.full_name || "",
  //           dob: customer.custom_date_of_birth || customer.dob || prev.dob,
  //           custom_date_of_birth: customer.custom_date_of_birth || customer.dob || "",
  //           passport_number: customer.custom_passport_number || customer.passport_number || "",
  //           custom_passport_number: customer.custom_passport_number || customer.passport_number || "",
  //           document_upload:
  //             customer.custom_government_document || customer.document_upload || "",
  //           custom_government_document: customer.custom_government_document || "",

  //           // government_id_type: customer.custom_government_id || customer.government_id_type || "",
  //           custom_government_id: customer.custom_government_id || customer.government_id_type || "",

  //           government_id_type:
  //             customer.custom_government_id ||
  //             customer.government_id_type ||
  //             "",

  //           government_id_number:
  //             customer.custom_passport_number ||
  //             customer.custom_drivers_licence_number ||
  //             customer.custom_tin_number ||
  //             customer.custom_voter_id_number ||
  //             prev.government_id_number ||
  //             "",


  //           customer: customer.name || "",
  //         }));
  //       } else {
  //         console.log("Customer not found");
  //       }
  //     } catch (err) {
  //       console.error("Customer fetch error:", err);
  //     }
  //   };

  //   const delay = setTimeout(fetchCustomer, 500);
  //   return () => clearTimeout(delay);
  // ── Handle customer selected from autocomplete dropdown ───────────────────
  const handleSelectCustomer = async (c) => {
    if (!c) return;
    const nameVal = c.custom_full_name || c.customer_name || c.full_name || c.name || "";
    const custId = c.custom_customer_id || c.customer_id || c.name || "";
    const phoneVal = c.mobile_no || c.phone_number || c.phone || c.custom_contact_number || c.contact_number || "";
    const govIdType = c.custom_government_id || c.government_id_type || "";
    let govIdNumber = "";
    if (govIdType === "Passport") govIdNumber = c.custom_passport_number || "";
    else if (govIdType === "Driver's Licence") govIdNumber = c.custom_drivers_licence_number || "";
    else if (govIdType === "TIN Card") govIdNumber = c.custom_tin_number || "";
    else if (govIdType === "Voter ID Card") govIdNumber = c.custom_voter_id_number || "";
    if (!govIdNumber) {
      govIdNumber = c.custom_passport_number || c.custom_drivers_licence_number || c.custom_tin_number || c.custom_voter_id_number || c.id_number || "";
    }
    const existingImg = c.image || c.custom_image || "";

    selectedFromDropdownRef.current = true;
    setSelectedCustomer(c);
    setCustomerFound(true);
    setCustomerLookupDone(true);
    if (existingImg) {
      setCustomerImageUrl(existingImg);
      setCustomerImageFile(null);
    }

    // Immediately populate all fields from selected customer into form
    setForm((prev) => ({
      ...prev,
      full_name: nameVal,
      custom_full_name: nameVal,
      customer: c.name,
      customer_id: custId,
      phone_number: phoneVal,
      contact_number: phoneVal,
      dob: c.custom_date_of_birth || c.dob || prev.dob || "",
      custom_date_of_birth: c.custom_date_of_birth || c.dob || prev.custom_date_of_birth || "",
      passport_number: c.custom_passport_number || prev.passport_number || "",
      custom_passport_number: c.custom_passport_number || prev.custom_passport_number || "",
      document_upload: c.custom_government_document || prev.document_upload || "",
      custom_government_document: c.custom_government_document || prev.custom_government_document || "",
      custom_government_id: govIdType || prev.custom_government_id || "",
      government_id_type: govIdType || prev.government_id_type || "",
      government_id_number: govIdNumber || prev.government_id_number || "",
      country: c.custom_country || prev.country || "",
      city: c.custom_city || prev.city || "",
      stateprovince: c.custom_id_issue_stateprovince || c.custom_state_province || prev.stateprovince || "",
      email: c.email_id || c.custom_email || prev.email || "",
      occupation: c.custom_occupation || prev.occupation || "",
      tin_number: c.custom_tin_number || prev.tin_number || "",
      id_issue_date: c.custom_id_issue_date || prev.id_issue_date || "",
      id_expiry_date: c.custom_id_expiry_date || prev.id_expiry_date || "",
      id_issue_country: c.custom_id_issue_country || prev.id_issue_country || "",
      id_issue_state: c.custom_id_issue_stateprovince || prev.id_issue_state || "",
      risk_level: c.custom_risk_level || c.risk_level || prev.risk_level || "Low",
      custom_available_currency_transfer_balance: c.custom_available_currency_transfer_balance ?? prev.custom_available_currency_transfer_balance ?? 0,
      custom_annual_fx_and_moneygram_limit: c.custom_annual_fx_and_moneygram_limit ?? prev.custom_annual_fx_and_moneygram_limit ?? 0,
      custom_annual_compliance_limit: c.custom_annual_compliance_limit ?? prev.custom_annual_compliance_limit ?? 0,
    }));

    try {
      const fullResponse = await getCustomerById(c.name, loginUser);
      const customer = fullResponse?.data || fullResponse;

      if (customer?.name) {
        setCustomerFound(true);
        setCustomerLookupDone(true);
        const resolvedId = customer.custom_customer_id || customer.customer_id || customer.name || custId;

        // Fetch existing customer photo if present
        const existingImg = customer.image || customer.custom_image || "";
        setCustomerImageUrl(existingImg);
        setCustomerImageFile(null);

        setForm((prev) => ({
          ...prev,
          customer_id: resolvedId,
          customer: customer.name,
          full_name:
            customer.custom_full_name ||
            customer.customer_name ||
            customer.full_name ||
            nameVal,
          custom_full_name:
            customer.custom_full_name ||
            customer.customer_name ||
            customer.full_name ||
            nameVal,
          dob:
            customer.custom_date_of_birth ||
            customer.dob ||
            prev.dob ||
            "",
          custom_date_of_birth:
            customer.custom_date_of_birth ||
            customer.dob ||
            prev.custom_date_of_birth ||
            "",
          passport_number:
            customer.custom_passport_number ||
            customer.passport_number ||
            prev.passport_number ||
            "",
          custom_passport_number:
            customer.custom_passport_number ||
            customer.passport_number ||
            prev.custom_passport_number ||
            "",
          document_upload:
            customer.custom_government_document ||
            customer.document_upload ||
            prev.document_upload ||
            "",
          custom_government_document:
            customer.custom_government_document ||
            prev.custom_government_document ||
            "",
          custom_government_id:
            customer.custom_government_id ||
            customer.government_id_type ||
            prev.custom_government_id ||
            "",
          government_id_type:
            customer.custom_government_id ||
            customer.government_id_type ||
            prev.government_id_type ||
            "",
          government_id_number:
            customer.custom_passport_number ||
            customer.custom_drivers_licence_number ||
            customer.custom_tin_number ||
            customer.custom_voter_id_number ||
            prev.government_id_number ||
            "",
          customer: customer.name,
          country:
            customer.custom_country ||
            customer.country ||
            prev.country ||
            "",
          address:
            customer.custom_address ||
            customer.address ||
            prev.address ||
            "",
          city:
            customer.custom_city ||
            customer.city ||
            prev.city ||
            "",
          stateprovince:
            customer.custom_state_province ||
            customer.custom_stateprovince ||
            customer.stateprovince ||
            prev.stateprovince ||
            "",
          postal_code:
            customer.custom_postal_code ||
            customer.postal_code ||
            prev.postal_code ||
            "",
          email:
            customer.custom_email ||
            customer.email ||
            prev.email ||
            "",
          contact_number:
            customer.custom_contact_number ||
            customer.contact_number ||
            prev.contact_number ||
            "",
          gender:
            customer.custom_gender ||
            customer.gender ||
            prev.gender ||
            "",
          occupation:
            customer.custom_occupation ||
            customer.occupation ||
            prev.occupation ||
            "",
          phone_number:
            customer.mobile_no ||
            customer.phone_number ||
            customer.phone ||
            customer.custom_contact_number ||
            customer.contact_number ||
            phoneVal ||
            prev.phone_number ||
            "",
          tin_number:
            customer.custom_tin_number ||
            customer.tin_number ||
            prev.tin_number ||
            "",
          id_issue_date:
            customer.custom_id_issue_date ||
            customer.id_issue_date ||
            prev.id_issue_date ||
            "",
          id_expiry_date:
            customer.custom_id_expiry_date ||
            customer.id_expiry_date ||
            prev.id_expiry_date ||
            "",
          risk_level:
            customer.custom_risk_level ||
            customer.risk_level ||
            prev.risk_level ||
            "Low",
          custom_available_currency_transfer_balance:
            customer.custom_available_currency_transfer_balance ?? prev.custom_available_currency_transfer_balance ?? 0,
          custom_annual_fx_and_moneygram_limit:
            customer.custom_annual_fx_and_moneygram_limit ?? prev.custom_annual_fx_and_moneygram_limit ?? 0,
          custom_annual_compliance_limit:
            customer.custom_annual_compliance_limit ?? prev.custom_annual_compliance_limit ?? 0,
        }));
      }
    } catch (err) {
      console.error("Error auto-filling customer from dropdown:", err);
    }
  };

  useEffect(() => {
    const fetchCustomer = async () => {
      if (selectedFromDropdownRef.current) {
        selectedFromDropdownRef.current = false;
        return;
      }

      if (!form.full_name || !form.dob) {
        if (form.customer && form.full_name) {
          return;
        }
        setCustomerLookupDone(false);
        setCustomerFound(false);

        setForm((prev) => ({
          ...prev,
          customer: "",
          custom_available_currency_transfer_balance: "",
          custom_annual_fx_and_moneygram_limit: "",
          custom_annual_compliance_limit: "",
        }));

        return;
      }

      const formattedDate = formatDate(form.dob);
      if (!formattedDate) return;

      const cleanName = form.full_name.trim().replace(/\s+/g, " ");
      const customerId = `${cleanName}_${formattedDate}`;

      console.log("🔎 Searching customer:", customerId);

      try {
        const customerResponse = await getCustomerById(
          customerId,
          loginUser
        );

        console.log("🔥 CUSTOMER RESPONSE:", customerResponse);

        /*
         * This makes the code work whether getCustomerById returns:
         *
         * { name: "...", custom_...: ... }
         *
         * OR
         *
         * { data: { name: "...", custom_...: ... } }
         */
        const customer =
          customerResponse?.data || customerResponse;

        // =====================================================
        // EXISTING CUSTOMER
        // =====================================================
        if (customer?.name) {
          console.log("✅ CUSTOMER FOUND:", customer);

          console.log("💰 LIMITS FROM CUSTOMER:", {
            available:
              customer.custom_available_currency_transfer_balance,
            fx_moneygram:
              customer.custom_annual_fx_and_moneygram_limit,
            compliance:
              customer.custom_annual_compliance_limit,
          });

          setCustomerFound(true);
          setCustomerLookupDone(true);

          // Fetch existing customer photo if present
          const existingImg = customer.image || customer.custom_image || "";
          setCustomerImageUrl(existingImg);
          setCustomerImageFile(null);

          setForm((prev) => ({
            ...prev,

            full_name:
              customer.custom_full_name ||
              customer.full_name ||
              prev.full_name,

            custom_full_name:
              customer.custom_full_name ||
              customer.full_name ||
              "",

            dob:
              customer.custom_date_of_birth ||
              customer.dob ||
              prev.dob,

            custom_date_of_birth:
              customer.custom_date_of_birth ||
              customer.dob ||
              "",

            passport_number:
              customer.custom_passport_number ||
              customer.passport_number ||
              "",

            custom_passport_number:
              customer.custom_passport_number ||
              customer.passport_number ||
              "",

            document_upload:
              customer.custom_government_document ||
              customer.document_upload ||
              "",

            custom_government_document:
              customer.custom_government_document ||
              "",

            custom_government_id:
              customer.custom_government_id ||
              customer.government_id_type ||
              "",

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

            // IMPORTANT
            customer: customer.name,

            phone_number:
              customer.phone_number ||
              customer.custom_contact_number ||
              customer.contact_number ||
              customer.mobile_no ||
              customer.phone ||
              prev.phone_number ||
              "",

            tin_number:
              customer.custom_tin_number ||
              customer.tin_number ||
              prev.tin_number ||
              "",

            occupation:
              customer.custom_occupation ||
              customer.occupation ||
              prev.occupation ||
              "",

            id_issue_date:
              customer.custom_id_issue_date ||
              customer.id_issue_date ||
              prev.id_issue_date ||
              "",

            id_expiry_date:
              customer.custom_id_expiry_date ||
              customer.id_expiry_date ||
              prev.id_expiry_date ||
              "",

            risk_level:
              customer.custom_risk_level ||
              customer.risk_level ||
              prev.risk_level ||
              "Low",

            country:
              customer.custom_country ||
              customer.country ||
              prev.country ||
              "",

            address:
              customer.custom_address ||
              customer.address ||
              prev.address ||
              "",

            city:
              customer.custom_city ||
              customer.city ||
              prev.city ||
              "",

            stateprovince:
              customer.custom_state_province ||
              customer.custom_stateprovince ||
              customer.stateprovince ||
              prev.stateprovince ||
              "",

            postal_code:
              customer.custom_postal_code ||
              customer.postal_code ||
              prev.postal_code ||
              "",

            // ==========================================
            // CUSTOMER LIMITS
            // ==========================================
            custom_available_currency_transfer_balance:
              customer.custom_available_currency_transfer_balance ?? 0,

            custom_annual_fx_and_moneygram_limit:
              customer.custom_annual_fx_and_moneygram_limit ?? 0,

            custom_annual_compliance_limit:
              customer.custom_annual_compliance_limit ?? 0,
          }));

          return;
        }

        // =====================================================
        // NEW CUSTOMER
        // =====================================================
        console.log("ℹ️ Customer not found");

        setCustomerFound(false);
        if (!customerImageFile) {
          setCustomerImageUrl("");
        }

        const limits = await getDefaultCustomerLimits();

        console.log("💰 DEFAULT LIMITS:", limits);

        setForm((prev) => ({
          ...prev,

          customer: "",

          custom_available_currency_transfer_balance:
            limits?.annual_fx_limit ?? 0,

          custom_annual_fx_and_moneygram_limit:
            limits?.annual_fx_and_moneygram_limit ?? 0,

          custom_annual_compliance_limit:
            limits?.annual_compliance_limit ?? 0,
        }));

        setCustomerLookupDone(true);

      } catch (err) {
        console.error("❌ Customer fetch error:", err);

        /*
         * If your getCustomerById throws a 404 instead of
         * returning null, treat that as a new customer.
         */
        try {
          const limits = await getDefaultCustomerLimits();

          console.log(
            "💰 Customer lookup failed/not found. Using defaults:",
            limits
          );

          setCustomerFound(false);

          setForm((prev) => ({
            ...prev,

            customer: "",

            custom_available_currency_transfer_balance:
              limits?.annual_fx_limit ?? 0,

            custom_annual_fx_and_moneygram_limit:
              limits?.annual_fx_and_moneygram_limit ?? 0,

            custom_annual_compliance_limit:
              limits?.annual_compliance_limit ?? 0,
          }));

          setCustomerLookupDone(true);

        } catch (limitErr) {
          console.error(
            "❌ Could not load default limits:",
            limitErr
          );

          setCustomerLookupDone(true);
        }
      }
    };

    const delay = setTimeout(fetchCustomer, 500);

    return () => clearTimeout(delay);
  }, [form.full_name, form.dob]);

  useEffect(() => {
    console.log("🔥 FORM CUSTOMER LIMIT STATE:", {
      customer: form.customer,

      available:
        form.custom_available_currency_transfer_balance,

      fx_moneygram:
        form.custom_annual_fx_and_moneygram_limit,

      compliance:
        form.custom_annual_compliance_limit,
    });
  }, [
    form.customer,
    form.custom_available_currency_transfer_balance,
    form.custom_annual_fx_and_moneygram_limit,
    form.custom_annual_compliance_limit,
  ]);

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

    // Denomination balance check matching MoneyExchange approach: block on overage or shortfall
    const denominationsEnabled =
      form.enable_currency_denomination === 1 ||
      form.enable_currency_denomination === "1" ||
      form.enable_currency_denomination === true;

    if (denominationsEnabled) {
      const targetAmount = parseFloat(form.amount || 0);
      const totalCounted = denomStatusRef.current.total !== undefined
        ? denomStatusRef.current.total
        : currencyDenominationRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
      const diff = totalCounted - targetAmount;

      if (currencyDenominationRows.length === 0 && totalCounted === 0) {
        const msg = "Please enter currency denomination counts or disable denomination.";
        setDenomBalanceError(msg);
        setFieldErrors((prev) => ({ ...prev, currency_denomination: msg }));
        setSubmitError(msg);
        setIsSubmitting(false);
        scrollToErrorField("currency_denomination");
        return;
      }

      if (Math.abs(diff) >= 0.01) {
        const label = diff > 0 ? "overage" : "shortfall";
        const msg = `Currency Denomination has an ${label} of ${diff > 0 ? "+" : ""}${diff.toFixed(
          2
        )} (counted ${totalCounted.toFixed(2)}, expected ${targetAmount.toFixed(
          2
        )}). Denomination must be Balanced to proceed.`;
        setDenomBalanceError(msg);
        setFieldErrors((prev) => ({ ...prev, currency_denomination: msg }));
        setSubmitError(msg);
        setIsSubmitting(false);
        scrollToErrorField("currency_denomination");
        return;
      }
    }

    try {
      const uploadedDocuments = [];
      for (const row of documentRows) {
        const attachment = row.attachment instanceof File
          ? await uploadFile(row.attachment, { isPrivate: 1 })
          : row.attachment;
        if (typeof attachment !== 'string' || !attachment.trim()) throw new Error(`Please go back and reselect the attachment for ${row.document_type}. The selected file was lost after a page refresh.`);
        uploadedDocuments.push({ document_type: row.document_type.trim(), attachment, notes: row.notes || "" });
      }
      const documentUrl = uploadedDocuments.find(row => row.document_type === "ID")?.attachment || "";
      const submissionForm = { ...form, documents: uploadedDocuments, document_upload: documentUrl,
        upload_additional_info: uploadedDocuments.find(row => row.document_type === "Additional Info")?.attachment || "" };

      console.log("Using loginUser for createCustomer:", loginUser);
      console.log("Currency Denomination Rows:", currencyDenominationRows);

      // If the user disables denomination, make sure rows are cleared before submitting.
      const denominationsEnabled =
        form.enable_currency_denomination === 1 ||
        form.enable_currency_denomination === "1" ||
        form.enable_currency_denomination === true;

      // const rowsToSubmit = denominationsEnabled ? currencyDenominationRows : [];
      const rowsToSubmit = denominationsEnabled ? currencyDenominationRows : [];

      // Run stock validation only when denomination is enabled and transaction type is Receive
      const activeTransferType = (
        form.transfer_type ||
        form.transaction_type ||
        "Send"
      ).trim();
      const isReceive = activeTransferType.toLowerCase() === "receive";

      if (denominationsEnabled && rowsToSubmit.length > 0 && isReceive) {
        const stockOk = await runStockCheck();

        if (!stockOk) {
          setIsSubmitting(false);
          return; // Stop submission if stock is insufficient
        }
      } else {
        setStockError("");
      }

      // Upload customer photo if a new file was captured or selected
      let customerUploadedImageUrl = "";
      if (customerImageFile instanceof File) {
        customerUploadedImageUrl = await uploadFile(customerImageFile, {
          isPrivate: 0,
        });
      }

      // Create / Fetch Customer
      let customerId = "";
      let customerFullName = "";

      if (selectedCustomer && (form.customer || form.customer_id)) {
        // Existing customer selected: reuse directly without re-creating
        customerId = form.customer || form.customer_id;
        customerFullName = form.custom_full_name || form.full_name;
        console.log("Reusing existing fetched customer:", customerId);

        // Update customer documents and/or photo if changed
        const updates = {};
        if (documentRows.some(row => row.document_type === "ID" && row.attachment instanceof File) && documentUrl) {
          updates.custom_government_document = documentUrl;
        }
        if (customerImageFile instanceof File && customerUploadedImageUrl) {
          updates.image = customerUploadedImageUrl;
        }
        if (form.phone_number) {
          updates.mobile_no = form.phone_number;
        }
        if (form.risk_level) {
          updates.custom_risk_level = form.risk_level;
        }

        if (Object.keys(updates).length > 0) {
          await updateCustomer(customerId, updates, loginUser).catch((err) => {
            console.warn("Non-critical: could not update customer:", err);
          });
        }
        if (form.risk_level) {
          await updateCustomerRiskLevel(customerId, form.risk_level, loginUser).catch(() => {});
        }
      } else {
        // New customer: createCustomer creates record using 6-character code and image
        const customer = await createCustomer(form, documentUrl, loginUser, customerUploadedImageUrl);
        customerId = customer.name || customer.custom_customer_id || form.customer_id;
        customerFullName = customer.custom_full_name || customer.customer_name || form.full_name;

        const postCreateUpdates = {};
        if (customerUploadedImageUrl) postCreateUpdates.image = customerUploadedImageUrl;
        if (form.phone_number) postCreateUpdates.mobile_no = form.phone_number;
        if (form.risk_level) postCreateUpdates.custom_risk_level = form.risk_level;
        if (Object.keys(postCreateUpdates).length > 0 && customerId) {
          await updateCustomer(customerId, postCreateUpdates, loginUser).catch(() => {});
        }
        if (form.risk_level && customerId) {
          await updateCustomerRiskLevel(customerId, form.risk_level, loginUser).catch(() => {});
        }
      }

      // Create Transaction
      const transfer = await createMoneyTransfer(
        submissionForm,
        customerId,
        loginUser,
        documentUrl,
        rowsToSubmit,
        selectedWarehouse
      );

      const currency =
        transfer.currency ||
        form.currency ||
        baseCurrencyData?.currency ||
        "FJD";

      const formattedAmount = Number(form.amount || transfer.amount || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      const transferWithDetails = {
        ...form,
        ...transfer,
        currency,
        full_name: customerFullName || form.full_name || transfer.full_name,
        customer_name: customerFullName || form.full_name || transfer.customer_name,
        customerFullName,
        transfer_type: form.transfer_type || transfer.transfer_type || "Send",
        transaction_type: form.transfer_type || transfer.transfer_type || "Send",
        enable_currency_denomination: form.enable_currency_denomination,
        currency_denomination:
          currencyDenominationRows.length > 0
            ? currencyDenominationRows
            : transfer.currency_denomination || [],
      };

      // success info
      setSuccessInfo({
        customer: customerId,
        customerFullName,
        transaction: transfer.name,
        amount: Number(form.amount || 0),
        currency,
        transfer: transferWithDetails,
        message: `Your transfer of ${currency} ${formattedAmount} has been securely processed. Your transaction ${transfer.name} is confirmed.`,
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

  const evalDependsOn = (condition, doc) => {
    if (!condition) return true;
    try {
      const expr = condition.replace(/^eval:/, "").trim();
      const fn = new Function("doc", `return ${expr}`);
      return Boolean(fn(doc));
    } catch (err) {
      console.warn("Error evaluating depends_on:", condition, err);
      return true;
    }
  };

  const shouldShowField = (field) => {
    if (field.fieldname === "amount") return true;

    const currentType = (form.transfer_type || form.transaction_type || "Send").trim();
    const normalizedType = currentType.toLowerCase() === "receive" ? "Receive" : "Send";

    const docContext = {
      ...form,
      transfer_type: normalizedType,
      transaction_type: normalizedType,
    };

    // 1. If this field is a Section Break itself
    if (field.fieldtype === "Section Break") {
      if (field.fieldname === "sender_details_section") {
        return normalizedType === "Send" && (field.depends_on ? evalDependsOn(field.depends_on, docContext) : true);
      }
      if (field.fieldname === "receiver_details_section") {
        return normalizedType === "Receive" && (field.depends_on ? evalDependsOn(field.depends_on, docContext) : true);
      }
      if (field.depends_on) {
        return evalDependsOn(field.depends_on, docContext);
      }
      return true;
    }

    // 2. The display depends on the section and not on the individual fields
    const parentSection = field.section || sectionMap.get(field.fieldname);
    if (parentSection) {
      if (parentSection.fieldname === "sender_details_section") {
        if (normalizedType !== "Send") return false;
      }
      if (parentSection.fieldname === "receiver_details_section") {
        if (normalizedType !== "Receive") return false;
      }
      if (parentSection.depends_on) {
        const sectionVisible = evalDependsOn(parentSection.depends_on, docContext);
        if (!sectionVisible) return false;
      }
    }

    // 3. Field's own depends_on (e.g. government_id_number depending on government_id_type)
    if (field.depends_on) {
      return evalDependsOn(field.depends_on, docContext);
    }

    return true;
  };

  const clearCustomerDetails = () => {
    setSelectedCustomer(null);
    setCustomerFound(false);
    setCustomerLookupDone(false);
    setCustomerImageFile(null);
    setCustomerImageUrl("");
    const transferField = metaFields.find((f) => f.fieldname === "transfer_type");
    const defaultType =
      transferField?.options
        ?.split("\n")
        .map((s) => s.trim())
        .filter(Boolean)[0] || "Send";
    const riskField = metaFields.find((f) => f.fieldname === "risk_level");
    const defaultRisk =
      riskField?.options
        ?.split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .find((o) => o === "Low") || "Low";

    setForm((prev) => ({
      ...prev,
      customer: "",
      customer_id: "",
      full_name: "",
      custom_full_name: "",
      phone_number: "",
      dob: "",
      custom_date_of_birth: "",
      passport_number: "",
      custom_passport_number: "",
      document_upload: "",
      custom_government_document: "",
      custom_government_id: "",
      government_id_type: "",
      government_id_number: "",
      country: "",
      address: "",
      city: "",
      stateprovince: "",
      postal_code: "",
      email: "",
      contact_number: "",
      gender: "",
      occupation: "",
      tin_number: "",
      id_issue_date: "",
      id_expiry_date: "",
      id_issue_country: "",
      id_issue_state: "",
      risk_level: defaultRisk,
      custom_available_currency_transfer_balance: 0,
      custom_annual_fx_and_moneygram_limit: 0,
      custom_annual_compliance_limit: 0,
    }));
  };

  const resetForm = () => {
    const transferField = metaFields.find((f) => f.fieldname === "transfer_type");
    const defaultType =
      transferField?.options
        ?.split("\n")
        .map((s) => s.trim())
        .filter(Boolean)[0] || "Send";

    const riskField = metaFields.find((f) => f.fieldname === "risk_level");
    const defaultRisk =
      riskField?.options
        ?.split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .find((o) => o === "Low") || "Low";

    setForm({ transfer_type: defaultType, risk_level: defaultRisk, oet_code: "18" });
    setStockError("");
    setFieldErrors({});
    setSubmitError("");
    setCustomerFound(false);
    setCustomerLookupDone(false);
    setCustomerImageFile(null);
    setCustomerImageUrl("");
    setCurrencyDenominationRows([]);
    denomStatusRef.current = { total: 0, target: 0 };
    setDenomBalanceError("");
  };

  const buildMoneyTransferInvoiceData = (transfer, info = successInfo) => {
    if (!transfer) return null;

    const amount = Number(transfer.amount || info?.amount || form.amount || 0);

    const isDenomEnabled = Boolean(
      transfer.enable_currency_denomination === 1 ||
      transfer.enable_currency_denomination === "1" ||
      transfer.enable_currency_denomination === true ||
      info?.transfer?.enable_currency_denomination === 1 ||
      info?.transfer?.enable_currency_denomination === "1" ||
      info?.transfer?.enable_currency_denomination === true
    );

    const customerName =
      transfer.full_name ||
      info?.customerFullName ||
      transfer.customer_name ||
      transfer.custom_customer_full_name ||
      transfer.custom_full_name ||
      form.full_name ||
      transfer.customer_id ||
      transfer.customer ||
      "—";

    const transferType =
      transfer.transfer_type ||
      transfer.transaction_type ||
      info?.transfer?.transfer_type ||
      info?.transfer?.transaction_type ||
      form.transfer_type ||
      "Send";

    const rawRows =
      transfer.currency_denomination ||
      info?.transfer?.currency_denomination ||
      currencyDenominationRows ||
      [];

    const rows = isDenomEnabled && Array.isArray(rawRows)
      ? rawRows.map((row, idx) => ({
        item_code: row.denomination || row.item_name || `Denomination ${idx + 1}`,
        qty: Number(row.qty || row.quantity || 0),
        rate:
          Number(row.qty || row.quantity || 0) > 0
            ? Number(row.amount || 0) / Number(row.qty || row.quantity || 0)
            : Number(row.amount || 0),
        amount: Number(row.amount || 0),
      }))
      : [];

    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const localTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    const rawTimestamp =
      transfer.posting_date ||
      transfer.modified ||
      transfer.creation ||
      localDate;

    const cleanPostingDate = String(rawTimestamp).includes(" ")
      ? String(rawTimestamp).split(" ")[0]
      : String(rawTimestamp).includes("T")
        ? String(rawTimestamp).split("T")[0]
        : String(rawTimestamp).split(".")[0];

    const cleanPostingTime =
      (transfer.posting_time ? String(transfer.posting_time).split(".")[0] : "") ||
      (transfer.modified_time ? String(transfer.modified_time).split(".")[0] : "") ||
      (String(rawTimestamp).includes(" ")
        ? String(rawTimestamp).split(" ")[1]?.split(".")[0]
        : String(rawTimestamp).includes("T")
          ? String(rawTimestamp).split("T")[1]?.split(".")[0]
          : "") ||
      localTime;

    return {
      ...transfer,
      company: transfer.company || "MH MoneyGram",
      currency: transfer.currency || "FJD",
      customer_name: customerName,
      custom_customer_full_name: customerName,
      custom_full_name: customerName,
      full_name: customerName,
      customer: transfer.customer_id || transfer.customer || info?.customer || "",
      contact_email:
        transfer.contact_email ||
        transfer.email ||
        form.contact_email ||
        form.email ||
        info?.contact_email ||
        info?.email ||
        "",
      contact_mobile:
        transfer.contact_mobile ||
        transfer.phone ||
        transfer.mobile ||
        form.contact_mobile ||
        form.phone ||
        form.mobile ||
        form.mobile_no ||
        info?.contact_mobile ||
        "",
      dob:
        transfer.dob ||
        transfer.custom_date_of_birth ||
        form.dob ||
        form.custom_date_of_birth ||
        info?.dob ||
        "",
      remarks:
        transfer.remarks ||
        transfer.custom_remarks ||
        form.remarks ||
        form.custom_remarks ||
        info?.remarks ||
        "",
      name: transfer.name || transfer.transaction_id || info?.transaction || "",
      transaction_id: transfer.transaction_id || form.transaction_id || "",
      oet_code: transfer.oet_code || form.oet_code || "18",
      transfer_type: transferType,
      transaction_type: transferType,
      enable_currency_denomination: isDenomEnabled ? 1 : 0,
      posting_date: cleanPostingDate,
      posting_time: cleanPostingTime,
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

    const printData = buildMoneyTransferInvoiceData(transfer, successInfo);
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

    const styles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n");
        } catch {
          return "";
        }
      })
      .join("\n");

    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Money Transfer - ${printData?.name || ""}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
        <style>
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: #fff; }
          @page { size: A4; margin: 8mm; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          ${styles}
        </style>
      </head>
      <body>
        <div style="padding: 24px; max-width: 800px; margin: 0 auto;">
          ${invoiceHTML}
        </div>
      </body>
    </html>
  `);

    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const findFirstErrorField = (errors) => {
    if (!errors || Object.keys(errors).length === 0) return null;
    for (const field of orderedFields) {
      if (errors[field.fieldname]) {
        return field.fieldname;
      }
    }
    if (errors.documents) return "documents";
    if (errors.currency_denomination) return "currency_denomination";
    return Object.keys(errors)[0];
  };

  const scrollToErrorField = (fieldname) => {
    if (!fieldname) return;

    setTimeout(() => {
      let el =
        document.getElementById(`field-${fieldname}`) ||
        (fieldname === "oet_code" ? document.getElementById("field-oetCode") : null) ||
        document.querySelector(`[data-fieldname="${fieldname}"]`) ||
        document.querySelector(`[name="${fieldname}"]`);

      if (!el) {
        if (fieldname === "currency_denomination" && denomErrorRef.current) {
          el = denomErrorRef.current;
        } else if (fieldname === "documents") {
          el = document.getElementById("field-documents");
        }
      }

      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });

        // Try focusing the inner interactive control
        const input = el.querySelector(
          "input:not([type=hidden]):not([readonly]):not([disabled]), select:not([disabled]), textarea:not([disabled])"
        );
        if (input && typeof input.focus === "function") {
          try {
            input.focus({ preventScroll: true });
          } catch (_) {}
        }
      }
    }, 80);
  };

  const validateForm = () => {
    const errors = {};
    if (documentRows.some(row => !row.document_type?.trim() || !row.attachment)) {
      errors.documents = "Each document row needs a document type and an uploaded file.";
    }

    usableFields.forEach((field) => {
      if (field.fieldtype === "Section Break" || !field.reqd || !shouldShowField(field)) return;

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

    if (denominationsEnabled) {
      const targetAmount = parseFloat(form.amount || 0);
      const totalCounted = denomStatusRef.current.total !== undefined
        ? denomStatusRef.current.total
        : currencyDenominationRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
      const diff = totalCounted - targetAmount;

      if (currencyDenominationRows.length === 0 && totalCounted === 0) {
        const msg = "Please enter currency denomination counts or disable denomination.";
        errors.currency_denomination = msg;
        setDenomBalanceError(msg);
      } else if (Math.abs(diff) >= 0.01) {
        const label = diff > 0 ? "overage" : "shortfall";
        const msg = `Currency Denomination has an ${label} of ${diff > 0 ? "+" : ""}${diff.toFixed(
          2
        )} (counted ${totalCounted.toFixed(2)}, expected ${targetAmount.toFixed(
          2
        )}). Denomination must be Balanced to proceed.`;
        errors.currency_denomination = msg;
        setDenomBalanceError(msg);
      } else {
        setDenomBalanceError("");
      }
    } else {
      setDenomBalanceError("");
    }

    // Explicitly validate required amount
    const amountVal = form.amount;
    if (
      amountVal === undefined ||
      amountVal === null ||
      amountVal === "" ||
      String(amountVal).trim() === ""
    ) {
      errors.amount = "Amount is required.";
    } else {
      const num = Number(amountVal);
      if (Number.isNaN(num) || num <= 0) {
        errors.amount = "Amount must be greater than zero.";
      }
    }

    if (!form.oet_code || !String(form.oet_code).trim()) {
      errors.oet_code = "OET Code is required.";
    }

    const errorKeys = Object.keys(errors);
    setFieldErrors(errors);

    if (errorKeys.length > 0) {
      const firstField = findFirstErrorField(errors);
      const fieldMeta = usableFields.find((f) => f.fieldname === firstField);
      const fieldLabel =
        fieldMeta?.label ||
        (firstField === "documents"
          ? "Documents"
          : firstField === "currency_denomination"
          ? "Currency Denomination"
          : firstField);

      setSubmitError(`Please fill in the required field: ${fieldLabel}.`);
      scrollToErrorField(firstField);
      return false;
    }

    setSubmitError("");
    return true;
  };

  /**
   * Render field label with red mandatory asterisk
   */
  const renderLabel = (field) => (
    <label className={labelStyle}>
      {field.label}
      {field.reqd || field.fieldname === "amount" ? (
        <span className="text-red-500 ml-1">*</span>
      ) : null}
    </label>
  );

  const renderFieldError = (fieldname) =>
    fieldErrors[fieldname] ? (
      <p className="mt-1.5 text-xs font-semibold text-red-600 flex items-center gap-1">
        <span className="inline-block text-red-500 font-bold">⚠</span>
        {fieldErrors[fieldname]}
      </p>
    ) : null;

  const renderField = (field) => {
    if (!shouldShowField(field)) return null;

    if (field.fieldname === "transfer_type") {
      const rawOptions = field.options
        ? field.options.split("\n").map((opt) => opt.trim()).filter(Boolean)
        : ["Send", "Receive"];

      const selectedValue = form[field.fieldname] || rawOptions[0];

      return (
        <div key={field.fieldname} id={`field-${field.fieldname}`} data-fieldname={field.fieldname} className="col-span-1 md:col-span-2 min-w-0">
          {renderLabel(field)}
          <div className="grid grid-cols-2 gap-3 min-w-0">
            {rawOptions.map((opt) => {
              const active = selectedValue === opt;
              const isSend = opt.toLowerCase().includes("send");
              const Icon = isSend ? ArrowUpRight : ArrowDownLeft;

              return (
                <button
                  key={opt}
                  type="button"
                  disabled={isFormLocked}
                  onClick={() => handleChange(field.fieldname, opt)}
                  className={`relative py-4 px-3 sm:px-4 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-2 cursor-pointer min-w-0 ${active
                      ? "border-[#E00000] bg-[#E00000]/5 text-[#B70000]"
                      : "border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600"
                    }`}
                >
                  {active && (
                    <CheckCircle2
                      size={13}
                      className="absolute top-2.5 right-2.5 text-[#E00000]"
                      strokeWidth={2.5}
                    />
                  )}
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${active
                        ? "bg-[#E00000] text-white"
                        : "bg-gray-100 text-gray-400"
                      }`}
                  >
                    <Icon size={17} strokeWidth={1.75} />
                  </div>
                  <span
                    className={
                      active ? "text-[#B70000] font-semibold" : "text-gray-400"
                    }
                  >
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
          {renderFieldError(field.fieldname)}
        </div>
      );
    }

    if (field.fieldname === "customer_id") {
      return (
        <div key={field.fieldname} id={`field-${field.fieldname}`} data-fieldname={field.fieldname} className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
            <label className="text-xs uppercase font-bold text-gray-400 block shrink-0">
              {isIdSearchMode ? "Search Customer ID" : "Customer ID"}{" "}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {isIdSearchMode ? (
                <button
                  type="button"
                  onClick={handleCancelIdSearch}
                  className="text-[11px] text-gray-500 hover:text-red-600 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  title="Cancel search and return to auto-generated ID"
                >
                  <X size={11} /> Cancel Search
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsIdSearchMode(true);
                      if (!selectedCustomer) {
                        setForm((prev) => ({ ...prev, customer_id: "" }));
                      }
                    }}
                    className="text-[11px] text-gray-500 hover:text-[#E00000] flex items-center gap-1 font-medium transition-colors cursor-pointer"
                    title="Search customer by entering Customer ID"
                  >
                    <Search size={11} /> Search by ID
                  </button>
                </>
              )}
            </div>
          </div>
          {isIdSearchMode ? (
            <div className="relative min-w-0">
              <CustomerAutocompleteInput
                value={form.customer_id || ""}
                onChange={(val) => {
                  handleChange("customer_id", val);
                  if (!val || !val.trim()) {
                    clearCustomerDetails();
                  } else if (
                    selectedCustomer &&
                    val !==
                      (selectedCustomer.custom_customer_id ||
                        selectedCustomer.customer_id ||
                        selectedCustomer.name)
                  ) {
                    setSelectedCustomer(null);
                    setCustomerFound(false);
                    setForm((prev) => ({ ...prev, customer: "" }));
                  }
                }}
                onSelectCustomer={(c) => {
                  handleSelectCustomer(c);
                  setIsIdSearchMode(false);
                }}
                inputStyle={`${getInputStyle("customer_id")} font-mono font-bold tracking-wider`}
                disabled={isFormLocked}
                loginUser={loginUser}
                searchField="id"
                placeholder="Type Customer ID to search (e.g. CUST-... or 6-char ID)..."
              />
            </div>
          ) : (
            <div className="relative min-w-0">
              <input
                type="text"
                readOnly
                placeholder="Auto-generating 6-character ID..."
                value={form.customer_id || ""}
                className={`${getInputStyle("customer_id")} font-mono font-bold tracking-widest text-sm bg-gray-50 ${
                  form.customer_id
                    ? "text-[#E00000] border-gray-300"
                    : "text-gray-400 border-gray-200"
                }`}
              />
            </div>
          )}
          {renderFieldError("customer_id")}
        </div>
      );
    }

    if (field.fieldname === "oet_code") {
      return (
        <div key={field.fieldname} id={`field-${field.fieldname}`} data-fieldname={field.fieldname} className="min-w-0">
          {renderLabel(field)}
          {potError ? (
            <p className="text-[#E00000] text-sm font-medium mt-1">Failed to load OET codes</p>
          ) : potLoading ? (
            <div className="h-12 rounded-lg animate-pulse bg-gray-100 mt-1" />
          ) : (
            <div className="relative min-w-0">
              <select
                className={`${getInputStyle("oet_code")} appearance-none pr-10`}
                value={form.oet_code ?? "18"}
                disabled={isFormLocked}
                onChange={(e) => handleChange("oet_code", e.target.value)}
              >
                <option value="" disabled>Select OET Code</option>
                {potOptions.map((pot) => (
                  <option key={pot.code} value={pot.code}>
                    {pot.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <ChevronDown size={16} />
              </div>
            </div>
          )}
          {renderFieldError(field.fieldname)}
        </div>
      );
    }

    const commonProps = {
      className: getInputStyle(field.fieldname),
      value: form[field.fieldname] || "",
      onChange: (e) =>
        handleChange(field.fieldname, e.target.value),
    };

    switch (field.fieldtype) {
      case "Data":
        const isAmount = field.fieldname === "amount";
        const isFullName = field.fieldname === "full_name";
        const isPhoneNumber = field.fieldname === "phone_number";

        if (isFullName) {
          return (
            <div key={field.fieldname} id={`field-${field.fieldname}`} data-fieldname={field.fieldname} className="min-w-0">
              {renderLabel(field)}
              <CustomerAutocompleteInput
                value={form[field.fieldname] || ""}
                onChange={(val) => {
                  handleChange(field.fieldname, val);
                  if (!val || !val.trim()) {
                    clearCustomerDetails();
                  } else if (selectedCustomer && val !== (selectedCustomer.custom_full_name || selectedCustomer.customer_name || selectedCustomer.full_name)) {
                    setSelectedCustomer(null);
                    setCustomerFound(false);
                    setForm((prev) => ({ ...prev, customer: "" }));
                  }
                }}
                onSelectCustomer={handleSelectCustomer}
                inputStyle={getInputStyle(field.fieldname)}
                disabled={isFormLocked}
                loginUser={loginUser}
                searchField="name"
                placeholder="Type customer name or search by ID, Phone..."
              />
              {renderFieldError(field.fieldname)}
            </div>
          );
        }

        if (isPhoneNumber) {
          return (
            <div key={field.fieldname} id={`field-${field.fieldname}`} data-fieldname={field.fieldname} className="min-w-0">
              {renderLabel(field)}
              <CustomerAutocompleteInput
                value={form[field.fieldname] || ""}
                onChange={(val) => {
                  handleChange(field.fieldname, val);
                  if (!val || !val.trim()) {
                    clearCustomerDetails();
                  } else if (selectedCustomer && val !== (selectedCustomer.phone_number || selectedCustomer.mobile_no || selectedCustomer.phone)) {
                    setSelectedCustomer(null);
                    setCustomerFound(false);
                    setForm((prev) => ({ ...prev, customer: "" }));
                  }
                }}
                onSelectCustomer={handleSelectCustomer}
                inputStyle={getInputStyle(field.fieldname)}
                disabled={isFormLocked}
                loginUser={loginUser}
                searchField="phone"
                placeholder="Type phone number or search past customer..."
              />
              {renderFieldError(field.fieldname)}
            </div>
          );
        }

        return (
          <div key={field.fieldname} id={`field-${field.fieldname}`} data-fieldname={field.fieldname} className={`min-w-0 ${isAmount ? "col-span-1 md:col-span-2" : ""}`}>
            {renderLabel(field)}
            <input
              {...commonProps}
              type={isAmount ? "number" : "text"}
              step={isAmount ? "0.01" : undefined}
              min={isAmount ? "0" : undefined}
              placeholder={isAmount ? "Enter transfer amount" : ""}
              autoComplete="one-time-code"
              data-lpignore="true"
              data-1p-ignore="true"
              data-form-type="other"
            />
            {renderFieldError(field.fieldname)}
          </div>
        );

      case "Check":
        return (
          <div key={field.fieldname} id={`field-${field.fieldname}`} data-fieldname={field.fieldname} className="col-span-1 md:col-span-2 flex items-center gap-3 py-1 min-w-0">
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

      case "Date": {
        const isExpiry = field.fieldname?.toLowerCase().includes("expiry");
        const isDob = field.fieldname === "dob";

        let selectedDate = null;
        if (form[field.fieldname]) {
          const raw = form[field.fieldname];
          if (raw instanceof Date) {
            selectedDate = isNaN(raw.getTime()) ? null : raw;
          } else if (typeof raw === "string") {
            const parts = raw.split("-");
            if (parts.length === 3) {
              selectedDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            } else {
              const parsed = new Date(raw);
              selectedDate = isNaN(parsed.getTime()) ? null : parsed;
            }
          }
        }

        return (
          <div key={field.fieldname} id={`field-${field.fieldname}`} data-fieldname={field.fieldname} className="min-w-0">
            {renderLabel(field)}
            <div className="w-full min-w-0">
              <DatePicker
                selected={selectedDate}
                onChange={(date) =>
                  handleChange(field.fieldname, formatLocalDate(date))
                }
                wrapperClassName="w-full block"
                className={`${getInputStyle(field.fieldname)} w-full min-w-0`}
                dateFormat="yyyy-MM-dd"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                {...(isDob
                  ? {
                      maxDate: new Date(),
                      yearDropdownItemNumber: 100,
                      scrollableYearDropdown: true,
                      openToDate: new Date(2000, 0, 1),
                    }
                  : isExpiry
                  ? {
                      yearDropdownItemNumber: 30,
                      scrollableYearDropdown: true,
                      openToDate: new Date(),
                    }
                  : {
                      maxDate: new Date(),
                      yearDropdownItemNumber: 50,
                      scrollableYearDropdown: true,
                    })}
              />
            </div>
            {renderFieldError(field.fieldname)}
          </div>
        );
      }

      case "Select": {
        const options = field.options?.split("\n").map((opt) => opt.trim()).filter(Boolean) || [];

        return (
          <div key={field.fieldname} id={`field-${field.fieldname}`} data-fieldname={field.fieldname} className="min-w-0">
            {renderLabel(field)}
            <div className="relative min-w-0">
              <select
                {...commonProps}
                disabled={isFormLocked}
                className={`${getInputStyle(field.fieldname)} appearance-none pr-10`}
              >
                <option value="">Select {field.label || field.fieldname}</option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <ChevronDown size={16} />
              </div>
            </div>
            {renderFieldError(field.fieldname)}
          </div>
        );
      }

      case "Small Text":
      case "Text":
        return (
          <div key={field.fieldname} id={`field-${field.fieldname}`} data-fieldname={field.fieldname} className="col-span-1 md:col-span-2 min-w-0">
            {renderLabel(field)}
            <textarea
              {...commonProps}
              rows={2}
              placeholder={`Enter ${field.label || field.fieldname}`}
            />
            {renderFieldError(field.fieldname)}
          </div>
        );

      case "Link": {
        if (
          field.fieldname === "warehouse" ||
          field.fieldname === "customer_id" ||
          field.fieldname === "amended_from"
        ) {
          return null;
        }

        const doctype = field.options;
        const rawOptions = (doctype && linkOptionsMap[doctype]) || [];
        const isLoading =
          (doctype && loadingLinkOptions[doctype]) ||
          (doctype === "Country" && hookCountriesLoading && rawOptions.length === 0);

        const currentValue = form[field.fieldname] || "";
        const hasSelectedNotInList =
          currentValue && !rawOptions.some((opt) => opt.value === currentValue);

        return (
          <div key={field.fieldname} id={`field-${field.fieldname}`} data-fieldname={field.fieldname} className="min-w-0">
            {renderLabel(field)}
            <div className="relative min-w-0">
              <select
                {...commonProps}
                disabled={isFormLocked || isLoading}
                className={`${getInputStyle(field.fieldname)} appearance-none pr-10`}
                onFocus={() => {
                  if (doctype && !linkOptionsMap[doctype] && !loadingLinkOptions[doctype]) {
                    fetchLinkOptions(doctype);
                  }
                }}
              >
                <option value="">
                  {isLoading
                    ? `Loading ${field.label || doctype}...`
                    : `Select ${field.label || doctype}`}
                </option>
                {hasSelectedNotInList && (
                  <option value={currentValue}>{currentValue}</option>
                )}
                {rawOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <ChevronDown size={16} />
              </div>
            </div>
            {renderFieldError(field.fieldname)}
          </div>
        );
      }

      case "Section Break":
        if (!field.label) return null;
        if (field.fieldname === "cash_denomination_section" || field.fieldname === "customer_details_section") {
          return null;
        }
        return (
          <div key={field.fieldname} className="col-span-1 md:col-span-2 min-w-0 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-4 bg-[#E00000] rounded-full inline-block shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                {field.label}
              </h3>
            </div>
          </div>
        );

      default:
        return null;
    }
  };


  const getDefaultCustomerLimits = async () => {
    try {
      const url = buildApiUrl(
        "api/method/moneygram.moneygram.api.app_configuration.get_annual_compliance_limit"
      );

      const res = await fetch(
        url,
        getFetchOptions({
          method: "GET",
        })
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.exception ||
          data?.message ||
          "Unable to fetch annual compliance limits."
        );
      }

      console.log("Default annual limits:", data);

      // frappe whitelisted methods normally return inside `message`
      return data?.message || {};
    } catch (err) {
      console.error("Unable to fetch annual compliance limits:", err);

      return {
        annual_fx_limit: 0,
        annual_fx_and_moneygram_limit: 0,
        annual_compliance_limit: 0,
      };
    }
  };

  const renderCustomerLimitsCard = () => {
    const rawFxMg = form.custom_annual_fx_and_moneygram_limit ?? defaultLimits?.annual_fx_and_moneygram_limit ?? null;
    const rawCompliance = form.custom_annual_compliance_limit ?? defaultLimits?.annual_compliance_limit ?? null;
    const rawFx = form.custom_available_currency_transfer_balance ?? defaultLimits?.annual_fx_limit ?? null;

    const formatLimit = (val) => {
      if (val === null || val === undefined || val === "" || isNaN(Number(val))) return "—";
      return Number(val).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const isCustomerActive = Boolean(form.customer || (customerLookupDone && customerFound));

    return (
      <div className="rounded-3xl border border-gray-100 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-6 sm:p-7 flex flex-col gap-5">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E00000]/10 flex items-center justify-center text-[#E00000]">
              <Wallet size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Customer Limits</h3>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          {/* Annual FX & Moneygram Limit */}
          <div className="p-4 bg-gray-50/80 border border-gray-200/80 rounded-2xl">
            <span className="text-[11px] uppercase font-bold text-gray-500 mb-1 flex items-center gap-1.5">
              <Wallet size={13} className="text-[#E00000]" />
              Annual FX &amp; MG Limit
            </span>
            <div className="text-xl font-black text-gray-900 mt-1">
              {formatLimit(rawFxMg)} FJD
            </div>
            {rawFxMg !== null && Number(rawFxMg) <= 0 && (
              <span className="text-[10px] font-semibold text-orange-600 mt-1 block">
                Limit threshold reached
              </span>
            )}
          </div>

          {/* Annual Compliance Limit */}
          <div className="p-4 bg-gray-50/80 border border-gray-200/80 rounded-2xl">
            <span className="text-[11px] uppercase font-bold text-gray-500 mb-1 flex items-center gap-1.5">
              <Wallet size={13} className="text-[#E00000]" />
              Annual Compliance Limit
            </span>
            <div className="text-xl font-black text-gray-900 mt-1">
              {formatLimit(rawCompliance)} FJD
            </div>
            {rawCompliance !== null && Number(rawCompliance) <= 0 && (
              <span className="text-[10px] font-semibold text-orange-600 mt-1 block">
                Limit threshold reached
              </span>
            )}
          </div>

          {/* Annual Send Limit */}
          <div className="p-4 bg-gray-50/80 border border-gray-200/80 rounded-2xl">
            <span className="text-[11px] uppercase font-bold text-gray-500 mb-1 flex items-center gap-1.5">
              <Wallet size={13} className="text-[#E00000]" />
              Annual Send Limit
            </span>
            <div className="text-xl font-black text-gray-900 mt-1">
              {formatLimit(rawFx)} FJD
            </div>
            {rawFx !== null && Number(rawFx) <= 0 && (
              <span className="text-[10px] font-semibold text-orange-600 mt-1 block">
                Limit threshold reached
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };
  const isFormLocked = Boolean(successInfo);
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="grow py-8 sm:py-10 px-4 sm:px-6 lg:px-8 xl:px-12 w-full">
        <div className="max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8 w-full min-w-0">

          {/* HEADER */}
          <div>
            <h1 className="text-gray-900 text-3xl sm:text-5xl font-black tracking-tight leading-none">
              Money{" "}
              <span className="text-[#E00000] italic">
                Transfer
              </span>
            </h1>
          </div>

          {/* MAIN CONTENT: FORM ON LEFT, CUSTOMER LIMITS ON RIGHT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full min-w-0">
            {/* LEFT: FORM CARD */}
            <div className="lg:col-span-8 w-full min-w-0">
              <div className="rounded-3xl border border-gray-100 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-6 sm:p-8 lg:p-10 w-full min-w-0 box-border">
                {!selectedWarehouse?.warehouse && (
                  <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-amber-700 text-2xl font-bold">⚠️</span>
                      <div>
                        <h3 className="text-sm font-black text-amber-900 uppercase tracking-wide">
                          User is not assigned to any branch location
                        </h3>
                        <p className="text-xs text-amber-800 mt-0.5">
                          You cannot process transfers until a branch location is assigned to your account in ERPNext. Please contact your administrator.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {successInfo && (
                  <div className="mb-6 rounded-2xl border border-green-100 bg-linear-to-r from-white to-green-50 p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="text-green-600 text-3xl">✓</div>
                      <div className="flex-1">
                        <h2 className="text-lg font-extrabold text-gray-800">Transfer Complete</h2>
                        <p className="text-sm text-gray-600 mt-1">{successInfo.message}</p>
                        <p className="mt-3 text-sm text-gray-700">
                          <strong>Customer:</strong> {successInfo.customerFullName} &nbsp;•
                          &nbsp; <strong>Transaction:</strong> {successInfo.transaction} &nbsp;
                          {/* •
                          &nbsp; <strong>Amount:</strong> {successInfo.currency || "FJD"} {Number(successInfo.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} */}
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

                <fieldset
                  disabled={isFormLocked}
                  className={`w-full min-w-0 border-0 p-0 m-0 ${
                    isFormLocked
                      ? "opacity-50 cursor-not-allowed select-none"
                      : ""
                  }`}
                >


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full min-w-0">
                    {orderedFields.map((field) => (
                      <React.Fragment key={field.fieldname}>
                        {renderField(field)}
                      </React.Fragment>
                    ))}
                  </div>
                  <div id="field-documents" data-fieldname="documents" className="mt-6 w-full min-w-0">
                    <DocumentUploadTable rows={documentRows} onChange={rows => setForm(prev => ({ ...prev, documents: rows, document_upload: "", upload_additional_info: "" }))} disabled={isFormLocked || isSubmitting} />
                    {renderFieldError("documents")}
                  </div>

                  {/* CURRENCY DENOMINATION PANEL */}
                  {form.enable_currency_denomination === 1 ||
                  form.enable_currency_denomination === "1" ||
                  form.enable_currency_denomination === true ? (
                    <div id="field-currency_denomination" data-fieldname="currency_denomination" ref={denomErrorRef} className="mt-8 col-span-1 md:col-span-2 w-full min-w-0">
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

                      {(fieldErrors.currency_denomination || denomBalanceError) ? (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2.5">
                          <span className="font-bold text-red-600 text-base leading-none">⚠</span>
                          <div>
                            <div className="font-semibold">Denomination Balance Error</div>
                            <p className="mt-0.5">{fieldErrors.currency_denomination || denomBalanceError}</p>
                          </div>
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

                  {/* SUBMIT ERROR BANNER */}
                  {submitError && (
                    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                      <span className="font-bold text-red-600 text-base">⚠</span>
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* BUTTON */}
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || stockLoading}
                    className={`mt-6 w-full bg-[#E00000] ${isSubmitting || stockLoading ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'} text-white rounded-2xl py-4 font-black transition`}
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
                      'Submit'
                    )}
                  </button>
                </fieldset>
              </div>
            </div>

            {/* RIGHT: CUSTOMER CURRENCY LIMITS & PHOTO SIDEBAR */}
            <div className="lg:col-span-4 lg:sticky lg:top-8 flex flex-col gap-6 w-full min-w-0">
              {renderCustomerLimitsCard()}

              {/* CUSTOMER PHOTO CARD */}
              <CustomerPhotoCard
                customerImageUrl={customerImageUrl}
                customerImageFile={customerImageFile}
                onImageChange={(file, previewUrl) => {
                  setCustomerImageFile(file);
                  setCustomerImageUrl(previewUrl);
                }}
                onImageRemove={() => {
                  setCustomerImageFile(null);
                  setCustomerImageUrl("");
                }}
                disabled={isFormLocked}
                customerFound={Boolean(customerLookupDone && customerFound && form.customer)}
              />
            </div>
          </div>
        </div>

        {/* Hidden print template for Money Transfer invoice */}
        <div className="hidden">
          <MoneyTransferInvoiceDocument
            invoiceData={
              successInfo?.transfer
                ? buildMoneyTransferInvoiceData(successInfo.transfer, successInfo)
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