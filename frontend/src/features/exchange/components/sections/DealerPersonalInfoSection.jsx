import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { User, Calendar, FileText, ChevronDown, Upload, CheckCircle2, X, Search, RefreshCw, Plus, Hash } from 'lucide-react';
import { FieldLabel, fieldCls, ErrorMsg } from '../ui/FormUtilities';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useCustomer } from '../../hooks/useCustomer';
import { useAppConfiguration } from '../../../../hooks/useAppConfiguration';
import { useUser } from '../../../../context/UserContext';
import { sessionAxios as axios } from '../../../../api/sessionClient.js';
import { fetchNewCustomerId } from '../../api/customer';
import { sanitizeCustomerInput, isAllowedCustomerChar } from '../../../../utils/sanitizeInput';

export const DealerPersonalInfoSection = ({
  hideCardWrapper = false,
  hideDocFile = false,
  onResetAllFields,
  onDealerChange,
  selectedDealer: controlledDealer,
}) => {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const { previewUrl, previewFile, fetchAndFillCustomer, removeFile, handleFile } = useCustomer();
  const { potOptions, loading: potLoading, error: potError } = useAppConfiguration();
  const loginUser = useUser();
  const [dragOver, setDragOver] = useState(false);

  // Combobox & Dealer Search State
  const [dealers, setDealers] = useState([]);
  const [dealersLoading, setDealersLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [nameQuery, setNameQuery] = useState(() => {
    return sanitizeCustomerInput(controlledDealer?.custom_full_name || controlledDealer?.customer_name || watch('fullName') || '');
  });
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedDealer, setSelectedDealer] = useState(controlledDealer || null);

  useEffect(() => {
    if (controlledDealer === null && selectedDealer !== null) {
      setSelectedDealer(null);
    } else if (controlledDealer && (!selectedDealer || selectedDealer.name !== controlledDealer.name)) {
      setSelectedDealer(controlledDealer);
      const dName = sanitizeCustomerInput(controlledDealer.custom_full_name || controlledDealer.customer_name || controlledDealer.name || '');
      if (dName) setNameQuery(dName);
    }
  }, [controlledDealer]);

  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const masterListRef = useRef([]);

  // Watch fullName and customer_id
  const fullName = watch('fullName');
  const customerId = watch('customer_id');

  // Auto-generate unique 6-character Customer ID (ME#### series) if empty
  useEffect(() => {
    if (!customerId && loginUser?.user && !selectedDealer) {
      fetchNewCustomerId(loginUser).then((code) => {
        if (code) setValue('customer_id', code);
      });
    }
  }, [customerId, loginUser, setValue, selectedDealer]);

  const handleRegenerateId = async () => {
    const code = await fetchNewCustomerId(loginUser);
    if (code) setValue('customer_id', code);
  };

  register('fullName', {
    required: 'Full Name is required',
    minLength: { value: 3, message: 'Name is too short' },
  });

  register('docFile', {
    required: 'Passport photo / scan is required',
    validate: (v) => {
      if (!v) return 'Passport photo / scan is required';
      return true;
    },
  });

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Search dealers from Customer DocType with customer_group = 'Dealer'
  const searchDealers = useCallback(
    async (searchTerm = '') => {
      if (!loginUser?.user) return;
      setDealersLoading(true);
      try {
        let list = [];

        // 1. Try get_customers_list with customer_group='Dealer'
        try {
          const res = await axios.get(
            '/api/method/moneygram.moneygram.api.get_transactions.get_customers_list',
            {
              params: {
                search: searchTerm.trim() || undefined,
                customer_group: 'Dealer',
                limit: 50,
              },
            }
          );
          const raw = res.data?.message ?? [];
          if (Array.isArray(raw)) {
            // Strictly keep only customer_group === 'Dealer'
            list = raw.filter(
              (c) => (c?.customer_group || '').trim().toLowerCase() === 'dealer'
            );
          }
        } catch (err) {
          console.warn('[DealerSearch] get_customers_list error:', err);
        }

        // 2. Direct Customer doctype fallback query strictly with customer_group = 'Dealer'
        // Only run fallback if list is empty, and NEVER use or_filters as it overrides the AND condition
        if (list.length === 0) {
          try {
            const params = {
              filters: JSON.stringify([['customer_group', '=', 'Dealer']]),
              fields: JSON.stringify([
                'name',
                'customer_name',
                'customer_group',
                'custom_customer_id',
                'custom_full_name',
                'custom_first_name',
                'custom_middle_name',
                'custom_last_name',
                'custom_date_of_birth',
                'mobile_no',
                'image',
                'custom_government_document',
                'custom_government_id',
                'custom_passport_number',
              ]),
              limit_page_length: 50,
            };

            const directRes = await axios.get('/api/resource/Customer', { params });
            const directCusts = directRes.data?.data ?? [];
            directCusts.forEach((dc) => {
              if ((dc.customer_group || '').trim().toLowerCase() === 'dealer') {
                dc.customer_id = dc.custom_customer_id || dc.name;
                if (!list.some((existing) => existing.name === dc.name)) {
                  list.push(dc);
                }
              }
            });
          } catch (e) {
            console.warn('[DealerSearch] Direct Customer query error:', e);
          }
        }

        // 3. Absolute client-side guarantee: Only customer_group === 'Dealer' can ever enter state
        const strictlyDealers = (Array.isArray(list) ? list : []).filter(
          (c) => (c?.customer_group || '').trim().toLowerCase() === 'dealer'
        );

        if (!searchTerm && strictlyDealers.length > 0) {
          masterListRef.current = strictlyDealers;
        }
        setDealers(strictlyDealers);
      } catch (err) {
        console.error('Error searching dealers in Customer doctype:', err);
      } finally {
        setDealersLoading(false);
      }
    },
    [loginUser]
  );

  // Filtered & scored matching dealers
  const visibleDealers = useMemo(() => {
    const q = (nameQuery || '').trim().toLowerCase();
    const source = (masterListRef.current.length > 0 ? masterListRef.current : dealers)
      .filter((c) => (c?.customer_group || '').trim().toLowerCase() === 'dealer');

    if (!q) {
      return source.slice(0, 20);
    }

    const cleanQ = q.trim().toLowerCase();
    const cleanDigits = cleanQ.replace(/[\s\-\(\)\+]/g, '');

    const getScore = (c) => {
      const name = (c.custom_full_name || c.customer_name || '').toLowerCase();
      const id = (c.custom_customer_id || c.customer_id || c.name || '').toLowerCase();
      const phone = (c.mobile_no || c.phone_number || c.phone || '').toLowerCase();
      const dob = (c.custom_date_of_birth || '').toLowerCase();
      const passport = (c.custom_passport_number || '').toLowerCase();

      if (cleanDigits && phone) {
        const phoneDigits = phone.replace(/[\s\-\(\)\+]/g, '');
        if (phoneDigits === cleanDigits) return 100;
        if (phoneDigits.includes(cleanDigits)) return 92;
      }

      if (id === cleanQ) return 100;
      if (name === cleanQ) return 95;
      if (id.startsWith(cleanQ)) return 88;
      if (name.startsWith(cleanQ)) return 85;
      if (name.includes(cleanQ)) return 70;
      if (id.includes(cleanQ)) return 60;
      if (passport.includes(cleanQ)) return 55;
      if (dob.includes(cleanQ)) return 50;

      return 0;
    };

    const scored = [];
    const seen = new Set();

    source.forEach((c) => {
      const cId = c?.custom_customer_id || c?.name;
      if (!cId || seen.has(cId)) return;
      seen.add(cId);
      const score = getScore(c);
      if (score > 0) scored.push({ c, score });
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map((item) => item.c).slice(0, 20);
  }, [dealers, nameQuery]);

  // Prevent typing of any disallowed special characters before input is inserted
  const handleBeforeInput = (e) => {
    if (e.data && !isAllowedCustomerChar(e.data)) {
      e.preventDefault();
    }
  };

  // Sanitize text pasted into the dealer name input
  const handlePaste = (e) => {
    const pasted = e.clipboardData?.getData('text') || '';
    const sanitized = sanitizeCustomerInput(pasted);
    if (sanitized !== pasted) {
      e.preventDefault();
      const input = e.target;
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      const current = input.value || '';
      const updated = current.slice(0, start) + sanitized + current.slice(end);
      handleNameQueryChange(updated);
    }
  };

  // Handle typing in combobox
  const handleNameQueryChange = (val) => {
    const sanitizedVal = sanitizeCustomerInput(val);
    const isCleared = !sanitizedVal || !sanitizedVal.trim();
    const hadSelectedDealer = Boolean(
      selectedDealer && (selectedDealer.name || selectedDealer.customer_id || selectedDealer.custom_customer_id)
    );
    const prevName = selectedDealer?.custom_full_name || selectedDealer?.customer_name || selectedDealer?.name || '';

    setNameQuery(sanitizedVal);
    setValue('fullName', sanitizedVal, { shouldValidate: true, shouldDirty: true });

    if (isCleared) {
      if (hadSelectedDealer) {
        onResetAllFields?.();
        handleClearDealer(false);
      } else {
        setValue('fullName', '');
        setNameQuery('');
      }
      return;
    }

    if (hadSelectedDealer && sanitizedVal !== prevName) {
      setValue('fullName', sanitizedVal, { shouldValidate: true, shouldDirty: true });
      setNameQuery(sanitizedVal);
    }

    if (!selectedDealer && sanitizedVal) {
      const parts = sanitizedVal.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 1) {
        setValue('firstName', parts[0], { shouldValidate: true });
        setValue('middleName', '', { shouldValidate: true });
        setValue('lastName', '', { shouldValidate: true });
      } else if (parts.length === 2) {
        setValue('firstName', parts[0], { shouldValidate: true });
        setValue('middleName', '', { shouldValidate: true });
        setValue('lastName', parts[1], { shouldValidate: true });
      } else if (parts.length > 2) {
        setValue('firstName', parts[0], { shouldValidate: true });
        setValue('middleName', parts.slice(1, -1).join(' '), { shouldValidate: true });
        setValue('lastName', parts[parts.length - 1], { shouldValidate: true });
      }
    }

    setIsDropdownOpen(true);
    setHighlightedIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchDealers(sanitizedVal);
    }, 250);
  };

  // Handle typing in separate name fields
  const handleSeparateNameChange = (fieldName, val) => {
    setValue(fieldName, val, { shouldValidate: true, shouldDirty: true });
    if (!selectedDealer) {
      const curFirst = fieldName === 'firstName' ? val : (watch('firstName') || '');
      const curMiddle = fieldName === 'middleName' ? val : (watch('middleName') || '');
      const curLast = fieldName === 'lastName' ? val : (watch('lastName') || '');
      const combined = [curFirst, curMiddle, curLast].filter(Boolean).join(' ');
      if (combined) {
        setValue('fullName', combined, { shouldValidate: true, shouldDirty: true });
        setNameQuery(combined);
      }
    }
  };

  // Handle user detail edit when an existing dealer was loaded
  const handleUserDetailEdit = useCallback(() => {
    // Do not reset the form on editing dealer details
  }, []);

  // Keyboard navigation for dropdown
  const handleKeyDown = (e) => {
    if (!isDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsDropdownOpen(true);
        if (dealers.length === 0) searchDealers(nameQuery);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < visibleDealers.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : visibleDealers.length - 1
      );
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && visibleDealers[highlightedIndex]) {
        e.preventDefault();
        handleSelectDealer(visibleDealers[highlightedIndex]);
      } else {
        e.preventDefault();
        setIsDropdownOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  // Select dealer from combobox dropdown
  const handleSelectDealer = async (c) => {
    if (!c) return;

    // Reset previous dealer fields when selecting an existing dealer
    onResetAllFields?.();

    setSelectedDealer(c);
    onDealerChange?.(c);

    const chosenFullName = sanitizeCustomerInput(c.custom_full_name || c.customer_name || c.name || '');
    const chosenFirstName = c.custom_first_name || chosenFullName.split(' ')[0] || '';
    const chosenMiddleName = c.custom_middle_name || '';
    const chosenLastName = c.custom_last_name || chosenFullName.split(' ').slice(1).join(' ') || '';
    const chosenId = c.custom_customer_id || c.name || '';
    const docImg = c.custom_government_document || c.image;

    setNameQuery(chosenFullName);
    setValue('fullName', chosenFullName, { shouldValidate: true, shouldDirty: true });
    setValue('firstName', chosenFirstName, { shouldValidate: true, shouldDirty: true });
    setValue('middleName', chosenMiddleName, { shouldValidate: true, shouldDirty: true });
    setValue('lastName', chosenLastName, { shouldValidate: true, shouldDirty: true });
    setValue('customer_id', chosenId, { shouldValidate: true, shouldDirty: true });

    if (c.custom_date_of_birth) {
      const parsedDate = new Date(c.custom_date_of_birth);
      if (!isNaN(parsedDate.getTime())) {
        setValue('dateOfBirth', parsedDate, { shouldValidate: true, shouldDirty: true });
      }
    }

    if (docImg) {
      const url = docImg.startsWith('http') || docImg.startsWith('/') ? docImg : `/${docImg}`;
      setValue('docFile', url, { shouldValidate: true });
    }

    setIsDropdownOpen(false);

    try {
      await fetchAndFillCustomer(c.name);
    } catch (err) {
      console.warn('Error fetching full dealer profile:', err);
    }
  };

  // Clear dealer selection
  const handleClearDealer = (keepName = false) => {
    setSelectedDealer(null);
    onDealerChange?.(null);
    if (!keepName) {
      setNameQuery('');
      setValue('fullName', '', { shouldValidate: true });
    }
    setValue('firstName', '', { shouldValidate: true });
    setValue('middleName', '', { shouldValidate: true });
    setValue('lastName', '', { shouldValidate: true });
    setValue('customer_id', '');
    removeFile();
    if (loginUser?.user) {
      fetchNewCustomerId(loginUser).then((code) => {
        if (code) setValue('customer_id', code);
      }).catch((e) => console.error('Failed to regenerate Dealer ID on clear:', e));
    }
  };

  return (
    <div id="section-dealer-personal-info" className={hideCardWrapper ? "flex flex-col gap-5 w-full min-w-0" : "rounded-2xl border border-line overflow-hidden bg-surface shadow-xs"}>
      {!hideCardWrapper ? (
        <div className="px-5 sm:px-6 py-4 border-b border-line flex items-center justify-between gap-3 bg-surface">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-surface-alt border border-line flex items-center justify-center text-ink shrink-0">
              <User size={16} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-ink leading-tight">Personal Information</h3>
              <p className="text-xs text-muted mt-0.5 truncate">Select an existing registered dealer or enter new details</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 shrink-0">
              <User size={12} strokeWidth={2.5} /> Dealer Check
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between pb-3 ">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-surface-alt border border-line flex items-center justify-center text-ink shrink-0">
              <User size={15} strokeWidth={2} />
            </div>
            <div>
              <h4 className="text-xs uppercase font-bold text-ink tracking-wider">
                Dealer Details &amp; Lookup
              </h4>
              <p className="text-caption text-muted">Select an existing registered dealer or enter new details</p>
            </div>
          </div>
        </div>
      )}

      <div className={hideCardWrapper ? "flex flex-col gap-5" : "p-5 sm:p-6 flex flex-col gap-5"}>
        {/* Row 1: Full Name / Dealer Selection Combobox */}
        <div id="field-fullName" className="relative" ref={containerRef}>
          <div className="flex items-center justify-between">
            <FieldLabel required icon={FileText}>Dealer Full Name</FieldLabel>
            {selectedDealer && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
                <CheckCircle2 size={12} className="text-green-600" />
                <span>Existing Dealer ({selectedDealer.custom_customer_id || selectedDealer.name})</span>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedDealer) onResetAllFields?.();
                    handleClearDealer(false);
                  }}
                  className="ml-1 text-gray-400 hover:text-red-600 cursor-pointer"
                  title="Clear dealer selection"
                >
                  <X size={11} />
                </button>
              </span>
            )}
          </div>

          <div className="relative mt-1">
            <input
              type="text"
              name="search_dealer_name_field"
              id="search_dealer_name_input"
              placeholder="Type dealer name, Customer ID, or phone to search..."
              autoComplete="one-time-code"
              data-lpignore="true"
              data-1p-ignore="true"
              data-form-type="other"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={isDropdownOpen}
              value={nameQuery !== '' ? nameQuery : (fullName || '')}
              onFocus={() => {
                setIsDropdownOpen(true);
                if (dealers.length === 0) {
                  searchDealers('');
                }
              }}
              onBeforeInput={handleBeforeInput}
              onPaste={handlePaste}
              onChange={(e) => handleNameQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`${fieldCls(errors.fullName)} pr-10 bg-surface`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted flex items-center gap-1.5">
              {dealersLoading ? (
                <RefreshCw size={14} className="animate-spin text-brand-600" />
              ) : nameQuery || selectedDealer ? (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedDealer) onResetAllFields?.();
                    handleClearDealer(false);
                  }}
                  className="p-0.5 hover:text-ink text-muted cursor-pointer"
                  title="Clear"
                >
                  <X size={14} />
                </button>
              ) : (
                <Search size={14} />
              )}
            </div>
          </div>
          <ErrorMsg message={errors.fullName?.message} />

          {/* Autocomplete Dropdown for Dealer */}
          {isDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-full min-w-[320px] bg-surface border border-line rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in duration-100">
              <div className="px-3.5 py-2 bg-surface-alt border-b border-line flex items-center justify-between text-[11px] text-muted font-medium">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted">
                  <User size={12} className="text-brand-600" />
                  Matching Dealers ({visibleDealers.length})
                </span>
                {dealersLoading ? (
                  <span className="flex items-center gap-1 text-muted text-overline">
                    <RefreshCw size={10} className="animate-spin" /> Searching…
                  </span>
                ) : (
                  <span className="text-overline text-muted">Select to auto-fill details</span>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-line">
                {dealersLoading && visibleDealers.length === 0 ? (
                  <div className="px-4 py-5 text-center text-xs text-muted flex items-center justify-center gap-2">
                    <RefreshCw size={13} className="animate-spin text-muted" />
                    <span>Searching dealer records…</span>
                  </div>
                ) : visibleDealers.length === 0 ? (
                  <div className="px-4 py-4 text-center text-xs text-muted">
                    <p className="font-semibold text-ink">No matching dealer</p>
                    <p className="text-caption text-muted mt-0.5">
                      Enter details to register as new dealer
                    </p>
                  </div>
                ) : (
                  visibleDealers.map((c, idx) => {
                    const isHighlighted = idx === highlightedIndex;
                    const cName = c.custom_full_name || c.customer_name || c.name;
                    const cId = c.custom_customer_id || c.customer_id || c.name;
                    const phoneNum = c.mobile_no || c.phone_number || c.phone;
                    const dob = c.custom_date_of_birth;

                    return (
                      <div
                        key={c.name || cId || idx}
                        onClick={() => handleSelectDealer(c)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${isHighlighted ? 'bg-danger-bg text-ink' : 'hover:bg-chip text-ink'
                          }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-ink truncate">{cName}</span>
                            <span className="text-overline font-mono font-semibold px-1.5 py-0.5 rounded bg-chip text-muted">
                              {cId}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-caption text-muted mt-0.5">
                            {dob && <span>DOB: {dob}</span>}
                            {phoneNum && <span className="text-ink font-medium">📞 {phoneNum}</span>}
                          </div>
                        </div>
                        <div className="text-overline font-mono font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200 whitespace-nowrap ml-2">
                          Dealer
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Row 2: First Name, Middle Name, Last Name (3 columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div id="field-firstName">
            <FieldLabel required icon={User}>First Name</FieldLabel>
            <input
              type="text"
              placeholder="e.g. John"
              {...register('firstName', {
                required: 'First Name is required',
                minLength: { value: 2, message: 'First name is too short' },
              })}
              onChange={(e) => handleSeparateNameChange('firstName', e.target.value)}
              className={`${fieldCls(errors.firstName)} mt-1`}
            />
            <ErrorMsg message={errors.firstName?.message} />
          </div>

          <div id="field-middleName">
            <FieldLabel icon={User}>Middle Name</FieldLabel>
            <input
              type="text"
              placeholder="e.g. Robert (optional)"
              {...register('middleName')}
              onChange={(e) => handleSeparateNameChange('middleName', e.target.value)}
              className={`${fieldCls(errors.middleName)} mt-1 border-gray-200`}
            />
            <ErrorMsg message={errors.middleName?.message} />
          </div>

          <div id="field-lastName">
            <FieldLabel required icon={User}>Last Name</FieldLabel>
            <input
              type="text"
              placeholder="e.g. Smith"
              {...register('lastName', {
                required: 'Last Name is required',
                minLength: { value: 2, message: 'Last name is too short' },
              })}
              onChange={(e) => handleSeparateNameChange('lastName', e.target.value)}
              className={`${fieldCls(errors.lastName)} mt-1`}
            />
            <ErrorMsg message={errors.lastName?.message} />
          </div>
        </div>

        {/* Row 3: Date of Birth, OET Code & Dealer ID (3 columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      if (selectedDealer) handleUserDetailEdit();
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

          <div id="field-customerId">
            <div className="flex items-center justify-between">
              <FieldLabel icon={Hash}>Dealer ID</FieldLabel>
              {!selectedDealer && (
                <button
                  type="button"
                  onClick={handleRegenerateId}
                  className="text-[11px] text-gray-500 hover:text-[#E00000] flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  title="Generate new Dealer ID"
                >
                  <RefreshCw size={11} /> Regenerate
                </button>
              )}
            </div>
            <div className="relative mt-1">
              <input
                type="text"
                readOnly
                placeholder="Auto-generating ID..."
                value={customerId || ''}
                {...register('customer_id')}
                className={`w-full px-3.5 py-2.5 rounded-lg border font-mono font-bold tracking-widest text-sm bg-gray-50 ${customerId ? 'text-[#E00000] border-gray-300' : 'text-gray-400 border-gray-200'
                  }`}
              />
            </div>
            <ErrorMsg message={errors.customer_id?.message} />
          </div>
        </div>

        {/* Mandatory Passport Photo / Scan Field */}
        {!hideDocFile && (
          <div id="field-docFile" className="md:col-span-2">
            <FieldLabel required icon={Upload}>
              Passport Photo / Scan
            </FieldLabel>
            <div className="mt-1">
              {previewUrl ? (
                <div className={`rounded-lg border overflow-hidden ${errors.docFile ? 'border-brand-600/30' : 'border-line'}`}>
                  {previewFile?.type === 'application/pdf' ? (
                    <div className="flex items-center gap-3 px-4 py-3 bg-surface">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-brand-50">
                        <FileText size={16} className="text-brand-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-ink text-sm truncate">{previewFile.name}</p>
                        <p className="text-xs text-muted">{(previewFile.size / 1024).toFixed(1)} KB · PDF</p>
                      </div>
                      <button type="button" onClick={removeFile}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <img src={previewUrl} alt="Passport" className="w-full max-h-48 object-contain p-3 bg-surface-alt" />
                      <button type="button" onClick={removeFile}
                        className="absolute top-2 right-2 w-7 h-7 bg-surface border border-line rounded-lg shadow-sm flex items-center justify-center text-muted hover:text-brand-600 transition-colors cursor-pointer">
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
                      ? 'border-[#E00000]/30 bg-[#E00000]/5'
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
          </div>
        )}

      </div>
    </div>
  );
};
