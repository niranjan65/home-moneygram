import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { ChevronDown, Eye } from 'lucide-react';
import { sessionFetch as fetch } from '../../../../api/sessionClient';
import { useERPFileUpload } from '../../../../hooks/useERPFileUpload';
import DocumentPreviewModal from '../../../../components/DocumentPreviewModal';

const money = value => `FJ$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const labelStyle = "text-xs uppercase font-bold text-gray-700 tracking-wider mb-2 block";
const selectStyle = "w-full min-w-0 box-border bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E00000] focus:bg-white placeholder:text-gray-400 transition-all duration-200 appearance-none pr-10 cursor-pointer";
const inputStyle = "w-full min-w-0 box-border bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E00000] focus:bg-white placeholder:text-gray-400 transition-all duration-200";

export function RbfComplianceSection({
  transactionType = 'MONEY_EXCHANGE', fjdAmount, exchangeType, currency = 'FJD', rate,
  customerId, recipientName, value, onChange, disabled = false,
  hideIdentityScreening = true,
  hideCardHeader = false,
  onAssessmentChange,
  onConfigChange,
}) {
  const formContext = useFormContext();
  const { uploadFile } = useERPFileUpload();
  const [config, setConfig] = useState({ enabled: false, purposes: [], documents: [], source_of_funds: [], can_verify_documents: false });
  const [assessment, setAssessment] = useState(null);

  useEffect(() => {
    if (typeof onAssessmentChange === 'function') {
      onAssessmentChange(assessment);
    }
  }, [assessment, onAssessmentChange]);

  useEffect(() => {
    if (typeof onConfigChange === 'function') {
      onConfigChange(config);
    }
  }, [config, onConfigChange]);
  const [sanctionsPreview, setSanctionsPreview] = useState(null);
  const [sanctionsLoading, setSanctionsLoading] = useState(false);
  const [sanctionsError, setSanctionsError] = useState('');
  const [ignoredReferences, setIgnoredReferences] = useState([]);
  const [dismissedScreeningFingerprint, setDismissedScreeningFingerprint] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [error, setError] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);

  const getField = name => value ? value[name] : formContext?.watch(name);
  const setField = (name, next) => {
    if (onChange) onChange({ ...(value || {}), [name]: next });
    else formContext?.setValue(name, next, { shouldDirty: true, shouldValidate: true });
  };
  const setFields = updates => {
    if (onChange) onChange({ ...(value || {}), ...updates });
    else Object.entries(updates).forEach(([name, next]) => formContext?.setValue(name, next, { shouldDirty: true, shouldValidate: true }));
  };
  const purpose = getField('rbf_purpose') || '';
  const documents = getField('rbf_documents') || [];

  const handlePurposeChange = (newPurpose) => {
    if (newPurpose === purpose) return;

    // Completely reset attached compliance documents and remove any compliance document rows added
    const updates = {
      rbf_purpose: newPurpose,
      rbf_documents: [],
      passport_endorsement_completed: 0,
      passport_endorsed: 0,
      tf_form_reference: '',
      rbf_approval: '',
      imported_funds_available_fjd: '',
      rbf_beneficiary_reference: '',
      rbf_student_reference: '',
      rbf_family_reference: '',
      rbf_invoice_reference: '',
    };

    setAssessment(null);
    if (typeof onAssessmentChange === 'function') {
      onAssessmentChange(null);
    }
    setFields(updates);
  };

  const prevPurposeRef = useRef(purpose);
  useEffect(() => {
    if (prevPurposeRef.current !== undefined && prevPurposeRef.current !== purpose) {
      prevPurposeRef.current = purpose;
      if (documents && documents.length > 0) {
        setField('rbf_documents', []);
      }
    } else {
      prevPurposeRef.current = purpose;
    }
  }, [purpose, documents]);
  const nationality = getField('nationality') || getField('rbf_nationality') || '';
  const nationalityType = getField('nationality_type') || getField('rbf_nationality_type') || (nationality ? (String(nationality).toLowerCase() === 'fiji' ? 'FIJI' : 'OTHER') : '');
  const otherNationality = getField('other_nationality') || getField('rbf_other_nationality') || (nationalityType === 'OTHER' ? nationality : '');
  const residencyStatus = getField('residency_status') || getField('rbf_residency_status') || '';
  const sourceOfFunds = getField('source_of_funds') || getField('rbf_source_of_funds') || '';
  const direction = String(exchangeType || (transactionType === 'MONEY_TRANSFER' ? 'SEND' : '')).toUpperCase();
  const selectedPurpose = (config.purposes || []).find(item => item.name === purpose);
  const limitScope = selectedPurpose?.limit_scope || '';
  const screeningName = String(getField('full_name') || getField('custom_full_name') || [getField('firstName'), getField('lastName')].filter(Boolean).join(' ') || '').trim();
  const screeningIdType = String(getField('government_id_type') || getField('government_id') || getField('idType') || '').toLowerCase();
  const screeningIdNumber = getField('government_id_number') || getField('idNumber') || '';
  const screeningSubject = {
    name: screeningName,
    date_of_birth: getField('dob') || getField('dateOfBirth') || getField('custom_date_of_birth') || '',
    country: getField('country') || getField('nationality') || getField('rbf_nationality') || '',
    phone_number: getField('phone_number') || getField('phone') || getField('mobile_no') || '',
    passport_number: screeningIdType.includes('passport') ? screeningIdNumber : (getField('passport_number') || getField('custom_passport_number') || ''),
    national_id_number: screeningIdType.includes('passport') ? '' : screeningIdNumber,
    entry_type: getField('customer_type') === 'Company' ? 'Entity' : 'Individual',
  };
  const screeningFingerprint = JSON.stringify(screeningSubject);

  useEffect(() => {
    if (hideIdentityScreening || screeningName.length < 3) {
      setSanctionsPreview(null);
      setSanctionsError('');
      return;
    }
    const timer = window.setTimeout(async () => {
      setSanctionsLoading(true);
      setSanctionsError('');
      try {
        const response = await fetch('/api/method/moneygram.sanctions.service.preview_subject', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ subject: screeningSubject }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result?.exception || 'Identity screening failed.');
        setSanctionsPreview(result?.message || null);
      } catch (err) {
        setSanctionsPreview(null);
        setSanctionsError(err.message || 'Identity screening failed.');
      } finally {
        setSanctionsLoading(false);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [hideIdentityScreening, screeningFingerprint]);

  useEffect(() => {
    const query = new URLSearchParams({ transaction_type: transactionType, transaction_direction: direction });
    fetch(`/api/method/moneygram.moneygram.api.rbf_compliance.get_configuration?${query}`, { credentials: 'include' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Unable to load RBF configuration.')))
      .then(result => {
        const nextConfig = result?.message || { enabled: false, purposes: [], documents: [] };
        setConfig(nextConfig);
        const allowed = nextConfig.purposes || [];
        if (purpose && !allowed.some(item => item.name === purpose)) handlePurposeChange('');
        else if (!purpose && allowed.length === 1) setField('rbf_purpose', allowed[0].name);
      })
      .catch(err => setError(err.message));
  }, [transactionType, direction]);

  useEffect(() => {
    if (!customerId || !direction) return;
    const query = new URLSearchParams({ customer_id: customerId, transaction_type: transactionType, transaction_direction: direction });
    fetch(`/api/method/moneygram.moneygram.api.rbf_compliance.get_last_transaction_prefill?${query}`, { credentials: 'include' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Unable to load previous RBF values.')))
      .then(result => {
        const previous = result?.message?.values || {};
        const updates = {};
        const mapping = {
          rbf_purpose: 'rbf_purpose', rbf_source_of_funds: 'rbf_source_of_funds',
          rbf_nationality_type: 'nationality_type', rbf_nationality: 'nationality',
          rbf_other_nationality: 'other_nationality', rbf_residency_status: 'residency_status',
        };
        Object.entries(mapping).forEach(([source, target]) => {
          if (previous[source] && !getField(target) && !getField(source)) updates[target] = previous[source];
        });
        if (Object.keys(updates).length) setFields(updates);
      })
      .catch(() => { });
  }, [customerId, transactionType, direction]);

  useEffect(() => {
    if (!purpose || !fjdAmount) {
      setAssessment(null);
      return;
    }
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const data = {
          transaction_type: transactionType,
          transaction_direction: direction,
          rbf_purpose: purpose,
          local_amount: Number(fjdAmount || 0), fjd_equivalent: Number(fjdAmount || 0),
          local_currency: 'FJD', currency, exchange_rate: rate,
          customer_id: customerId, receiver_name: recipientName || getField('receiver_name'),
          beneficiary_id: getField('rbf_beneficiary_reference'),
          student_id: getField('rbf_student_reference'),
          family_reference: getField('rbf_family_reference'),
          invoice_reference: getField('rbf_invoice_reference'),
          departure_date: getField('travelDate') || getField('departure_date'),
          nationality, nationality_type: nationalityType, other_nationality: otherNationality, residency_status: residencyStatus, source_of_funds: sourceOfFunds,
          rbf_documents: documents,
          passport_endorsement_completed: getField('passport_endorsement_completed') || getField('passport_endorsed') ? 1 : 0,
          tf_form_reference: getField('tf_form_reference'),
          rbf_approval: getField('rbf_approval'),
          imported_funds_available_fjd: getField('imported_funds_available_fjd'),
        };
        const response = await fetch('/api/method/moneygram.moneygram.api.rbf_compliance.assess_transaction', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ data }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result?.exception || 'RBF validation failed.');
        setAssessment(result?.message || null);
      } catch (err) {
        setError(err.message || 'RBF validation failed.');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [transactionType, purpose, fjdAmount, direction, currency, rate, customerId, recipientName, nationality, nationalityType, otherNationality, residencyStatus, sourceOfFunds, JSON.stringify(documents), getField('travelDate'), getField('departure_date'), getField('passport_endorsement_completed'), getField('passport_endorsed'), getField('tf_form_reference'), getField('rbf_approval'), getField('imported_funds_available_fjd'), getField('rbf_beneficiary_reference'), getField('rbf_student_reference'), getField('rbf_family_reference'), getField('rbf_invoice_reference')]);

  const availableDocuments = useMemo(() => {
    const applicable = assessment?.available_documents || assessment?.required_documents || [];
    if (!applicable.length) return config.documents || [];
    return (config.documents || []).filter(document => applicable.includes(document.name) || applicable.includes(document.document_code));
  }, [config.documents, assessment]);

  const addDocument = () => setField('rbf_documents', [...documents, { document_type: '', attachment: '', verification_status: 'PENDING' }]);
  const updateDocument = (index, patch) => setField('rbf_documents', documents.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  const removeDocument = index => setField('rbf_documents', documents.filter((_, rowIndex) => rowIndex !== index));
  const attachDocument = async (index, file) => {
    if (!file) return;
    setUploadingIndex(index);
    setError('');
    try {
      const attachment = await uploadFile(file, { isPrivate: 1 });
      updateDocument(index, { attachment, file_name: file.name, verification_status: 'PENDING' });
    } catch (err) {
      setError(err.message || 'The supporting document could not be uploaded.');
    } finally {
      setUploadingIndex(null);
    }
  };

  const sanctions = sanctionsPreview || assessment?.sanctions_screening;
  const sanctionsMatches = sanctions?.matches || [];
  const riskCandidates = sanctions?.risk_candidates || [];
  const sanctionsBlocked = ['DO_NOT_PROCEED', 'REVIEW_REQUIRED'].includes(sanctions?.status);
  const reviewReferences = sanctionsMatches.filter(match => match.decision === 'COMPLIANCE_REVIEW').map(match => match.reference_number);
  const reviewAcknowledged = reviewReferences.length > 0 && reviewReferences.every(reference => ignoredReferences.includes(reference));

  const complianceState = useMemo(() => {
    if (!assessment) return 'amber';
    const status = (assessment.status || '').toUpperCase();
    if (status === 'BLOCKED' || status === 'DO_NOT_PROCEED' || sanctionsBlocked) {
      return 'red';
    }
    if (
      status === 'COMPLIANT' &&
      !assessment.missing_documents?.length &&
      !assessment.rbf_approval_required
    ) {
      return 'green';
    }
    if (
      status === 'EXCEEDS_DELEGATED_LIMIT' ||
      (Number(assessment.maximum_allowance || 0) > 0 && Number(assessment.remaining_allowance || 0) < 0)
    ) {
      return 'red';
    }
    return 'amber';
  }, [assessment, sanctionsBlocked]);

  const stateTheme = {
    amber: {
      card: 'bg-amber-50/70 border-amber-200 border-l-amber-500 text-amber-950',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      barFill: 'bg-amber-500',
      dot: 'bg-amber-500',
    },
    green: {
      card: 'bg-emerald-50/70 border-emerald-200 border-l-emerald-600 text-emerald-950',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      barFill: 'bg-emerald-600',
      dot: 'bg-emerald-500',
    },
    red: {
      card: 'bg-red-50/70 border-red-200 border-l-red-600 text-red-950',
      badge: 'bg-red-100 text-red-800 border-red-300',
      barFill: 'bg-red-600',
      dot: 'bg-red-500',
    },
  }[complianceState];

  const maxAllowance = Number(assessment?.maximum_allowance || 0);
  const prevUtil = Number(assessment?.previous_utilisation || 0);
  const currTxn = Number(assessment?.transaction_amount || 0);
  const totalUsed = prevUtil + currTxn;
  const hasFixedLimit = maxAllowance > 0;
  const remainingAllowance = hasFixedLimit
    ? (assessment?.remaining_allowance != null ? Number(assessment.remaining_allowance) : Math.max(0, maxAllowance - totalUsed))
    : null;
  const percentUsed = hasFixedLimit ? Math.min(100, Math.max(0, Math.round((totalUsed / maxAllowance) * 100))) : 0;
  const prevPercent = hasFixedLimit ? Math.min(100, Math.max(0, Math.round((prevUtil / maxAllowance) * 100))) : 0;
  const currPercent = hasFixedLimit ? Math.min(100 - prevPercent, Math.max(0, Math.round((currTxn / maxAllowance) * 100))) : 0;
  const isOverLimit = hasFixedLimit && totalUsed > maxAllowance;
  const showSanctionsModal = !hideIdentityScreening
    && sanctionsMatches.length > 0
    && sanctions?.status !== 'CLEAR'
    && sanctions?.status !== 'ACKNOWLEDGED_REVIEW'
    && !reviewAcknowledged
    && dismissedScreeningFingerprint !== screeningFingerprint;
  const acknowledgeNameWarning = () => {
    const next = [...new Set([...ignoredReferences, ...reviewReferences])];
    setIgnoredReferences(next);
    setField('sanctions_acknowledged_references', JSON.stringify(next));
    setDismissedScreeningFingerprint(screeningFingerprint);
  };

  return <section className={hideCardHeader ? "w-full min-w-0" : "mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"} id="rbf-control">
    {showSanctionsModal && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="UN sanctions screening result">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className={`px-6 py-5 text-white ${sanctions.status === 'DO_NOT_PROCEED' ? 'bg-red-700' : 'bg-amber-600'}`}>
          <p className="text-overline font-semibold uppercase tracking-wider">UN Sanctions Screening</p>
          <h2 className="mt-1 text-h2 font-bold">{sanctions.status === 'DO_NOT_PROCEED' ? 'DO NOT PROCEED' : 'Possible Name Match'}</h2>
          <p className="mt-1 text-caption">Risk {sanctions.risk_level} · {Number(sanctions.risk_score || 0).toFixed(0)}/100</p>
        </div>
        <div className="max-h-[68vh] space-y-4 overflow-y-auto p-6">
          {sanctions.status === 'DO_NOT_PROCEED'
            ? <p className="rounded-xl border border-red-200 bg-red-50 p-4 font-bold text-red-900">The entered identity details corroborate a UN sanctions-list record. This transaction cannot be submitted, even if a previous name warning was ignored.</p>
            : <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 font-semibold text-amber-950">The name resembles a UN sanctions-list record. Review the record below. Ignore is only an acknowledgement of this non-critical warning; adding matching DOB, phone, passport or ID will still prevent the transaction.</p>}
          {sanctionsMatches.map(match => <article key={match.reference_number} className="rounded-xl border border-gray-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-overline font-semibold uppercase tracking-wider text-gray-500">UN Permanent Reference</p><h3 className="text-h3 font-bold text-gray-900">{match.reference_number} · {match.primary_name}</h3></div><span className={`rounded-full px-3 py-1 text-caption font-semibold ${match.decision === 'DO_NOT_PROCEED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{match.risk_level} {Number(match.risk_score || 0).toFixed(0)}/100</span></div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <p><b>Matched on:</b><br />{(match.match_reasons || []).join(', ') || 'Name similarity'}</p>
              <p><b>Date of birth:</b><br />{match.date_of_birth || 'Not listed'}</p>
              <p><b>Nationality:</b><br />{match.nationality || 'Not listed'}</p>
              <p><b>Place of birth:</b><br />{match.place_of_birth || 'Not listed'}</p>
              <p><b>Listed on:</b><br />{match.listed_on || 'Not listed'}</p>
              <p><b>Designation:</b><br />{match.designation || 'Not listed'}</p>
            </div>
            {!!match.aliases?.length && <p className="mt-3 text-sm"><b>Aliases:</b> {match.aliases.join('; ')}</p>}
            {match.passport_numbers && <p className="mt-2 text-sm"><b>Passports:</b> {match.passport_numbers}</p>}
            {match.national_id_numbers && <p className="mt-2 text-sm"><b>National IDs:</b> {match.national_id_numbers}</p>}
            {match.addresses && <p className="mt-2 text-sm"><b>Addresses:</b> {match.addresses}</p>}
            {match.other_information && <p className="mt-2 text-sm"><b>Other UN information:</b> {match.other_information}</p>}
            <div className="mt-4 flex flex-wrap gap-3"><a href={`/app/sanction-list-entry/${encodeURIComponent(match.reference_number)}`} target="_blank" rel="noreferrer" className="font-bold text-[#B70000] underline">Open ERPNext record</a><a href="https://main.un.org/securitycouncil/en/content/un-sc-consolidated-list" target="_blank" rel="noreferrer" className="font-bold text-[#B70000] underline">Open official UN list</a></div>
          </article>)}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-gray-50 px-6 py-4">
          <a href="/app/sanction-list-entry" target="_blank" rel="noreferrer" className="text-sm font-bold text-gray-700 underline">View all ERPNext sanctions records</a>
          {sanctions.status === 'DO_NOT_PROCEED'
            ? <button type="button" onClick={() => setDismissedScreeningFingerprint(screeningFingerprint)} className="rounded-xl bg-red-700 px-5 py-3 text-btn-lg font-semibold text-white cursor-pointer">Close and correct identity details</button>
            : <button type="button" onClick={acknowledgeNameWarning} className="rounded-xl bg-amber-600 px-5 py-3 text-btn-lg font-semibold text-white cursor-pointer">Ignore Name Warning and Continue KYC</button>}
        </div>
      </div>
    </div>}
    {!hideCardHeader && (
      <div className="border-b border-gray-100 bg-linear-to-r from-red-50 to-white px-5 py-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-h3 font-bold uppercase tracking-wider text-gray-900">RBF Control</h3>
          <p className="mt-1 text-caption text-gray-600">Reserve Bank of Fiji – Exchange Control 2026</p>
        </div>
        {!config.enabled && (
          <div className="relative group inline-block shrink-0">
            <span
              title="RBF enforcement is installed but remains disabled pending authorised compliance review. Current transaction processing is unchanged."
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-semibold bg-blue-50 text-blue-700 border border-blue-200 cursor-help transition-colors hover:bg-blue-100 shadow-2xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              RBF enforcement off
            </span>
            <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-50 w-72 p-3 rounded-xl bg-gray-900 text-white text-caption leading-relaxed shadow-xl border border-gray-800 text-left pointer-events-none">
              RBF enforcement is installed but remains disabled pending authorised compliance review. Current transaction processing is unchanged.
            </div>
          </div>
        )}
      </div>
    )}
    <div className={hideCardHeader ? "space-y-6" : "space-y-6 p-6"}>
      {!hideIdentityScreening && (
        <div className={`rounded-xl border p-4 text-sm ${!sanctions ? 'border-gray-200 bg-gray-50 text-gray-700' : sanctions.status === 'DO_NOT_PROCEED' ? 'border-red-500 bg-red-50 text-red-950' : sanctions.status === 'REVIEW_REQUIRED' ? 'border-amber-400 bg-amber-50 text-amber-950' : 'border-green-200 bg-green-50 text-green-900'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><strong>Identity Risk Screening</strong><p className="mt-0.5 text-caption">Name is checked first; DOB, country, phone, passport and ID increase match confidence.</p></div>
            {sanctions && <span className="rounded-full border border-current/20 px-3 py-1 text-caption font-semibold">Risk: {sanctions.risk_level || 'NONE'} · {Number(sanctions.risk_score || 0).toFixed(0)}/100</span>}
          </div>
          {!screeningName && <p className="mt-3 font-semibold">Enter the customer's full legal name to start screening.</p>}
          {screeningName && sanctionsLoading && <p className="mt-3 font-semibold">Checking identity risk…</p>}
          {sanctionsError && <p className="mt-3 text-label font-semibold text-danger">{sanctionsError}</p>}
          {sanctions?.status === 'CLEAR' && <p className="mt-3 font-bold">No blocking sanctions match found. Continue normal KYC verification.</p>}
          {sanctions?.status === 'REVIEW_REQUIRED' && <p className="mt-3 text-label font-bold text-danger">PAUSE — POSSIBLE NAME MATCH. Send to Compliance for review before proceeding.</p>}
          {sanctions?.status === 'DO_NOT_PROCEED' && <p className="mt-3 text-h3 font-bold text-danger">DO NOT PROCEED — identity details corroborate a sanctions-list match.</p>}
          {!sanctionsBlocked && riskCandidates.length > 0 && <div className="mt-3"><p className="font-bold">Similar names for awareness:</p>{riskCandidates.map(candidate => <p key={candidate.reference_number} className="mt-1 text-caption">{candidate.reference_number} · {candidate.primary_name} · name similarity {candidate.name_score}%</p>)}</div>}
        </div>
      )}

      {/* SUMMARY STRIP */}
      <div className="flex flex-col sm:flex-row items-stretch rounded-2xl border border-gray-200/90 bg-gray-50/80 divide-y sm:divide-y-0 sm:divide-x divide-gray-200/90 overflow-hidden shadow-2xs">
        <div className="flex-1 px-5 py-3.5 flex flex-col justify-center">
          <span className="text-overline font-semibold uppercase tracking-wider text-gray-600 mb-1">
            Transaction Type
          </span>
          <span className="text-body font-semibold text-gray-900">
            {transactionType ? String(transactionType).replace(/_/g, ' ') : 'MONEY TRANSFER'}
          </span>
        </div>

        <div className="flex-1 px-5 py-3.5 flex flex-col justify-center">
          <span className="text-overline font-semibold uppercase tracking-wider text-gray-600 mb-1">
            Currency
          </span>
          <span className="text-body font-semibold text-gray-900 font-mono tracking-tight">
            {currency || 'FJD'}
          </span>
        </div>

        <div className="flex-1 px-5 py-3.5 flex flex-col justify-center bg-red-50/20 sm:bg-transparent">
          <span className="text-overline font-semibold uppercase tracking-wider text-gray-600 mb-1">
            FJD Equivalent
          </span>
          <span className="text-btn-lg font-bold text-[#E00000] tnum font-mono">
            {money(fjdAmount)}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelStyle}>
            Nationality
          </label>
          <div className="relative min-w-0">
            <select
              value={nationalityType}
              disabled={disabled}
              onChange={event => {
                const nextType = event.target.value;
                setFields({ nationality_type: nextType, nationality: nextType === 'FIJI' ? 'Fiji' : '', other_nationality: '' });
              }}
              className={selectStyle}
            >
              <option value="" className="text-gray-400 bg-white">Select Nationality</option>
              <option value="FIJI" className="text-gray-900 bg-white py-1">Fiji</option>
              <option value="OTHER" className="text-gray-900 bg-white py-1">Other</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {nationalityType === 'OTHER' && (
          <div>
            <label className={labelStyle}>
              Other Nationality
            </label>
            <input
              value={otherNationality}
              disabled={disabled}
              onChange={event => setFields({ other_nationality: event.target.value, nationality: event.target.value })}
              className={inputStyle}
              placeholder="Enter nationality"
            />
          </div>
        )}

        <div>
          <label className={labelStyle}>
            Residency Status
          </label>
          <div className="relative min-w-0">
            <select
              value={residencyStatus}
              disabled={disabled}
              onChange={event => setField(value ? 'rbf_residency_status' : 'residency_status', event.target.value)}
              className={selectStyle}
            >
              <option value="" className="text-gray-400 bg-white">Select Residency Status</option>
              <option value="RESIDENT" className="text-gray-900 bg-white py-1">Resident</option>
              <option value="NON_RESIDENT" className="text-gray-900 bg-white py-1">Non-resident</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        <div>
          <label className={labelStyle}>
            Purpose of Transaction <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative min-w-0">
            <select
              value={purpose}
              disabled={disabled}
              onChange={event => handlePurposeChange(event.target.value)}
              className={selectStyle}
            >
              <option value="" className="text-gray-400 bg-white">Select Purpose of Transaction</option>
              {(config.purposes || []).map(item => (
                <option key={item.name} value={item.name} className="text-gray-900 bg-white py-1">
                  {item.purpose_code} — {item.purpose_name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        <div>
          <label className={labelStyle}>
            Source of Funds
          </label>
          <div className="relative min-w-0">
            <select
              value={sourceOfFunds}
              disabled={disabled}
              onChange={event => setField(value ? 'rbf_source_of_funds' : 'source_of_funds', event.target.value)}
              className={selectStyle}
            >
              <option value="" className="text-gray-400 bg-white">Select Source of Funds</option>
              {(config.source_of_funds || []).map(item => (
                <option key={item} value={item} className="text-gray-900 bg-white py-1">
                  {item.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {limitScope.includes('BENEFICIARY') && (
          <div>
            <label className={labelStyle}>
              Beneficiary Reference <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              value={getField('rbf_beneficiary_reference') || recipientName || ''}
              disabled={disabled}
              onChange={event => setField('rbf_beneficiary_reference', event.target.value)}
              className={inputStyle}
              placeholder="Beneficiary ID, passport or provider reference"
            />
          </div>
        )}

        {limitScope.includes('STUDENT') && (
          <div>
            <label className={labelStyle}>
              Student Reference <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              value={getField('rbf_student_reference') || ''}
              disabled={disabled}
              onChange={event => setField('rbf_student_reference', event.target.value)}
              className={inputStyle}
              placeholder="Student or enrolment reference"
            />
          </div>
        )}

        {limitScope.includes('FAMILY') && (
          <div>
            <label className={labelStyle}>
              Family Reference <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              value={getField('rbf_family_reference') || ''}
              disabled={disabled}
              onChange={event => setField('rbf_family_reference', event.target.value)}
              className={inputStyle}
              placeholder="Stable family reference"
            />
          </div>
        )}

        {limitScope.includes('INVOICE') && (
          <div>
            <label className={labelStyle}>
              Invoice Reference <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              value={getField('rbf_invoice_reference') || ''}
              disabled={disabled}
              onChange={event => setField('rbf_invoice_reference', event.target.value)}
              className={inputStyle}
              placeholder="Invoice number"
            />
          </div>
        )}

        {purpose === 'FX008' && (
          <div>
            <label className={labelStyle}>
              Verified Unutilised Imported Funds (FJD) <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={getField('imported_funds_available_fjd') || ''}
              disabled={disabled}
              onChange={event => setField('imported_funds_available_fjd', event.target.value)}
              className={inputStyle}
              placeholder="0.00"
            />
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-gray-200/80 mt-6">
        <div className="flex items-center justify-between mb-2">
          <label className={labelStyle}>Supporting Documents</label>
          <button
            type="button"
            disabled={disabled}
            onClick={addDocument}
            className="text-xs font-bold text-[#B70000] hover:text-[#900000] transition-colors mb-2"
          >
            + Add Another Document
          </button>
        </div>
        {!documents.length && (
          <p className="mt-1 text-xs text-gray-500">
            Choose a purpose, then add each required supporting document separately.
          </p>
        )}
        {documents.map((row, index) => (
          <div key={index} className="mt-3 grid gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3 md:grid-cols-[1fr_1fr_auto] items-center">
            <div className="relative min-w-0 flex-1">
              <select
                value={row.document_type || ''}
                disabled={disabled}
                onChange={event => updateDocument(index, { document_type: event.target.value })}
                className={selectStyle}
              >
                <option value="" className="text-gray-400 bg-white">Select Document Type</option>
                {availableDocuments.map(item => (
                  <option key={item.name} value={item.name} className="text-gray-900 bg-white py-1">
                    {item.document_name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400">
                <ChevronDown size={16} />
              </div>
            </div>
            <label className="flex cursor-pointer items-center rounded-xl border border-dashed border-gray-300 bg-white px-3.5 py-2.5 text-xs text-gray-600 hover:border-gray-400 transition-colors">
              <input
                type="file"
                className="sr-only"
                disabled={disabled || uploadingIndex === index}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={event => attachDocument(index, event.target.files?.[0])}
              />
              {uploadingIndex === index ? 'Uploading privately…' : row.file_name || (row.attachment ? 'Private document uploaded' : 'Choose secure file')}
            </label>
            <div className="flex items-center gap-2">
              {row.attachment && (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewDoc({
                      attachment: row.attachment,
                      document_type: row.document_type,
                      name: row.file_name,
                    })
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition cursor-pointer"
                  title="Preview document"
                >
                  <Eye size={13} />
                  <span>Preview</span>
                </button>
              )}
              {config.can_verify_documents && row.attachment && (
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={row.verification_status === 'VERIFIED'}
                    disabled={disabled}
                    onChange={event => updateDocument(index, { verification_status: event.target.checked ? 'VERIFIED' : 'PENDING' })}
                  />
                  Sighted
                </label>
              )}
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeDocument(index)}
                className="px-2 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {assessment?.passport_endorsement_required && (
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <input
            type="checkbox"
            checked={Boolean(getField('passport_endorsement_completed') || getField('passport_endorsed'))}
            disabled={disabled}
            onChange={event => setField(value ? 'passport_endorsement_completed' : 'passport_endorsed', event.target.checked ? 1 : 0)}
          />
          Original passport physically endorsed
        </label>
      )}
      {assessment?.tf_form_required && (
        <div>
          <label className={labelStyle}>
            TF Form Reference <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            value={getField('tf_form_reference') || ''}
            disabled={disabled}
            onChange={event => setField('tf_form_reference', event.target.value)}
            className={inputStyle}
          />
        </div>
      )}
      {assessment?.rbf_approval_required && (
        <div>
          <label className={labelStyle}>
            Verified RBF Approval Record <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            value={getField('rbf_approval') || ''}
            disabled={disabled}
            onChange={event => setField('rbf_approval', event.target.value)}
            className={inputStyle}
            placeholder="RBFAPP-00001"
          />
        </div>
      )}
      {loading && <p className="text-sm text-gray-500">Recalculating compliance…</p>}
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {assessment && (
        <div className={`rounded-xl border border-l-4 p-4 sm:p-5 text-sm shadow-xs transition-all ${stateTheme.card}`}>
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-200/60">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${stateTheme.badge}`}>
                {assessment.status ? assessment.status.replace(/_/g, ' ') : 'Assessment'}
              </span>
              <span className="text-xs font-bold text-gray-700">
                Compliance Assessment
              </span>
            </div>
            <span className="text-xs font-mono text-gray-600 bg-white/80 px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs">
              Rule: <strong className="text-gray-900 font-bold">{assessment.rule_code || 'Not matched'}</strong>
            </span>
          </div>

          {/* Limit Bar Section */}
          <div className="mt-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-700">Used:</span>
                <span className="font-bold tabular-nums font-mono text-gray-900">{money(totalUsed)}</span>
                {hasFixedLimit ? (
                  <span className="text-gray-500 font-medium">of {money(maxAllowance)} ({percentUsed}%)</span>
                ) : (
                  <span className="text-gray-500 font-medium">(No fixed delegated limit)</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-700">Remaining:</span>
                <span className={`font-bold tabular-nums font-mono ${hasFixedLimit && remainingAllowance <= 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {hasFixedLimit ? money(remainingAllowance) : 'Subject to evidence'}
                </span>
              </div>
            </div>

            {/* Progress Track */}
            <div className="w-full bg-gray-200/90 rounded-full h-2.5 overflow-hidden flex shadow-inner">
              {hasFixedLimit ? (
                isOverLimit ? (
                  <div
                    className="bg-red-600 h-full w-full rounded-full transition-all duration-300"
                    title={`Limit exceeded: ${money(totalUsed)} of ${money(maxAllowance)}`}
                  />
                ) : (
                  <>
                    {prevPercent > 0 && (
                      <div
                        style={{ width: `${prevPercent}%` }}
                        className="bg-slate-400 h-full transition-all duration-300"
                        title={`Previous utilisation: ${money(prevUtil)} (${prevPercent}%)`}
                      />
                    )}
                    {currPercent > 0 && (
                      <div
                        style={{ width: `${currPercent}%` }}
                        className="bg-blue-600 h-full transition-all duration-300"
                        title={`Current transaction: ${money(currTxn)} (${currPercent}%)`}
                      />
                    )}
                  </>
                )
              ) : (
                <div className="bg-emerald-500/70 h-full w-full rounded-full" title="No fixed delegated limit" />
              )}
            </div>
          </div>

          {/* Stat Tiles: Previous use, Current, RBF approval */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3.5">
            <div className="bg-white/90 rounded-xl p-3 border border-gray-200/80 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                Previous Use
              </span>
              <span className="text-sm font-bold text-gray-900 tabular-nums font-mono mt-1">
                {money(prevUtil)}
              </span>
            </div>

            <div className="bg-white/90 rounded-xl p-3 border border-gray-200/80 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                Current
              </span>
              <span className="text-sm font-bold text-gray-900 tabular-nums font-mono mt-1">
                {money(currTxn)}
              </span>
            </div>

            <div className="bg-white/90 rounded-xl p-3 border border-gray-200/80 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                RBF Approval
              </span>
              <div className="mt-1">
                {assessment.rbf_approval_required ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Required
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Not required
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Missing Documents Alert */}
          {Boolean(assessment.missing_documents?.length) && (
            <div className="mt-3 rounded-lg bg-amber-100/90 border border-amber-300 p-3 text-amber-950">
              <p className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wide text-amber-900">
                <span>🚫 Submission Blocked — Missing Required Documents:</span>
              </p>
              <p className="mt-1 font-bold text-amber-950">{assessment.missing_documents.join(', ')}</p>
              <p className="mt-1 text-xs text-amber-800">
                Please attach these documents under Supporting Documents above to satisfy RBF exchange control rules.
              </p>
            </div>
          )}

          {/* Remarks Section */}
          <div className="mt-3.5 pt-3 border-t border-gray-200/60">
            <h5 className="text-[11px] uppercase font-bold tracking-wider text-gray-700 mb-2">
              Remarks
            </h5>
            <ul className="space-y-1.5 text-xs text-gray-700">
              {assessment.pending_actions && assessment.pending_actions.length > 0 ? (
                assessment.pending_actions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${stateTheme.dot}`} />
                    <span>{action}</span>
                  </li>
                ))
              ) : (
                <li className="flex items-start gap-2 leading-relaxed text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-emerald-500" />
                  <span>All compliance requirements met. Transaction is within delegated limit.</span>
                </li>
              )}
              {Boolean(assessment.unverified_documents?.length) && (
                <li className="flex items-start gap-2 leading-relaxed text-amber-900 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-amber-500" />
                  <span>Awaiting Verification: {assessment.unverified_documents.join(', ')}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewDoc !== null}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />
    </div>
  </section>;
}
