import React, { useEffect, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { sessionFetch as fetch } from '../../../../api/sessionClient';
import { useERPFileUpload } from '../../../../hooks/useERPFileUpload';

const money = value => `FJ$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function RbfComplianceSection({
  transactionType = 'MONEY_EXCHANGE', fjdAmount, exchangeType, currency = 'FJD', rate,
  customerId, recipientName, value, onChange, disabled = false,
}) {
  const formContext = useFormContext();
  const { uploadFile } = useERPFileUpload();
  const [config, setConfig] = useState({ enabled: false, purposes: [], documents: [], source_of_funds: [], can_verify_documents: false });
  const [assessment, setAssessment] = useState(null);
  const [sanctionsPreview, setSanctionsPreview] = useState(null);
  const [sanctionsLoading, setSanctionsLoading] = useState(false);
  const [sanctionsError, setSanctionsError] = useState('');
  const [ignoredReferences, setIgnoredReferences] = useState([]);
  const [dismissedScreeningFingerprint, setDismissedScreeningFingerprint] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [error, setError] = useState('');

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
    if (screeningName.length < 3) {
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
  }, [screeningFingerprint]);

  useEffect(() => {
    const query = new URLSearchParams({ transaction_type: transactionType, transaction_direction: direction });
    fetch(`/api/method/moneygram.moneygram.api.rbf_compliance.get_configuration?${query}`, { credentials: 'include' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Unable to load RBF configuration.')))
      .then(result => {
        const nextConfig = result?.message || { enabled: false, purposes: [], documents: [] };
        setConfig(nextConfig);
        const allowed = nextConfig.purposes || [];
        if (purpose && !allowed.some(item => item.name === purpose)) setField('rbf_purpose', '');
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
      .catch(() => {});
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

  const statusTone = assessment?.status === 'COMPLIANT' ? 'border-green-200 bg-green-50 text-green-900' : assessment?.status === 'BLOCKED' ? 'border-red-200 bg-red-50 text-red-900' : 'border-amber-200 bg-amber-50 text-amber-950';
  const sanctions = sanctionsPreview || assessment?.sanctions_screening;
  const sanctionsMatches = sanctions?.matches || [];
  const riskCandidates = sanctions?.risk_candidates || [];
  const sanctionsBlocked = ['DO_NOT_PROCEED', 'REVIEW_REQUIRED'].includes(sanctions?.status);
  const reviewReferences = sanctionsMatches.filter(match => match.decision === 'COMPLIANCE_REVIEW').map(match => match.reference_number);
  const reviewAcknowledged = reviewReferences.length > 0 && reviewReferences.every(reference => ignoredReferences.includes(reference));
  const showSanctionsModal = sanctionsMatches.length > 0
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

  return <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm" id="rbf-control">
    {showSanctionsModal && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="UN sanctions screening result">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className={`px-6 py-5 text-white ${sanctions.status === 'DO_NOT_PROCEED' ? 'bg-red-700' : 'bg-amber-600'}`}>
          <p className="text-xs font-black uppercase tracking-[0.18em]">UN Sanctions Screening</p>
          <h2 className="mt-1 text-2xl font-black">{sanctions.status === 'DO_NOT_PROCEED' ? 'DO NOT PROCEED' : 'Possible Name Match'}</h2>
          <p className="mt-1 text-sm">Risk {sanctions.risk_level} · {Number(sanctions.risk_score || 0).toFixed(0)}/100</p>
        </div>
        <div className="max-h-[68vh] space-y-4 overflow-y-auto p-6">
          {sanctions.status === 'DO_NOT_PROCEED'
            ? <p className="rounded-xl border border-red-200 bg-red-50 p-4 font-bold text-red-900">The entered identity details corroborate a UN sanctions-list record. This transaction cannot be submitted, even if a previous name warning was ignored.</p>
            : <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 font-semibold text-amber-950">The name resembles a UN sanctions-list record. Review the record below. Ignore is only an acknowledgement of this non-critical warning; adding matching DOB, phone, passport or ID will still prevent the transaction.</p>}
          {sanctionsMatches.map(match => <article key={match.reference_number} className="rounded-xl border border-gray-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-gray-500">UN Permanent Reference</p><h3 className="text-lg font-black text-gray-900">{match.reference_number} · {match.primary_name}</h3></div><span className={`rounded-full px-3 py-1 text-xs font-black ${match.decision === 'DO_NOT_PROCEED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{match.risk_level} {Number(match.risk_score || 0).toFixed(0)}/100</span></div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <p><b>Matched on:</b><br/>{(match.match_reasons || []).join(', ') || 'Name similarity'}</p>
              <p><b>Date of birth:</b><br/>{match.date_of_birth || 'Not listed'}</p>
              <p><b>Nationality:</b><br/>{match.nationality || 'Not listed'}</p>
              <p><b>Place of birth:</b><br/>{match.place_of_birth || 'Not listed'}</p>
              <p><b>Listed on:</b><br/>{match.listed_on || 'Not listed'}</p>
              <p><b>Designation:</b><br/>{match.designation || 'Not listed'}</p>
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
            ? <button type="button" onClick={() => setDismissedScreeningFingerprint(screeningFingerprint)} className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black text-white">Close and correct identity details</button>
            : <button type="button" onClick={acknowledgeNameWarning} className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-black text-white">Ignore Name Warning and Continue KYC</button>}
        </div>
      </div>
    </div>}
    <div className="border-b border-gray-100 bg-linear-to-r from-red-50 to-white px-5 py-4">
      <h3 className="text-base font-black uppercase tracking-wide text-gray-900">RBF Control</h3>
      <p className="mt-1 text-xs text-gray-600">Reserve Bank of Fiji – Exchange Control 2026</p>
    </div>
    <div className="space-y-5 p-5">
      <div className={`rounded-xl border p-4 text-sm ${!sanctions ? 'border-gray-200 bg-gray-50 text-gray-700' : sanctions.status === 'DO_NOT_PROCEED' ? 'border-red-500 bg-red-50 text-red-950' : sanctions.status === 'REVIEW_REQUIRED' ? 'border-amber-400 bg-amber-50 text-amber-950' : 'border-green-200 bg-green-50 text-green-900'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><strong>Identity Risk Screening</strong><p className="mt-0.5 text-xs">Name is checked first; DOB, country, phone, passport and ID increase match confidence.</p></div>
          {sanctions && <span className="rounded-full border border-current/20 px-3 py-1 text-xs font-black">Risk: {sanctions.risk_level || 'NONE'} · {Number(sanctions.risk_score || 0).toFixed(0)}/100</span>}
        </div>
        {!screeningName && <p className="mt-3 font-semibold">Enter the customer's full legal name to start screening.</p>}
        {screeningName && sanctionsLoading && <p className="mt-3 font-semibold">Checking identity risk…</p>}
        {sanctionsError && <p className="mt-3 font-semibold text-red-700">{sanctionsError}</p>}
        {sanctions?.status === 'CLEAR' && <p className="mt-3 font-bold">No blocking sanctions match found. Continue normal KYC verification.</p>}
        {sanctions?.status === 'REVIEW_REQUIRED' && <p className="mt-3 text-base font-black">PAUSE — POSSIBLE NAME MATCH. Send to Compliance for review before proceeding.</p>}
        {sanctions?.status === 'DO_NOT_PROCEED' && <p className="mt-3 text-lg font-black">DO NOT PROCEED — identity details corroborate a sanctions-list match.</p>}
        {!sanctionsBlocked && riskCandidates.length > 0 && <div className="mt-3"><p className="font-bold">Similar names for awareness:</p>{riskCandidates.map(candidate => <p key={candidate.reference_number} className="mt-1 text-xs">{candidate.reference_number} · {candidate.primary_name} · name similarity {candidate.name_score}%</p>)}</div>}
        {sanctionsMatches.length > 0 && <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left text-xs"><thead><tr className="border-b border-current/20"><th className="p-2">Risk</th><th className="p-2">UN Reference</th><th className="p-2">Listed Name</th><th className="p-2">Exact/Similar Fields</th><th className="p-2">DOB</th><th className="p-2">Nationality</th></tr></thead><tbody>{sanctionsMatches.map(match => <tr key={`${match.reference_number}-${match.primary_name}`} className="border-b border-current/10 last:border-0"><td className="p-2 font-black">{match.risk_level} {Number(match.risk_score || 0).toFixed(0)}/100</td><td className="p-2 font-bold">{match.reference_number}</td><td className="p-2">{match.primary_name}</td><td className="p-2">{(match.match_reasons || []).join(', ')}</td><td className="p-2">{match.date_of_birth || '—'}</td><td className="p-2">{match.nationality || '—'}</td></tr>)}</tbody></table></div>}
      </div>
      {!config.enabled && <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">RBF enforcement is installed but remains disabled pending authorised compliance review. Current transaction processing is unchanged.</div>}
      <div className="grid gap-3 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-3">
        <p><span className="block text-xs font-bold uppercase text-gray-500">Transaction Type</span>{transactionType.replace('_', ' ')}</p>
        <p><span className="block text-xs font-bold uppercase text-gray-500">Currency</span>{currency || 'FJD'}</p>
        <p><span className="block text-xs font-bold uppercase text-gray-500">FJD Equivalent</span>{money(fjdAmount)}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold text-gray-800">Nationality
          <select value={nationalityType} disabled={disabled} onChange={event => {
            const nextType = event.target.value;
            setFields({ nationality_type: nextType, nationality: nextType === 'FIJI' ? 'Fiji' : '', other_nationality: '' });
          }} className="mt-1 w-full rounded-xl border border-gray-300 p-3"><option value="">Select nationality</option><option value="FIJI">Fiji</option><option value="OTHER">Other</option></select>
        </label>
        {nationalityType === 'OTHER' && <label className="text-sm font-semibold text-gray-800">Other Nationality
          <input value={otherNationality} disabled={disabled} onChange={event => setFields({ other_nationality: event.target.value, nationality: event.target.value })} className="mt-1 w-full rounded-xl border border-gray-300 p-3" placeholder="Enter nationality" />
        </label>}
        <label className="text-sm font-semibold text-gray-800">Residency Status
          <select value={residencyStatus} disabled={disabled} onChange={event => setField(value ? 'rbf_residency_status' : 'residency_status', event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 p-3"><option value="">Select residency</option><option value="RESIDENT">Resident</option><option value="NON_RESIDENT">Non-resident</option></select>
        </label>
        <label className="text-sm font-semibold text-gray-800">1. Purpose of Transaction *
          <select value={purpose} disabled={disabled} onChange={event => setField('rbf_purpose', event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 p-3"><option value="">Select purpose</option>{(config.purposes || []).map(item => <option key={item.name} value={item.name}>{item.purpose_code} — {item.purpose_name}</option>)}</select>
        </label>
        <label className="text-sm font-semibold text-gray-800">Source of Funds
          <select value={sourceOfFunds} disabled={disabled} onChange={event => setField(value ? 'rbf_source_of_funds' : 'source_of_funds', event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 p-3"><option value="">Select source</option>{(config.source_of_funds || []).map(item => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}</select>
        </label>
        {limitScope.includes('BENEFICIARY') && <label className="text-sm font-semibold text-gray-800">Beneficiary Reference *
          <input value={getField('rbf_beneficiary_reference') || recipientName || ''} disabled={disabled} onChange={event => setField('rbf_beneficiary_reference', event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 p-3" placeholder="Beneficiary ID, passport or provider reference" />
        </label>}
        {limitScope.includes('STUDENT') && <label className="text-sm font-semibold text-gray-800">Student Reference *
          <input value={getField('rbf_student_reference') || ''} disabled={disabled} onChange={event => setField('rbf_student_reference', event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 p-3" placeholder="Student or enrolment reference" />
        </label>}
        {limitScope.includes('FAMILY') && <label className="text-sm font-semibold text-gray-800">Family Reference *
          <input value={getField('rbf_family_reference') || ''} disabled={disabled} onChange={event => setField('rbf_family_reference', event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 p-3" placeholder="Stable family reference" />
        </label>}
        {limitScope.includes('INVOICE') && <label className="text-sm font-semibold text-gray-800">Invoice Reference *
          <input value={getField('rbf_invoice_reference') || ''} disabled={disabled} onChange={event => setField('rbf_invoice_reference', event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 p-3" placeholder="Invoice number" />
        </label>}
        {purpose === 'FX008' && <label className="text-sm font-semibold text-gray-800">Verified Unutilised Imported Funds (FJD) *
          <input type="number" min="0" step="0.01" value={getField('imported_funds_available_fjd') || ''} disabled={disabled} onChange={event => setField('imported_funds_available_fjd', event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 p-3" placeholder="0.00" />
        </label>}
      </div>
      <div>
        <div className="flex items-center justify-between"><h4 className="text-sm font-bold text-gray-800">2–3. Supporting Documents</h4><button type="button" disabled={disabled} onClick={addDocument} className="text-sm font-bold text-[#B70000]">+ Add Another Document</button></div>
        {!documents.length && <p className="mt-2 text-xs text-gray-500">Choose a purpose, then add each required supporting document separately.</p>}
        {documents.map((row, index) => <div key={index} className="mt-3 grid gap-2 rounded-xl border border-gray-200 p-3 md:grid-cols-[1fr_1fr_auto]">
          <select value={row.document_type || ''} disabled={disabled} onChange={event => updateDocument(index, { document_type: event.target.value })} className="rounded-lg border border-gray-300 p-2.5"><option value="">Supporting document type</option>{availableDocuments.map(item => <option key={item.name} value={item.name}>{item.document_name}</option>)}</select>
          <label className="flex cursor-pointer items-center rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-600"><input type="file" className="sr-only" disabled={disabled || uploadingIndex === index} accept=".pdf,.jpg,.jpeg,.png" onChange={event => attachDocument(index, event.target.files?.[0])} />{uploadingIndex === index ? 'Uploading privately…' : row.file_name || (row.attachment ? 'Private document uploaded' : 'Choose secure file')}</label>
          <div className="flex items-center gap-2">
            {config.can_verify_documents && row.attachment && <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700"><input type="checkbox" checked={row.verification_status === 'VERIFIED'} disabled={disabled} onChange={event => updateDocument(index, { verification_status: event.target.checked ? 'VERIFIED' : 'PENDING' })} />Sighted</label>}
            <button type="button" disabled={disabled} onClick={() => removeDocument(index)} className="px-2 text-sm font-semibold text-red-600">Remove</button>
          </div>
        </div>)}
      </div>
      {assessment?.passport_endorsement_required && <label className="flex items-center gap-2 text-sm font-semibold text-gray-800"><input type="checkbox" checked={Boolean(getField('passport_endorsement_completed') || getField('passport_endorsed'))} disabled={disabled} onChange={event => setField(value ? 'passport_endorsement_completed' : 'passport_endorsed', event.target.checked ? 1 : 0)} />Original passport physically endorsed</label>}
      {assessment?.tf_form_required && <label className="block text-sm font-semibold text-gray-800">TF Form Reference *<input value={getField('tf_form_reference') || ''} disabled={disabled} onChange={event => setField('tf_form_reference', event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 p-3" /></label>}
      {assessment?.rbf_approval_required && <label className="block text-sm font-semibold text-gray-800">Verified RBF Approval Record *<input value={getField('rbf_approval') || ''} disabled={disabled} onChange={event => setField('rbf_approval', event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 p-3" placeholder="RBFAPP-00001" /></label>}
      {loading && <p className="text-sm text-gray-500">Recalculating compliance…</p>}
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {assessment && <div className={`rounded-xl border p-4 text-sm ${statusTone}`}>
        <div className="flex flex-wrap items-center justify-between gap-2"><strong>Compliance Status: {assessment.status}</strong><span>Rule {assessment.rule_code || 'not matched'}</span></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><p>Applicable Limit<br/><b>{assessment.maximum_allowance ? money(assessment.maximum_allowance) : 'No fixed delegated limit'}</b></p><p>Previous Utilisation<br/><b>{money(assessment.previous_utilisation)}</b></p><p>Current Transaction<br/><b>{money(assessment.transaction_amount)}</b></p><p>Remaining Allowance<br/><b>{assessment.maximum_allowance ? money(assessment.remaining_allowance) : 'Subject to evidence'}</b></p></div>
        <p className="mt-3"><b>RBF Approval Required:</b> {assessment.rbf_approval_required ? 'Yes' : 'No'}</p>
        {!!assessment.missing_documents?.length && <p className="mt-1"><b>Missing Documents:</b> {assessment.missing_documents.join(', ')}</p>}
        {!!assessment.unverified_documents?.length && <p className="mt-1"><b>Awaiting Verification:</b> {assessment.unverified_documents.join(', ')}</p>}
        {!!assessment.pending_actions?.length && <div className="mt-2"><b>Compliance Remarks:</b>{assessment.pending_actions.map(action => <p key={action}>• {action}</p>)}</div>}
      </div>}
    </div>
  </section>;
}
