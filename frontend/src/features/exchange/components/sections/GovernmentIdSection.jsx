import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { sessionAxios as axios } from "../../../../api/sessionClient.js";
import { Controller, useFormContext } from 'react-hook-form';
import {
  ChevronDown,
  BadgeCheck,
  Upload,
  FileText,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  X,
  Calendar,
  Globe,
  Plane,
  MapPin,
  Hash,
  QrCode,
  AlertCircle,
  Wallet,
  User,
  RefreshCw,
  Search,
  Phone,
} from 'lucide-react';
import { FieldLabel, fieldCls, ErrorMsg } from '../ui/FormUtilities';
import { useCustomer } from '../../hooks/useCustomer';
import { fetchNewCustomerId } from '../../api/customer';
import { useCountries } from '../../../../hooks/useCountry';
import { useAppConfiguration } from '../../../../hooks/useAppConfiguration';
import { useUser } from '../../../../context/UserContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export const GovernmentIdSection = ({ exchangeType, isCreditExceeded, forexAmount, onCustomerChange, useDocumentTable = false }) => {
  const loginUser = useUser();
  const { countries, loading: countryLoading, error: countryError } = useCountries();
  const { potOptions, limits: appLimits, limitsError, loading: potLoading, error: potError } = useAppConfiguration();
  const { register, watch, setValue, getValues, clearErrors, control, formState: { errors } } = useFormContext();
  const [dragOver, setDragOver] = useState(false);
  const [rbfFileName, setRbfFileName] = useState('');  // display name for the selected RBF file
  const [taxClearancePreview, setTaxClearancePreview] = useState(null);
  const [taxClearanceFile, setTaxClearanceFile] = useState(null);
  const [taxClearanceDragOver, setTaxClearanceDragOver] = useState(false);
  const [ticketPreview, setTicketPreview] = useState(null);
  const [ticketFile, setTicketFile] = useState(null);
  const [ticketDragOver, setTicketDragOver] = useState(false);

  const {
    previewUrl,
    previewFile,
    fetchAndFillCustomer,
    clearCustomerData,
    removeFile,
    handleFile
  } = useCustomer({ autoFillDocument: !useDocumentTable });

  const governmentId = watch('government_id');
  const idName = watch('idName');
  const dateOfBirth = watch('dateOfBirth');

  const customerId = watch('customer_id');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Clear all fields that were auto-fetched from previous customer
  const clearFetchedFields = useCallback(async (keepName = true) => {
    setValue('firstName', '');
    setValue('middleName', '');
    setValue('lastName', '');
    setValue('secondLastName', '');
    setValue('email', '');
    setValue('phone_number', '');
    setValue('phoneNumber', '');
    setValue('dateOfBirth', '');
    setValue('id_issue_date', null);
    setValue('id_expiry_date', null);
    setValue('government_id', exchangeType === 'SELL' ? 'Passport' : 'Passport');
    setValue('idType', exchangeType === 'SELL' ? 'Passport' : 'Passport');
    setValue('idNumber', '');
    setValue('idIssueCountry', '');
    setValue('idIssueState', '');
    setValue('occupation', '');
    setValue('country', '');
    setValue('city', '');
    setValue('tinNumber', '');
    if (useDocumentTable) setValue('documents', undefined);
    setValue('docFile', null);
    setValue('taxClearanceFile', null);
    setValue('rbfNumber', '');
    setValue('rbfDocument', null);
    setValue('availableBalance', null);
    setValue('annualFxAndMoneygramLimit', null);
    setValue('annualComplianceLimit', null);
    setValue('risk_level', 'Low');

    removeFile();
    setTaxClearanceFile(null);
    setTaxClearancePreview(null);
    setRbfFileName('');
    setPhoneQuery('');
    setIdQuery('');
    setSelectedCustomer(null);

    if (!keepName) {
      setValue('idName', '');
      setNameQuery('');
    }

    if (loginUser?.user) {
      try {
        const code = await fetchNewCustomerId(loginUser);
        if (code) setValue('customer_id', code, { shouldValidate: true });
      } catch (e) {
        console.error('Failed to regenerate Customer ID on customer change:', e);
      }
    }

    onCustomerChange?.({
      customerFound: false,
      customer: null,
      imageUrl: '',
    });
  }, [setValue, removeFile, exchangeType, loginUser, onCustomerChange, useDocumentTable]);

  // ── Fuzzy Customer Search State ──
  const [isNameDropdownOpen, setIsNameDropdownOpen] = useState(false);
  const [nameQuery, setNameQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const nameContainerRef = useRef(null);
  const nameDebounceRef = useRef(null);
  const masterListRef = useRef([]);

  // ── Phone Number Search State ──
  const [isPhoneDropdownOpen, setIsPhoneDropdownOpen] = useState(false);
  const [phoneQuery, setPhoneQuery] = useState('');
  const [phoneHighlightedIndex, setPhoneHighlightedIndex] = useState(-1);
  const phoneContainerRef = useRef(null);
  const phoneDebounceRef = useRef(null);

  // ── Customer ID Search State ──
  const [isIdSearchMode, setIsIdSearchMode] = useState(false);
  const [isIdDropdownOpen, setIsIdDropdownOpen] = useState(false);
  const [idQuery, setIdQuery] = useState('');
  const [idHighlightedIndex, setIdHighlightedIndex] = useState(-1);
  const idContainerRef = useRef(null);
  const idDebounceRef = useRef(null);

  // Auto-generate unique 6-character Customer ID if empty
  useEffect(() => {
    if (!customerId && loginUser?.user && !isIdSearchMode) {
      fetchNewCustomerId(loginUser).then((code) => {
        if (code) setValue('customer_id', code);
      });
    }
  }, [customerId, loginUser, setValue, isIdSearchMode]);

  const handleRegenerateId = async () => {
    const code = await fetchNewCustomerId(loginUser);
    if (code) setValue('customer_id', code);
  };

  const handleCancelIdSearch = async () => {
    setIsIdSearchMode(false);
    setIsIdDropdownOpen(false);
    setIdQuery('');
    if (!selectedCustomer) {
      const code = await fetchNewCustomerId(loginUser);
      if (code) setValue('customer_id', code, { shouldValidate: true });
    } else {
      const curId = selectedCustomer.custom_customer_id || selectedCustomer.customer_id || selectedCustomer.name;
      setValue('customer_id', curId, { shouldValidate: true });
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (nameContainerRef.current && !nameContainerRef.current.contains(e.target)) {
        setIsNameDropdownOpen(false);
      }
      if (phoneContainerRef.current && !phoneContainerRef.current.contains(e.target)) {
        setIsPhoneDropdownOpen(false);
      }
      if (idContainerRef.current && !idContainerRef.current.contains(e.target)) {
        setIsIdDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch customers from backend
  const searchCustomers = useCallback(
    async (searchTerm = '') => {
      if (!loginUser?.user) return;
      setCustomersLoading(true);
      try {
        const authHeaders = {
        };

        const res = await axios.get(
          '/api/method/moneygram.moneygram.api.get_transactions.get_customers_list',
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

        // Direct search on Customer DocType by mobile_no, custom_customer_id, or name if searchTerm is provided
        if (searchTerm.trim()) {
          try {
            const sTerm = searchTerm.trim();
            const directCustRes = await axios.get('/api/resource/Customer', {
              params: {
                or_filters: JSON.stringify([
                  ['mobile_no', 'like', `%${sTerm}%`],
                  ['custom_customer_id', 'like', `%${sTerm}%`],
                  ['name', 'like', `%${sTerm}%`],
                ]),
                fields: JSON.stringify([
                  'name',
                  'customer_name',
                  'custom_customer_id',
                  'custom_full_name',
                  'custom_date_of_birth',
                  'mobile_no',
                  'custom_government_id',
                  'custom_passport_number',
                  'custom_drivers_licence_number',
                  'custom_voter_id_number',
                  'custom_tin_number',
                  'image',
                  'custom_risk_level',
                ]),
                limit_page_length: 25,
              },
              headers: authHeaders,
            });
            const directCusts = directCustRes.data?.data ?? [];
            directCusts.forEach((dc) => {
              dc.customer_id = dc.custom_customer_id || dc.name;
              dc.phone_number = dc.mobile_no || '';
              if (!list.some((existing) => existing.name === dc.name)) {
                list.push(dc);
              }
            });
          } catch (e) {
            console.warn('Direct Customer search query error in MoneyExchange:', e);
          }
        }

        // Check if any returned customers lack mobile_no, and fetch directly from Customer doctype
        const missingPhoneNames = list
          .filter((c) => !c.mobile_no && !c.phone_number)
          .map((c) => c.name);
        if (missingPhoneNames.length > 0) {
          try {
            const custLookupRes = await axios.get('/api/resource/Customer', {
              params: {
                filters: JSON.stringify([['name', 'in', missingPhoneNames]]),
                fields: JSON.stringify(['name', 'mobile_no']),
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
            console.warn('Could not batch lookup Customer mobile_no in MoneyExchange:', e);
          }
        }

        if (Array.isArray(list)) {
          if (!searchTerm && list.length > 0) {
            masterListRef.current = list;
          }
          setCustomers(list);
        }
      } catch (err) {
        console.error('Error searching customers in MoneyExchange:', err);
      } finally {
        setCustomersLoading(false);
      }
    },
    [loginUser]
  );

  // Visible customers sorted by search match score
  const visibleCustomers = useMemo(() => {
    const q = (nameQuery || '').trim().toLowerCase();
    const source = masterListRef.current.length > 0 ? masterListRef.current : customers;

    if (!q) {
      return source.slice(0, 20);
    }

    const getFuzzyScore = (c, query) => {
      if (!query) return 1;
      const cleanQ = query.trim().toLowerCase();
      const name = (c.custom_full_name || c.customer_name || '').toLowerCase();
      const id = (c.customer_id || c.name || '').toLowerCase();
      const idNum = (c.id_number || '').toLowerCase();
      const dob = (c.custom_date_of_birth || '').toLowerCase();
      const phone = (c.phone_number || c.mobile_no || c.phone || '').toLowerCase();
      const phoneDigits = phone.replace(/[\s\-\(\)\+]/g, '');
      const cleanDigits = cleanQ.replace(/[\s\-\(\)\+]/g, '');

      if (cleanDigits && phoneDigits) {
        if (phoneDigits === cleanDigits) return 100;
        if (phoneDigits.endsWith(cleanDigits)) return 98;
        if (phoneDigits.startsWith(cleanDigits)) return 96;
        if (cleanDigits.endsWith(phoneDigits)) return 94;
        if (phoneDigits.includes(cleanDigits) || cleanDigits.includes(phoneDigits)) return 88;
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

    const scored = [];
    const seen = new Set();

    customers.forEach((c) => {
      const cId = c?.customer_id || c?.name;
      if (!cId || seen.has(cId)) return;
      seen.add(cId);
      const score = getFuzzyScore(c, q);
      if (score > 0) scored.push({ c, score });
    });

    masterListRef.current.forEach((c) => {
      const cId = c?.customer_id || c?.name;
      if (!cId || seen.has(cId)) return;
      seen.add(cId);
      const score = getFuzzyScore(c, q);
      if (score > 0) scored.push({ c, score });
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map((item) => item.c).slice(0, 20);
  }, [customers, nameQuery]);

  // Visible customers for Phone Number field, filtered by phoneQuery
  const visiblePhoneCustomers = useMemo(() => {
    const q = (phoneQuery || '').trim().toLowerCase();
    const source = masterListRef.current.length > 0 ? masterListRef.current : customers;

    if (!q) {
      return source.slice(0, 20);
    }

    console.log(`🔎 [MoneyExchange Phone Match Check] Typed: "${q}" | Evaluating customers in list:`);
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

    const cleanDigits = q.replace(/[\s\-\(\)\+]/g, '');

    const getPhoneScore = (c) => {
      const phone = (c.phone_number || c.mobile_no || c.phone || '').toLowerCase();
      const phoneDigits = phone.replace(/[\s\-\(\)\+]/g, '');

      if (cleanDigits && phoneDigits) {
        if (phoneDigits === cleanDigits) return 100;
        if (phoneDigits.endsWith(cleanDigits)) return 98;
        if (phoneDigits.startsWith(cleanDigits)) return 96;
        if (cleanDigits.endsWith(phoneDigits)) return 94;
        if (phoneDigits.includes(cleanDigits) || cleanDigits.includes(phoneDigits)) return 90;
      }

      if (phone && phone.includes(q)) return 88;

      const name = (c.custom_full_name || c.customer_name || '').toLowerCase();
      const id = (c.custom_customer_id || c.customer_id || c.name || '').toLowerCase();
      if (id === q) return 80;
      if (name === q) return 75;
      if (id.startsWith(q)) return 70;
      if (name.includes(q)) return 60;

      return 0;
    };

    const scored = [];
    const seen = new Set();

    customers.forEach((c) => {
      const cId = c?.custom_customer_id || c?.customer_id || c?.name;
      if (!cId || seen.has(cId)) return;
      seen.add(cId);
      let score = getPhoneScore(c);
      if (score === 0) {
        score = 80;
      }
      scored.push({ c, score });
    });

    masterListRef.current.forEach((c) => {
      const cId = c?.custom_customer_id || c?.customer_id || c?.name;
      if (!cId || seen.has(cId)) return;
      seen.add(cId);
      const score = getPhoneScore(c);
      if (score > 0) scored.push({ c, score });
    });

    scored.sort((a, b) => b.score - a.score);
    const results = scored.map((item) => item.c).slice(0, 20);

    console.log(`📋 [MoneyExchange Matching Customers in Dropdown] (${results.length}):`, results.map((c) => ({
      name: c.custom_full_name || c.customer_name || c.name,
      id: c.custom_customer_id || c.name,
      mobile_no: c.mobile_no,
    })));

    return results;
  }, [customers, phoneQuery]);

  // Handle typing in customer full name input
  const handleNameQueryChange = (val) => {
    setNameQuery(val);
    setValue('idName', val, { shouldValidate: true, shouldDirty: true });

    if (!val || !val.trim()) {
      clearFetchedFields(false);
      return;
    }

    // If an existing customer was loaded and user modifies the Full Name:
    const prevName = selectedCustomer?.custom_full_name || selectedCustomer?.customer_name || selectedCustomer?.name;
    if (selectedCustomer && val !== prevName) {
      // Clear ONLY the auto-fetched fields, preserving user's typed name
      clearFetchedFields(true);
    }

    setIsNameDropdownOpen(true);
    setHighlightedIndex(-1);

    if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
    nameDebounceRef.current = setTimeout(() => {
      searchCustomers(val);
    }, 250);
  };

  // Handle typing in phone number input
  const handlePhoneQueryChange = (val) => {
    setPhoneQuery(val);
    setValue('phone_number', val, { shouldValidate: true, shouldDirty: true });
    setValue('phoneNumber', val, { shouldValidate: true, shouldDirty: true });
    console.log(`⌨️ [MoneyExchange Phone Input] Typed Phone Number: "${val}"`);
    if (!val || !val.trim()) {
      clearCustomerData();
      setNameQuery('');
      setPhoneQuery('');
      setSelectedCustomer(null);
      onCustomerChange?.({
        customerFound: false,
        customer: null,
        imageUrl: '',
      });
      return;
    }
    if (selectedCustomer && val !== (selectedCustomer.phone_number || selectedCustomer.mobile_no || selectedCustomer.phone)) {
      setSelectedCustomer(null);
      onCustomerChange?.({
        customerFound: false,
        customer: null,
        imageUrl: '',
      });
    }
    setIsPhoneDropdownOpen(true);
    setPhoneHighlightedIndex(-1);

    if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current);
    phoneDebounceRef.current = setTimeout(() => {
      searchCustomers(val);
    }, 250);
  };

  // Visible customers sorted by Customer ID match score
  const visibleIdCustomers = useMemo(() => {
    const q = (idQuery || '').trim().toLowerCase();
    const source = masterListRef.current.length > 0 ? masterListRef.current : customers;

    if (!q) {
      return source.slice(0, 20);
    }

    const getIdScore = (c) => {
      const id = (c.custom_customer_id || c.customer_id || c.name || '').toLowerCase();
      const name = (c.custom_full_name || c.customer_name || '').toLowerCase();
      const phone = (c.phone_number || c.mobile_no || c.phone || '').toLowerCase();

      if (id === q) return 100;
      if (id.startsWith(q)) return 95;
      if (id.endsWith(q)) return 90;
      if (id.includes(q)) return 85;
      if (name === q) return 70;
      if (name.includes(q)) return 60;
      if (phone.includes(q)) return 50;

      return 0;
    };

    const scored = [];
    const seen = new Set();

    customers.forEach((c) => {
      const cId = c?.custom_customer_id || c?.customer_id || c?.name;
      if (!cId || seen.has(cId)) return;
      seen.add(cId);
      let score = getIdScore(c);
      if (score === 0) {
        score = 80;
      }
      scored.push({ c, score });
    });

    masterListRef.current.forEach((c) => {
      const cId = c?.custom_customer_id || c?.customer_id || c?.name;
      if (!cId || seen.has(cId)) return;
      seen.add(cId);
      const score = getIdScore(c);
      if (score > 0) scored.push({ c, score });
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map((item) => item.c).slice(0, 20);
  }, [customers, idQuery]);

  // Handle typing in customer ID search input
  const handleIdQueryChange = (val) => {
    setIdQuery(val);
    setValue('customer_id', val, { shouldValidate: true, shouldDirty: true });
    if (!val || !val.trim()) {
      clearCustomerData();
      setNameQuery('');
      setPhoneQuery('');
      setIdQuery('');
      setSelectedCustomer(null);
      onCustomerChange?.({
        customerFound: false,
        customer: null,
        imageUrl: '',
      });
      return;
    }
    if (
      selectedCustomer &&
      val !== (selectedCustomer.custom_customer_id || selectedCustomer.customer_id || selectedCustomer.name)
    ) {
      setSelectedCustomer(null);
      onCustomerChange?.({
        customerFound: false,
        customer: null,
        imageUrl: '',
      });
    }
    setIsIdDropdownOpen(true);
    setIdHighlightedIndex(-1);

    if (idDebounceRef.current) clearTimeout(idDebounceRef.current);
    idDebounceRef.current = setTimeout(() => {
      searchCustomers(val);
    }, 250);
  };

  const handleIdKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsIdDropdownOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsIdDropdownOpen(true);
      setIdHighlightedIndex((prev) =>
        prev < visibleIdCustomers.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : visibleIdCustomers.length - 1
      );
    } else if (
      e.key === 'Enter' &&
      isIdDropdownOpen &&
      idHighlightedIndex >= 0 &&
      visibleIdCustomers[idHighlightedIndex]
    ) {
      e.preventDefault();
      handleSelectCustomer(visibleIdCustomers[idHighlightedIndex]);
      setIsIdSearchMode(false);
      setIsIdDropdownOpen(false);
      setIdQuery('');
    }
  };

  // When existing customer is selected from dropdown
  const handleSelectCustomer = async (c) => {
    if (!c) return;
    if (useDocumentTable) {
      setValue('documents', [], { shouldDirty: true });
      for (const field of ['docFile', 'ticket', 'rbfDocument', 'taxClearanceFile']) {
        setValue(field, null);
        clearErrors(field);
      }
      clearErrors('documents');
      removeFile();
    }
    setSelectedCustomer(c);
    const chosenName = c.custom_full_name || c.customer_name || c.name || '';
    const chosenId = c.custom_customer_id || c.customer_id || c.name || '';
    const chosenPhone = c.mobile_no || c.phone_number || c.phone || '';
    const chosenImg = c.image || c.custom_image || '';
    const idNum = c.custom_passport_number || c.custom_drivers_licence_number || c.custom_tin_number || c.custom_voter_id_number || c.id_number || '';

    setNameQuery(chosenName);
    setPhoneQuery(chosenPhone);
    setIdQuery('');
    setValue('customer_id', chosenId, { shouldValidate: true, shouldDirty: true });
    setValue('idName', chosenName, { shouldValidate: true, shouldDirty: true });
    setValue('phone_number', chosenPhone, { shouldValidate: true, shouldDirty: true });
    setValue('phoneNumber', chosenPhone, { shouldValidate: true, shouldDirty: true });
    setValue('dateOfBirth', c.custom_date_of_birth || '', { shouldValidate: true, shouldDirty: true });
    setValue('government_id', c.custom_government_id || 'Passport', { shouldValidate: true, shouldDirty: true });
    setValue('idNumber', idNum || '', { shouldValidate: true, shouldDirty: true });
    setValue('tinNumber', c.custom_tin_number || '', { shouldValidate: true, shouldDirty: true });
    setValue('occupation', c.custom_occupation || '', { shouldValidate: true, shouldDirty: true });
    setValue('country', c.custom_country || '', { shouldValidate: true, shouldDirty: true });
    setValue('city', c.custom_city || '', { shouldValidate: true, shouldDirty: true });
    setValue('idIssueCountry', c.custom_id_issue_country || '', { shouldValidate: true, shouldDirty: true });
    setValue('idIssueState', c.custom_id_issue_stateprovince || '', { shouldValidate: true, shouldDirty: true });
    setValue('firstName', c.custom_first_name || '', { shouldValidate: true, shouldDirty: true });
    setValue('middleName', c.custom_middle_name || '', { shouldValidate: true, shouldDirty: true });
    setValue('lastName', c.custom_last_name || '', { shouldValidate: true, shouldDirty: true });
    setValue('secondLastName', c.custom_second_last_name_family_name || '', { shouldValidate: true, shouldDirty: true });
    setValue('email', c.email_id || c.receiver_mailid || '', { shouldValidate: true, shouldDirty: true });
    setValue('risk_level', c.custom_risk_level || c.risk_level || 'Low', { shouldValidate: true, shouldDirty: true });
    setIsNameDropdownOpen(false);
    setIsPhoneDropdownOpen(false);
    setIsIdDropdownOpen(false);
    setIsIdSearchMode(false);

    onCustomerChange?.({
      customerFound: true,
      customer: c,
      imageUrl: chosenImg,
    });

    try {
      await fetchAndFillCustomer(c.name);
    } catch (err) {
      console.error('Error fetching customer from dropdown:', err);
    }
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsNameDropdownOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsNameDropdownOpen(true);
      setHighlightedIndex((prev) =>
        prev < visibleCustomers.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : visibleCustomers.length - 1
      );
    } else if (
      e.key === 'Enter' &&
      isNameDropdownOpen &&
      highlightedIndex >= 0 &&
      visibleCustomers[highlightedIndex]
    ) {
      e.preventDefault();
      handleSelectCustomer(visibleCustomers[highlightedIndex]);
    }
  };

  const handlePhoneKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsPhoneDropdownOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsPhoneDropdownOpen(true);
      setPhoneHighlightedIndex((prev) =>
        prev < visiblePhoneCustomers.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPhoneHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : visiblePhoneCustomers.length - 1
      );
    } else if (
      e.key === 'Enter' &&
      isPhoneDropdownOpen &&
      phoneHighlightedIndex >= 0 &&
      visiblePhoneCustomers[phoneHighlightedIndex]
    ) {
      e.preventDefault();
      handleSelectCustomer(visiblePhoneCustomers[phoneHighlightedIndex]);
    }
  };

  // When SELL, auto-lock ID type to Passport
  useEffect(() => {
    if (exchangeType === 'SELL') {
      setValue('government_id', 'Passport', { shouldValidate: true });
    }
  }, [exchangeType, setValue]);

  const availableBalance = watch('availableBalance');
  const annualFxAndMoneygramLimit = watch('annualFxAndMoneygramLimit');
  const annualComplianceLimit = watch('annualComplianceLimit');

  const balanceNum = parseFloat(availableBalance);
  const fxAndMgLimitNum = parseFloat(annualFxAndMoneygramLimit);
  const complianceLimitNum = parseFloat(annualComplianceLimit);
  const forexAmountNum = parseFloat(forexAmount);

  // If customer is existing (balance present in master data), use customer's balance.
  // If customer is new (balance is null/undefined), use dynamic App Configuration thresholds (NO hardcoded values).
  const effectiveAvailableBalance = (!isNaN(balanceNum) && availableBalance !== null && availableBalance !== undefined)
    ? balanceNum
    : (appLimits?.annual_fx_limit != null && !isNaN(parseFloat(appLimits.annual_fx_limit)) ? parseFloat(appLimits.annual_fx_limit) : null);

  const effectiveFxAndMgLimit = (!isNaN(fxAndMgLimitNum) && annualFxAndMoneygramLimit !== null && annualFxAndMoneygramLimit !== undefined)
    ? fxAndMgLimitNum
    : (appLimits?.annual_fx_and_moneygram_limit != null && !isNaN(parseFloat(appLimits.annual_fx_and_moneygram_limit)) ? parseFloat(appLimits.annual_fx_and_moneygram_limit) : null);

  const effectiveComplianceLimit = (!isNaN(complianceLimitNum) && annualComplianceLimit !== null && annualComplianceLimit !== undefined)
    ? complianceLimitNum
    : (appLimits?.annual_compliance_limit != null && !isNaN(parseFloat(appLimits.annual_compliance_limit)) ? parseFloat(appLimits.annual_compliance_limit) : null);

  const hasFxLimit = effectiveAvailableBalance !== null && !isNaN(effectiveAvailableBalance);
  const hasFxMgLimit = effectiveFxAndMgLimit !== null && !isNaN(effectiveFxAndMgLimit);
  const hasComplianceLimit = effectiveComplianceLimit !== null && !isNaN(effectiveComplianceLimit);
  const isNoLimitFound = !hasFxMgLimit && !hasComplianceLimit;

  // Validation rules: trigger requirements when limit is exceeded
  const showRbfNumber = hasFxLimit
    ? (effectiveAvailableBalance <= 0 || (!isNaN(forexAmountNum) && effectiveAvailableBalance < forexAmountNum))
    : false;
  const showTinNumber = hasFxMgLimit
    ? (effectiveFxAndMgLimit <= 0 || (!isNaN(forexAmountNum) && effectiveFxAndMgLimit < forexAmountNum))
    : false;
  const showTaxClearance = hasComplianceLimit
    ? (effectiveComplianceLimit <= 0 || (!isNaN(forexAmountNum) && effectiveComplianceLimit < forexAmountNum))
    : false;

  const showRbfSection = showRbfNumber || showTinNumber || showTaxClearance;

  useEffect(() => {
    if (!showRbfNumber) {
      setValue('rbfNumber', '');
      clearErrors('rbfNumber');
    }
  }, [showRbfNumber, setValue, clearErrors]);

  useEffect(() => {
    if (!showTinNumber) {
      clearErrors('tinNumber');
    }
  }, [showTinNumber, clearErrors]);

  useEffect(() => {
    if (!showTaxClearance) {
      setValue('taxClearanceFile', null);
      clearErrors('taxClearanceFile');
      setTaxClearanceFile(null);
      setTaxClearancePreview(null);
    }
  }, [showTaxClearance, setValue, clearErrors]);

  useEffect(() => {
    if (exchangeType !== 'SELL') {
      setValue('ticket', null);
      clearErrors('ticket');
      setTicketFile(null);
      setTicketPreview(null);
    }
  }, [exchangeType, setValue, clearErrors]);

  register('docFile', {
    validate: (v) => {
      if (useDocumentTable && governmentId) {
        const documents = watch('documents');
        const attachment = documents === undefined
          ? v
          : documents.find(row => row.document_type?.trim() && row.attachment)?.attachment;
        return attachment ? true : 'Upload an attachment in the Documents table to continue.';
      }
      if (exchangeType === 'SELL' && !v) {
        return 'Passport photo / scan is required for Sell transactions';
      }
      return true;
    }
  });
  register('taxClearanceFile', {
    validate: (v) => {
      if (useDocumentTable) {
        const documents = watch('documents');
        if (documents?.some(row => row.document_type?.trim() && row.attachment)) return true;
      }
      if (showTaxClearance && !v) {
        return 'Tax clearance document from RBF is required';
      }
      return true;
    }
  });

  register('ticket', {
    validate: (v) => {
      if (useDocumentTable) {
        const documents = watch('documents');
        if (documents?.some(row => row.document_type?.trim() && row.attachment)) return true;
      }
      if (exchangeType === 'SELL' && !v) {
        return 'Ticket copy is required';
      }
      return true;
    }
  });

  const handleTaxClearanceFile = (file) => {
    if (!file) return;
    setTaxClearanceFile(file);
    setValue('taxClearanceFile', file, { shouldValidate: true });
    if (file.type === 'application/pdf') {
      setTaxClearancePreview(file.name);
    } else {
      const url = URL.createObjectURL(file);
      setTaxClearancePreview(url);
    }
  };

  const removeTaxClearanceFile = () => {
    setTaxClearanceFile(null);
    setTaxClearancePreview(null);
    setValue('taxClearanceFile', null, { shouldValidate: true });
  };

  const handleTicketFile = (file) => {
    if (!file) return;
    setTicketFile(file);
    setValue('ticket', file, { shouldValidate: true });
    if (file.type === 'application/pdf') {
      setTicketPreview(file.name);
    } else {
      const url = URL.createObjectURL(file);
      setTicketPreview(url);
    }
  };

  const removeTicketFile = () => {
    setTicketFile(null);
    setTicketPreview(null);
    setValue('ticket', null, { shouldValidate: true });
  };


  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const placeholders = {
    'Passport': 'e.g. A12345678',
    'Government ID': 'e.g. 987654321',
    'Driver\'s Licence': 'e.g. DL12345678',
    'Voter ID Card': 'e.g. V12345678',
    'TIN Card': 'e.g. 785865000'
  };

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
        <ShieldCheck size={16} className="text-[#E00000] flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-800">ID Verification</p>
          <p className="text-xs text-gray-400">Required for compliance — data is encrypted and secure</p>
        </div>
        <span className="ml-auto text-[10px] font-semibold text-[#E00000] bg-[#E00000]/5 border border-[#E00000]/10 px-2 py-0.5 rounded">
          ID Check
        </span>
      </div>

      <div className="px-5 py-5 flex flex-col gap-5">
        {/* Customer ID Field */}
        <div id="field-customerId" className="relative" ref={idContainerRef}>
          <div className="flex items-center justify-between">
            <FieldLabel required icon={isIdSearchMode ? Hash : User}>
              {isIdSearchMode ? 'Search Customer ID' : 'Customer ID'}
            </FieldLabel>
            <div className="flex items-center gap-2">
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
                      setIsIdDropdownOpen(true);
                      if (!selectedCustomer) {
                        setValue('customer_id', '');
                        setIdQuery('');
                      } else {
                        setIdQuery(customerId || '');
                      }
                      if (customers.length === 0) searchCustomers('');
                    }}
                    className="text-[11px] text-gray-500 hover:text-[#E00000] flex items-center gap-1 font-medium transition-colors cursor-pointer"
                    title="Search customer by entering Customer ID"
                  >
                    <Search size={11} /> Search by ID
                  </button>
                  {!selectedCustomer && (
                    <button
                      type="button"
                      onClick={handleRegenerateId}
                      className="text-[11px] text-gray-500 hover:text-[#E00000] flex items-center gap-1 font-medium transition-colors cursor-pointer"
                      title="Generate another 6-character code"
                    >
                      <RefreshCw size={11} /> Regenerate ID
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {isIdSearchMode ? (
            <div className="relative mt-1">
              <input
                type="text"
                name="search_customer_id_field"
                placeholder="Type Customer ID to search (e.g. CUST-... or 6-char ID)..."
                autoComplete="one-time-code"
                data-lpignore="true"
                data-1p-ignore="true"
                data-form-type="other"
                role="combobox"
                aria-autocomplete="list"
                value={idQuery !== '' ? idQuery : (customerId || '')}
                onFocus={() => {
                  setIsIdDropdownOpen(true);
                  if (customers.length === 0) {
                    searchCustomers('');
                  }
                }}
                onChange={(e) => handleIdQueryChange(e.target.value)}
                onKeyDown={handleIdKeyDown}
                className="w-full px-3.5 py-2.5 rounded-lg border font-mono font-bold tracking-wider text-sm transition-all outline-none border-[#E00000] ring-1 ring-[#E00000]/20 bg-white text-gray-900 pr-10"
              />
              <button
                type="button"
                onClick={handleCancelIdSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                title="Cancel search"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="relative mt-1">
              <input
                type="text"
                readOnly
                placeholder="Auto-generating 6-character ID..."
                value={customerId || ''}
                {...register('customer_id', { required: 'Customer ID is required' })}
                className={`w-full px-3.5 py-2.5 rounded-lg border font-mono font-bold tracking-widest text-sm bg-gray-50 pr-24 ${
                  customerId ? 'text-[#E00000] border-gray-300' : 'text-gray-400 border-gray-200'
                }`}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsIdSearchMode(true);
                    setIsIdDropdownOpen(true);
                    if (!selectedCustomer) {
                      setValue('customer_id', '');
                      setIdQuery('');
                    } else {
                      setIdQuery(customerId || '');
                    }
                    if (customers.length === 0) searchCustomers('');
                  }}
                  className="p-1 text-gray-400 hover:text-[#E00000] rounded hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Search Customer by ID"
                >
                  <Search size={14} />
                </button>
                {customerId && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-gray-200 text-gray-700">
                    {selectedCustomer ? 'EXISTING' : 'NEW'}
                  </span>
                )}
              </div>
            </div>
          )}
          <ErrorMsg message={errors.customer_id?.message} />

          {/* Autocomplete Dropdown for Customer ID */}
          {isIdSearchMode && isIdDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-full min-w-[320px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in duration-100">
              <div className="px-3.5 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-gray-500">
                  <Hash size={12} className="text-[#E00000]" />
                  Matching Customers by Customer ID ({visibleIdCustomers.length})
                </span>
                {customersLoading ? (
                  <span className="flex items-center gap-1 text-gray-400 text-[10px]">
                    <RefreshCw size={10} className="animate-spin" /> Searching…
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400">Select to auto-populate</span>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                {customersLoading && visibleIdCustomers.length === 0 ? (
                  <div className="px-4 py-5 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                    <RefreshCw size={13} className="animate-spin text-gray-400" />
                    <span>Searching customer records…</span>
                  </div>
                ) : visibleIdCustomers.length === 0 ? (
                  <div className="px-4 py-4 text-center text-xs text-gray-500">
                    <p className="font-semibold text-gray-700">No matching customer found</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Try typing the ID code or Customer number
                    </p>
                  </div>
                ) : (
                  visibleIdCustomers.map((c, idx) => {
                    const name = c.custom_full_name || c.customer_name || c.name;
                    const cId = c.custom_customer_id || c.customer_id || c.name;
                    const phoneNum = c.mobile_no || c.phone_number || c.phone || '';
                    const idNum = c.custom_passport_number || c.custom_drivers_licence_number || c.custom_voter_id_number || c.custom_tin_number || c.id_number || '';
                    const isHighlighted = idHighlightedIndex === idx;

                    return (
                      <div
                        key={c.name}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectCustomer(c);
                        }}
                        onMouseEnter={() => setIdHighlightedIndex(idx)}
                        className={`px-3.5 py-2.5 cursor-pointer transition-colors flex items-center justify-between ${
                          isHighlighted
                            ? 'bg-red-50 text-[#E00000]'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div
                            className={`text-xs ${
                              isHighlighted ? 'font-bold text-[#E00000]' : 'font-medium text-gray-800'
                            } truncate flex items-center gap-2`}
                          >
                            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 bg-red-100 text-[#E00000] rounded">
                              {cId}
                            </span>
                            <span className="font-semibold">{name}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono truncate mt-0.5 flex items-center gap-2">
                            {phoneNum && (
                              <span className="text-gray-600 font-medium">📞 {phoneNum}</span>
                            )}
                            {idNum && (
                              <span>ID: {idNum}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600 whitespace-nowrap ml-2">
                          {c.custom_government_id || 'Existing'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Full Name Field (Search & Auto-fill) */}
        <div id="field-idName" className="relative" ref={nameContainerRef}>
          <FieldLabel required icon={FileText}>Full Name (Exact name on the ID)</FieldLabel>
          <div className="relative mt-1">
            <input
              type="text"
              name="search_customer_name_field"
              placeholder="Type customer name, or search by ID, phone, govt ID..."
              autoComplete="one-time-code"
              data-lpignore="true"
              data-1p-ignore="true"
              data-form-type="other"
              role="combobox"
              aria-autocomplete="list"
              value={nameQuery !== '' ? nameQuery : (idName || '')}
              onFocus={() => {
                setIsNameDropdownOpen(true);
                if (customers.length === 0) {
                  searchCustomers('');
                }
              }}
              onChange={(e) => {
                handleNameQueryChange(e.target.value);
              }}
              onKeyDown={handleNameKeyDown}
              className={`${fieldCls(errors.idName)} pr-10 bg-white`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {customersLoading ? <RefreshCw size={14} className="animate-spin text-[#E00000]" /> : <Search size={14} />}
            </div>
          </div>

          {selectedCustomer && (
            <div className="mt-1.5 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg font-medium">
              <CheckCircle2 size={13} className="text-green-600 flex-shrink-0" />
              <span>
                Existing customer loaded: <strong>{selectedCustomer.custom_full_name || selectedCustomer.customer_name}</strong> (ID: {selectedCustomer.custom_customer_id || selectedCustomer.name})
              </span>
            </div>
          )}

          {isNameDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-full min-w-[320px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in duration-100">
              <div className="px-3.5 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-gray-500">
                  <User size={12} className="text-[#E00000]" />
                  Matching Customers ({visibleCustomers.length})
                </span>
                {customersLoading ? (
                  <span className="flex items-center gap-1 text-gray-400 text-[10px]">
                    <RefreshCw size={10} className="animate-spin" /> Searching…
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400">Select to auto-fill details</span>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                {customersLoading && visibleCustomers.length === 0 ? (
                  <div className="px-4 py-5 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                    <RefreshCw size={13} className="animate-spin text-gray-400" />
                    <span>Searching customer records…</span>
                  </div>
                ) : visibleCustomers.length === 0 ? (
                  <div className="px-4 py-4 text-center text-xs text-gray-500">
                    <p className="font-semibold text-gray-700">No matching customer</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Enter details to register as new customer
                    </p>
                  </div>
                ) : (
                  visibleCustomers.map((c, idx) => {
                    const name = c.custom_full_name || c.customer_name || c.name;
                    const cId = c.custom_customer_id || c.customer_id || c.name;
                    const idNum = c.id_number || c.custom_passport_number || c.custom_drivers_licence_number || c.custom_voter_id_number || c.custom_tin_number || '';
                    const phoneNum = c.phone_number || c.mobile_no || c.phone || '';
                    const isHighlighted = highlightedIndex === idx;
                    return (
                      <div
                        key={c.name}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectCustomer(c);
                        }}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`px-3.5 py-2.5 cursor-pointer transition-colors flex items-center justify-between ${
                          isHighlighted
                            ? 'bg-red-50 text-[#E00000]'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div
                            className={`text-xs ${
                              isHighlighted ? 'font-bold text-[#E00000]' : 'font-medium text-gray-800'
                            } truncate flex items-center gap-2`}
                          >
                            <span>{name}</span>
                            <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 bg-gray-100 rounded text-gray-700">
                              {cId}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono truncate mt-0.5">
                            {c.custom_date_of_birth ? `DOB: ${c.custom_date_of_birth}` : ''}
                            {idNum ? ` • ID: ${idNum}` : ''}
                            {phoneNum ? ` • 📞 ${phoneNum}` : ''}
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-gray-400">
                          <span className={isHighlighted ? 'text-[#E00000]' : 'text-gray-400'}>
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
          <ErrorMsg message={errors.idName?.message} />
        </div>

        {/* Phone Number Field (Optional, with search & auto-fill) */}
        <div id="field-phone_number" className="relative" ref={phoneContainerRef}>
          <FieldLabel icon={Phone}>Phone Number (Optional)</FieldLabel>
          <div className="relative mt-1">
            <input
              type="text"
              placeholder="Enter customer phone number, or search..."
              autoComplete="off"
              value={phoneQuery !== '' ? phoneQuery : (watch('phone_number') || '')}
              onFocus={() => {
                setIsPhoneDropdownOpen(true);
                if (customers.length === 0) {
                  searchCustomers('');
                }
              }}
              onChange={(e) => {
                handlePhoneQueryChange(e.target.value);
              }}
              onKeyDown={handlePhoneKeyDown}
              className={`${fieldCls(false)} pr-10 bg-white`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {customersLoading ? <RefreshCw size={14} className="animate-spin text-[#E00000]" /> : <Phone size={14} />}
            </div>
          </div>

          {isPhoneDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-full min-w-[320px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in duration-100">
              <div className="px-3.5 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-gray-500">
                  <Phone size={12} className="text-[#E00000]" />
                  Matching Customers by Phone ({visiblePhoneCustomers.length})
                </span>
                {customersLoading ? (
                  <span className="flex items-center gap-1 text-gray-400 text-[10px]">
                    <RefreshCw size={10} className="animate-spin" /> Searching…
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400">Select to auto-fill details</span>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                {customersLoading && visiblePhoneCustomers.length === 0 ? (
                  <div className="px-4 py-5 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                    <RefreshCw size={13} className="animate-spin text-gray-400" />
                    <span>Searching customer records…</span>
                  </div>
                ) : visiblePhoneCustomers.length === 0 ? (
                  <div className="px-4 py-4 text-center text-xs text-gray-500">
                    <p className="font-semibold text-gray-700">No matching customer</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Phone number will be saved for this customer
                    </p>
                  </div>
                ) : (
                  visiblePhoneCustomers.map((c, idx) => {
                    const name = c.custom_full_name || c.customer_name || c.name;
                    const cId = c.custom_customer_id || c.customer_id || c.name;
                    const idNum = c.id_number || c.custom_passport_number || c.custom_drivers_licence_number || c.custom_voter_id_number || c.custom_tin_number || '';
                    const phoneNum = c.phone_number || c.mobile_no || c.phone || c.custom_contact_number || c.contact_number || '';
                    const isHighlighted = phoneHighlightedIndex === idx;
                    return (
                      <div
                        key={c.name}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectCustomer(c);
                        }}
                        onMouseEnter={() => setPhoneHighlightedIndex(idx)}
                        className={`px-3.5 py-2.5 cursor-pointer transition-colors flex items-center justify-between ${
                          isHighlighted
                            ? 'bg-red-50 text-[#E00000]'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div
                            className={`text-xs ${
                              isHighlighted ? 'font-bold text-[#E00000]' : 'font-medium text-gray-800'
                            } truncate flex items-center gap-2`}
                          >
                            <span>{name}</span>
                            <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 bg-gray-100 rounded text-gray-700">
                              {cId}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono truncate mt-0.5">
                            {phoneNum ? <strong className="text-gray-700">📞 {phoneNum}</strong> : <span className="italic text-gray-400">No phone attached</span>}
                            {c.custom_date_of_birth ? ` • DOB: ${c.custom_date_of_birth}` : ''}
                            {idNum ? ` • ID: ${idNum}` : ''}
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-gray-400">
                          <span className={isHighlighted ? 'text-[#E00000]' : 'text-gray-400'}>
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
          <ErrorMsg message={errors.phone_number?.message} />
        </div>

        {/* Date of Birth Field */}
        <div id="field-dateOfBirth">
          <FieldLabel required icon={Calendar}>Date of Birth</FieldLabel>
          <Controller
            name="dateOfBirth"
            rules={{
              required: 'Date of birth is required',
              validate: (v) => {
                if (!v) return 'Date of birth is required';
                const today = new Date();
                const dob = new Date(v);
                if (dob >= today) return 'Date of birth must be in the past';
                const minAge = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
                if (dob > minAge) return 'You must be at least 18 years old';
                return true;
              },
            }}
            render={({ field }) => (
              <div className="dob-picker-wrapper mt-1">
                <DatePicker
                  selected={field.value ? (field.value instanceof Date ? field.value : new Date(field.value)) : null}
                  onChange={(date) => {
                    field.onChange(date);
                  }}
                  onBlur={field.onBlur}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="YYYY-MM-DD"
                  maxDate={new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate())}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  yearDropdownItemNumber={100}
                  scrollableYearDropdown
                  className={fieldCls(errors.dateOfBirth)}
                  wrapperClassName="block w-full"
                  autoComplete="off"
                />
              </div>
            )}
          />
          <ErrorMsg message={errors.dateOfBirth?.message} />
        </div>

        <div>
          <FieldLabel icon={FileText}>ID Type
          </FieldLabel>
          <div className="relative mt-1">
            <select
              className={`${fieldCls(errors.government_id)} appearance-none pr-10 ${exchangeType === 'SELL' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
              disabled={exchangeType === 'SELL'}
              {...register('government_id')}>
              <option value="">Select ID Type (Optional)</option>
              <option value="Driver's Licence">Driver's Licence</option>
              <option value="Voter ID Card">Voter ID Card</option>
              <option value="Passport">Passport</option>
              <option value="TIN Card">TIN Card</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <ChevronDown size={16} />
            </div>
          </div>
          {exchangeType === 'SELL' && (
            <p className="text-xs text-[#B70000] mt-1">Passport is required for Sell transactions.</p>
          )}
        </div>

        <div id="field-idNumber">
          <FieldLabel icon={BadgeCheck}>ID Number</FieldLabel>
          <input type="text" placeholder={placeholders[governmentId] || 'e.g. 123456789 (Optional)'}
            {...register('idNumber')}
            className={`${fieldCls(errors.idNumber)} mt-1`} />
          <ErrorMsg message={errors.idNumber?.message} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div id="field-idIssueDate">
            <FieldLabel icon={Calendar}>ID Issue Date</FieldLabel>
            <Controller
              name="id_issue_date"
              control={control}
              render={({ field }) => (
                <div className="dob-picker-wrapper mt-1">
                  <DatePicker
                    selected={field.value ? (field.value instanceof Date ? field.value : new Date(field.value)) : null}
                    onChange={(date) => field.onChange(date)}
                    onBlur={field.onBlur}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="YYYY-MM-DD"
                    maxDate={new Date()}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    yearDropdownItemNumber={100}
                    scrollableYearDropdown
                    className={fieldCls(errors.id_issue_date)}
                    wrapperClassName="block w-full"
                    autoComplete="off"
                  />
                </div>
              )}
            />
            <ErrorMsg message={errors.id_issue_date?.message} />
          </div>

          <div id="field-idExpiryDate">
            <FieldLabel icon={Calendar}>ID Expiry Date</FieldLabel>
            <Controller
              name="id_expiry_date"
              control={control}
              render={({ field }) => (
                <div className="dob-picker-wrapper mt-1">
                  <DatePicker
                    selected={field.value ? (field.value instanceof Date ? field.value : new Date(field.value)) : null}
                    onChange={(date) => field.onChange(date)}
                    onBlur={field.onBlur}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="YYYY-MM-DD"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    yearDropdownItemNumber={100}
                    scrollableYearDropdown
                    className={fieldCls(errors.id_expiry_date)}
                    wrapperClassName="block w-full"
                    autoComplete="off"
                  />
                </div>
              )}
            />
            <ErrorMsg message={errors.id_expiry_date?.message} />
          </div>
        </div>

        <div className="space-y-2">
          {isNoLimitFound && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl">
              <AlertCircle size={18} className="text-red-600 shrink-0" />
              <span>No limit found in App Configuration. Please configure limits in App Configuration.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-gray-50/80 border border-gray-200 rounded-xl">
            <div>
              <FieldLabel icon={Wallet}>Annual FX &amp; MG Limit</FieldLabel>
              <input
                type="text"
                readOnly
                value={
                  hasFxMgLimit
                    ? effectiveFxAndMgLimit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : 'No limit found'
                }
                className={`mt-1 w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold cursor-not-allowed ${
                  hasFxMgLimit ? 'text-gray-800' : 'text-red-600 font-bold'
                }`}
              />
            </div>
            <div>
              <FieldLabel icon={Wallet}>Annual Compliance Limit</FieldLabel>
              <input
                type="text"
                readOnly
                value={
                  hasComplianceLimit
                    ? effectiveComplianceLimit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : 'No limit found'
                }
                className={`mt-1 w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold cursor-not-allowed ${
                  hasComplianceLimit ? 'text-gray-800' : 'text-red-600 font-bold'
                }`}
              />
            </div>
          </div>
        </div>

        <div>
          <FieldLabel required icon={Globe}>ID Issue Country</FieldLabel>
          {countryError ? (
            <p className="text-[#E00000] text-sm font-medium mt-1">Failed to load countries</p>
          ) : countryLoading ? (
            <div className="h-12 rounded-lg animate-pulse bg-gray-100 mt-1" />
          ) : (
            <div className="relative mt-1">
              <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                {...register('idIssueCountry', { required: 'ID Issue Country is required' })}
                className={`${fieldCls(errors.idIssueCountry)} appearance-none pl-9 pr-9`}>
                <option value="">Select Country</option>
                {countries?.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}
          <ErrorMsg message={errors.idIssueCountry?.message} />
        </div>

        <div>
          <FieldLabel icon={BadgeCheck}>ID Issue State/Province</FieldLabel>
          <input type="text"
            {...register('idIssueState', {

              minLength: { value: 3, message: 'ID Isuue Country is too short' },

            })}
            className={`${fieldCls(errors.idIssueCountry)} mt-1`} />
          <ErrorMsg message={errors.idIssueCountry?.message} />
        </div>

        <div id="field-oetCode">
          <FieldLabel required icon={FileText}>OET Code</FieldLabel>
          {potError ? (
            <p className="text-[#E00000] text-sm font-medium mt-1">Failed to load OET codes</p>
          ) : potLoading ? (
            <div className="h-12 rounded-lg animate-pulse bg-gray-100 mt-1" />
          ) : (
            <div className="relative mt-1">
              <select
                {...register('oet_code', { required: 'OET Code is required' })}
                className={`${fieldCls(errors.oet_code)} appearance-none pr-10`}
                defaultValue="18"
              >
                <option value="" disabled>Select OET Code</option>
                {potOptions.map(pot => (
                  <option key={pot.code} value={pot.code}>{pot.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <ChevronDown size={16} />
              </div>
            </div>
          )}
          <ErrorMsg message={errors.oet_code?.message} />
        </div>

        <div id="field-riskLevel">
          <FieldLabel required icon={ShieldAlert}>Risk Level</FieldLabel>
          <div className="relative mt-1">
            <select
              {...register('risk_level', { required: 'Risk Level is required' })}
              className={`${fieldCls(errors.risk_level)} appearance-none pr-10`}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <ChevronDown size={16} />
            </div>
          </div>
          <ErrorMsg message={errors.risk_level?.message} />
        </div>

        {!useDocumentTable && (<div id="field-docFile">
          <FieldLabel required icon={Upload}>
            {governmentId === 'Passport' ? 'Passport Photo / Scan' : 'Government ID Photo / Scan'}
          </FieldLabel>
          <div className="mt-1">
            {previewUrl ? (
              <div className={`rounded-lg border overflow-hidden ${errors.docFile ? 'border-[#E00000]/30' : 'border-gray-200'}`}>
                {previewFile?.type === 'application/pdf' ? (
                  <div className="flex items-center gap-3 px-4 py-3 bg-white">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#E00000]/5">
                      <FileText size={16} className="text-[#E00000]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{previewFile.name}</p>
                      <p className="text-xs text-gray-400">{(previewFile.size / 1024).toFixed(1)} KB · PDF</p>
                    </div>
                    <button type="button" onClick={removeFile}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#E00000] hover:bg-[#E00000]/5 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <img src={previewUrl} alt="ID" className="w-full max-h-48 object-contain p-3 bg-gray-50" />
                    <button type="button" onClick={removeFile}
                      className="absolute top-2 right-2 w-7 h-7 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center text-gray-400 hover:text-[#E00000] transition-colors">
                      <X size={13} />
                    </button>
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-green-50 border-t border-green-100 text-xs font-medium text-green-700">
                      <CheckCircle2 size={11} strokeWidth={2.5} /> Document uploaded
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <label
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`flex flex-col items-center justify-center gap-3 py-8 px-5 rounded-lg border-2 border-dashed cursor-pointer transition-all ${dragOver
                  ? 'border-[#E00000] bg-[#E00000]/5'
                  : errors.docFile
                    ? 'border-[#E00000]/30 bg-[#E00000]/5/50'
                    : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden" onChange={e => handleFile(e.target.files[0])} />
                <Upload size={20} className={dragOver ? 'text-[#E00000]' : errors.docFile ? 'text-[#E00000]' : 'text-gray-300'} strokeWidth={1.5} />
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Drop here or <span className="text-[#E00000] underline underline-offset-2">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP or PDF · Max 10 MB</p>
                </div>
              </label>
            )}
          </div>
          <ErrorMsg message={errors.docFile?.message} />
        </div>)}

        {/* Travel Details — only for SELL */}
        {exchangeType === 'SELL' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2 p-4 bg-gray-50 border border-gray-100 rounded-xl">
            <div className="sm:col-span-2 py-2 flex items-center gap-2">
              <Plane className="text-[#E00000]" size={18} />
              <p className="text-sm font-semibold text-gray-800">Travel Details</p>
            </div>
            <div id="field-travelDate">
              <FieldLabel required icon={Calendar}>Travel Date</FieldLabel>
              <Controller
                name="travelDate"
                rules={{ required: 'Travel Date is required' }}
                render={({ field }) => (
                  <div className="dob-picker-wrapper mt-1">
                    <DatePicker
                      selected={field.value}
                      onChange={(date) => field.onChange(date)}
                      onBlur={field.onBlur}
                      dateFormat="yyyy-MM-dd"
                      placeholderText="YYYY-MM-DD"
                      minDate={new Date()}
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      className={fieldCls(errors.travelDate)}
                      wrapperClassName="block w-full"
                      autoComplete="off"
                    />
                  </div>
                )}
              />
              <ErrorMsg message={errors.travelDate?.message} />
            </div>
            <div id="field-destination">
              <FieldLabel required icon={MapPin}>Destination</FieldLabel>
              <input type="text" placeholder="Destination"
                {...register('destination', { required: 'Destination is required' })}
                className={`${fieldCls(errors.destination)} mt-1`} />
              <ErrorMsg message={errors.destination?.message} />
            </div>
            <div id="field-airwaysName">
              <FieldLabel required icon={Plane}>Airways Name</FieldLabel>
              <input type="text" placeholder="Airways Name"
                {...register('airwaysName', { required: 'Airways Name is required' })}
                className={`${fieldCls(errors.airwaysName)} mt-1`} />
              <ErrorMsg message={errors.airwaysName?.message} />
            </div>
            <div id="field-flightNumber">
              <FieldLabel required icon={Hash}>Flight Number</FieldLabel>
              <input type="text" placeholder="Flight Number"
                {...register('flightNumber', { required: 'Flight Number is required' })}
                className={`${fieldCls(errors.flightNumber)} mt-1`} />
              <ErrorMsg message={errors.flightNumber?.message} />
            </div>
            <div id="field-pnrNumber">
              <FieldLabel required icon={QrCode}>PNR Number</FieldLabel>
              <input type="text" placeholder="PNR Number"
                {...register('pnrNumber', { required: 'PNR Number is required' })}
                className={`${fieldCls(errors.pnrNumber)} mt-1`} />
              <ErrorMsg message={errors.pnrNumber?.message} />
            </div>

            {/* Ticket Copy Upload Field */}
            {!useDocumentTable && (<div id="field-ticket" className="sm:col-span-2">
              <FieldLabel required icon={Upload}>Ticket Copy</FieldLabel>
              {ticketPreview ? (
                <div className={`rounded-xl border overflow-hidden mt-1 ${errors.ticket ? 'border-[#E00000]/40' : 'border-gray-200'} bg-white shadow-xs`}>
                  {ticketFile?.type === 'application/pdf' ? (
                    <div className="flex items-center justify-between p-3.5 bg-gray-50">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText size={26} className="text-[#E00000] shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-gray-800 text-xs truncate">{ticketFile.name}</p>
                          <p className="text-[11px] text-gray-400">{(ticketFile.size / 1024).toFixed(1)} KB · PDF</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeTicketFile}
                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition cursor-pointer"
                        title="Remove file"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative group flex items-center justify-center bg-gray-50 p-2">
                      <img src={ticketPreview} alt="Ticket Copy" className="w-full max-h-52 object-contain rounded-lg" />
                      <button
                        type="button"
                        onClick={removeTicketFile}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition cursor-pointer"
                        title="Remove image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <label
                  onDragOver={(e) => { e.preventDefault(); setTicketDragOver(true); }}
                  onDragLeave={() => setTicketDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setTicketDragOver(false);
                    handleTicketFile(e.dataTransfer.files[0]);
                  }}
                  className={`flex flex-col items-center justify-center gap-2 py-5 px-5 mt-1 rounded-xl border-2 border-dashed cursor-pointer transition-all bg-white ${
                    ticketDragOver
                      ? 'border-[#E00000] bg-red-50/20'
                      : errors.ticket
                      ? 'border-[#E00000]/60 bg-red-50/10'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                  }`}
                >
                  <Upload size={20} className={errors.ticket ? 'text-[#E00000]' : 'text-gray-400'} strokeWidth={1.5} />
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-700">Click to upload or drag &amp; drop Ticket Copy</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">PDF, PNG, JPG up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => handleTicketFile(e.target.files[0])}
                  />
                </label>
              )}
              <ErrorMsg message={errors.ticket?.message} />
            </div>)}
          </div>
        )}

        {/* RBF Authentication Requirement Section */}
        {showRbfSection && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2 p-4 bg-orange-50/60 border border-orange-200 rounded-xl">
            <div className="sm:col-span-2 flex items-start gap-2.5 py-1">
              <AlertCircle className="text-orange-500 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-semibold text-orange-800">
                  RBF Authentication &amp; Compliance Requirement
                </p>
                <p className="text-xs text-orange-600 mt-0.5">
                  Customer limit thresholds exceeded. Please provide the required information below to proceed.
                </p>
              </div>
            </div>

            {/* 1. RBF ID — when Available Balance <= 0 or < entered forex amount */}
            {showRbfNumber && (
              <div id="field-rbfNumber" className="sm:col-span-2">
                <FieldLabel required icon={Hash}>RBF ID</FieldLabel>
                <input
                  type="text"
                  placeholder="Enter RBF ID"
                  {...register('rbfNumber', {
                    required: 'RBF ID is required when Available Balance is exceeded',
                  })}
                  className={`${fieldCls(errors.rbfNumber)} mt-1 bg-white`}
                />
                <p className="text-[11px] text-orange-700 mt-1">
                  Available FX Balance exceeded. Official RBF authorization ID is mandatory.
                </p>
                <ErrorMsg message={errors.rbfNumber?.message} />
              </div>
            )}

            {/* 2. TIN Number — when Annual FX & MoneyGram Limit <= 0 or < entered forex amount */}
            {showTinNumber && (
              <div id="field-tinNumber" className="sm:col-span-2">
                <FieldLabel required icon={Hash}>TIN Number</FieldLabel>
                <input
                  type="text"
                  placeholder="Enter customer TIN Number"
                  {...register('tinNumber', {
                    required: 'TIN Number is mandatory when Annual FX & MoneyGram Limit is exceeded',
                    minLength: { value: 3, message: 'TIN Number is too short' }
                  })}
                  className={`${fieldCls(errors.tinNumber)} mt-1 bg-white`}
                />
                <p className="text-[11px] text-orange-700 mt-1">
                  Annual FX &amp; MoneyGram Limit exceeded. Updating/confirming customer TIN Number is mandatory.
                </p>
                <ErrorMsg message={errors.tinNumber?.message} />
              </div>
            )}

            {/* 3. Tax Clearance from RBF — when Annual Compliance Limit <= 0 or < entered forex amount */}
            {showTaxClearance && !useDocumentTable && (
              <div id="field-taxClearanceFile" className="sm:col-span-2">
                <FieldLabel required icon={Upload}>Tax Clearance from RBF</FieldLabel>
                <p className="text-xs text-orange-700 mb-2">
                  Annual Compliance Limit exceeded. A valid Tax Clearance reference document from RBF is required before proceeding with transaction.
                </p>
                <div className="mt-1">
                  {taxClearancePreview ? (
                    <div className={`rounded-lg border overflow-hidden ${errors.taxClearanceFile ? 'border-[#E00000]/30' : 'border-gray-200'}`}>
                      {taxClearanceFile?.type === 'application/pdf' ? (
                        <div className="flex items-center gap-3 px-4 py-3 bg-white">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-orange-500/10">
                            <FileText size={16} className="text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 text-sm truncate">{taxClearanceFile.name}</p>
                            <p className="text-xs text-gray-400">{(taxClearanceFile.size / 1024).toFixed(1)} KB · PDF</p>
                          </div>
                          <button type="button" onClick={removeTaxClearanceFile}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#E00000] hover:bg-orange-100 transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="relative bg-white p-2">
                          <img src={taxClearancePreview} alt="Tax Clearance" className="w-full max-h-48 object-contain p-2 bg-gray-50 rounded" />
                          <button type="button" onClick={removeTaxClearanceFile}
                            className="absolute top-3 right-3 w-7 h-7 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center text-gray-400 hover:text-[#E00000] transition-colors">
                            <X size={13} />
                          </button>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border-t border-green-100 text-xs font-medium text-green-700 mt-2 rounded">
                            <CheckCircle2 size={11} strokeWidth={2.5} /> Tax Clearance document uploaded
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <label
                      onDragOver={e => { e.preventDefault(); setTaxClearanceDragOver(true); }}
                      onDragLeave={() => setTaxClearanceDragOver(false)}
                      onDrop={e => {
                        e.preventDefault();
                        setTaxClearanceDragOver(false);
                        if (e.dataTransfer.files?.[0]) handleTaxClearanceFile(e.dataTransfer.files[0]);
                      }}
                      className={`flex flex-col items-center justify-center gap-2 py-6 px-5 rounded-lg border-2 border-dashed cursor-pointer transition-all ${taxClearanceDragOver
                        ? 'border-orange-500 bg-orange-50'
                        : errors.taxClearanceFile
                          ? 'border-[#E00000] bg-[#E00000]/5'
                          : 'border-orange-200 bg-white hover:border-orange-300 hover:bg-orange-50/50'
                        }`}>
                      <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="hidden" onChange={e => {
                          if (e.target.files?.[0]) handleTaxClearanceFile(e.target.files[0]);
                        }} />
                      <Upload size={20} className={errors.taxClearanceFile ? 'text-[#E00000]' : 'text-orange-400'} strokeWidth={1.5} />
                      <div className="text-center">
                        <p className="text-sm text-gray-700 font-medium">
                          Drop here or <span className="text-orange-600 underline underline-offset-2">browse</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG or WEBP · Max 10 MB</p>
                      </div>
                    </label>
                  )}
                </div>
                <ErrorMsg message={errors.taxClearanceFile?.message} />
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
