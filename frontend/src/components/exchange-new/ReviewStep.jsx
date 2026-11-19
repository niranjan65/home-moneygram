
// import React from 'react';
// import {
//   Edit2,
//   TrendingUp,
//   Info,
//   Landmark,
//   Clock,
//   Lock,
//   ArrowRight,
// } from 'lucide-react';
// import { useExchange } from '../context/ExchangeContext';

// const PRIMARY = '#30e87a';
// const PRIMARY_DARK = '#25b660';

// export const ReviewStep = ({
//   data = {},
//   senderName = 'John Doe',
//   paymentLabel = 'Visa •••• 4242',
//   onEdit,
//   onCancel,
//   onConfirm,
// }) => {
//   const {
//     serviceFee,
//     gstAmount,
//     total,
//     serviceRate,
//     gstRate,
//   } = useExchange();

//   const {
//     sendAmount = 0,
//     senderCurrency = 'USD',
//     receiverCurrency = 'EUR',
//     exchangeRate = 0,
//     receiverGets = 0,
//     firstName = '',
//     lastName = '',
//     bankName = '',
//     accountNumber = '',
//     deliveryMethod = 'BANK_DEPOSIT',
//     country = '',
//     totalDispensed,
//     denominationRows = [],
//   } = data;

//   const isCash = deliveryMethod === 'CASH_PICKUP';

//   const maskedAcct = accountNumber
//     ? `•••• ${String(accountNumber).slice(-4)}`
//     : '•••• ––';

//   const fmt = (val, decimals = 2) =>
//     Number(val).toLocaleString(undefined, {
//       minimumFractionDigits: decimals,
//       maximumFractionDigits: decimals,
//     });

//   return (
//     <div className="flex flex-col gap-8">

//       {/* Header */}
//       <div className="text-center space-y-2">
//         <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
//           Review exchange details
//         </h2>
//         <p className="text-gray-500">
//           Please review the details below before confirming.
//         </p>
//       </div>

//       <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">

//         {/* Recipient Receives Section */}
//         <div className="p-8 bg-gradient-to-br from-green-50 to-white border-b border-gray-100 relative">
//           <div className="absolute top-6 right-6">
//             <button
//               onClick={onEdit}
//               className="text-sm font-bold flex items-center gap-1 hover:opacity-75"
//               style={{ color: PRIMARY }}
//             >
//               <Edit2 size={16} />
//               Edit
//             </button>
//           </div>

//           <div className="text-center space-y-2">
//             <span className="text-sm uppercase tracking-wider text-gray-500">
//               Customer Receives
//             </span>

//             <div className="flex items-baseline justify-center gap-2">
//               <span className="text-5xl font-extrabold text-gray-900">
//                 {fmt(sendAmount)} {senderCurrency}
//               </span>

//             </div>

//             {exchangeRate > 0 && (
//               <div
//                 className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
//                 style={{ background: `${PRIMARY}22`, color: PRIMARY_DARK }}
//               >
//                 <TrendingUp size={13} className="mr-1" />
//                 Rate: 1 {senderCurrency} = {exchangeRate.toFixed(4)} FJD
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Breakdown */}
//         <div className="p-6 md:p-8 space-y-6">

//           {/* Cost Section */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 pb-6 border-b border-gray-100">

//             {/* <div className="space-y-3">
//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-500">Send Amount</span>
//                 <span className="font-bold text-gray-900">
//                   {fmt(sendAmount)} {senderCurrency}
//                 </span>
//               </div>

//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-500 flex items-center gap-1">
//                   Service Fee ({serviceRate * 100}%)
//                   <Info size={14} className="text-gray-400" />
//                 </span>
//                 <span className="font-bold text-gray-900">
//                   +{fmt(serviceFee)} {senderCurrency}
//                 </span>
//               </div>

//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-500">
//                   GST ({gstRate * 100}%)
//                 </span>
//                 <span className="font-bold text-gray-900">
//                   +{fmt(gstAmount)} {senderCurrency}
//                 </span>
//               </div>
//             </div> */}

//             {/* <div className="space-y-3">
//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-500">Total to Pay</span>
//                 <span className="font-extrabold text-lg text-gray-900">
//                   {fmt(total)} {senderCurrency}
//                 </span>
//               </div>

//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-500">Delivery Method</span>
//                 <span className="font-bold flex items-center gap-1">
//                   <Landmark size={16} style={{ color: PRIMARY }} />
//                   {isCash ? 'Cash Pickup' : 'Bank Deposit'}
//                 </span>
//               </div>
//             </div> */}
//           </div>

//           {/* Cash Breakdown */}
//           {/* {isCash && denominationRows.length > 0 && (
//             <div className="pb-6 border-b border-gray-100">
//               <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-3">
//                 Cash Denomination Breakdown
//               </h3>
//               <div className="rounded-xl border border-gray-100 overflow-hidden">
//                 <table className="w-full text-sm">
//                   <thead>
//                     <tr className="bg-gray-50 text-xs uppercase text-gray-400">
//                       <th className="px-4 py-2 text-left">Denomination</th>
//                       <th className="px-4 py-2 text-center">Count</th>
//                       <th className="px-4 py-2 text-right">Subtotal</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {denominationRows.map((row, i) => (
//                       <tr key={i} className="border-t">
//                         <td className="px-4 py-2 font-bold">
//                           {row.denomination_value}
//                         </td>
//                         <td className="px-4 py-2 text-center">
//                           × {row.count}
//                         </td>
//                         <td className="px-4 py-2 text-right font-bold">
//                           {fmt(row.subtotal)}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )} */}

//           {/* Arrival Info */}
//           {/* <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
//             <Clock size={18} className="text-blue-600" />
//             <div>
//               <p className="text-sm font-bold text-blue-900">
//                 Estimated Arrival: 1–2 Business Days
//               </p>
//               <p className="text-xs text-blue-700">
//                 Funds are typically available within 24 hours depending on bank processing.
//               </p>
//             </div>
//           </div> */}
//         </div>

//         {/* Footer */}
//         <div className="bg-gray-50 px-6 py-6 flex justify-between items-center border-t">
//           <div className="flex items-center gap-2 text-xs text-gray-500">
//             <Lock size={14} className="text-green-600" />
//             Encrypted & Secure Transaction
//           </div>

//           <div className="flex gap-3">
//             <button
//               onClick={onCancel}
//               className="px-6 py-3 rounded-xl text-sm font-bold text-gray-600 bg-white border hover:bg-gray-50"
//             >
//               Cancel
//             </button>

//             <button
//               onClick={onConfirm}
//               className="px-8 py-3 rounded-xl text-sm font-bold text-black flex items-center gap-2 hover:opacity-90"
//               style={{
//                 background: `linear-gradient(to right, ${PRIMARY}, ${PRIMARY_DARK})`,
//               }}
//             >
//               Confirm
//               <ArrowRight size={18} />
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };



import React, { useState, useEffect } from 'react';
import {
  Edit2,
  TrendingUp,
  Info,
  Landmark,
  Clock,
  Lock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Sparkles,
  CheckCircle2,
  Wallet,
  ArrowLeftRight,
  MapPin,
  X,
  User,
  Hash,
  Phone,
  Globe,
  FileText,
  Coins,
  BadgeCheck,
} from 'lucide-react';
import { useExchange } from '../../context/ExchangeContext';
import { useSettings } from '../../context/SettingsContext';

// ── Red Design Tokens (mirrors ReceiverForm / Summary) ────────────────────────
const R = {
  primary: '#dc2626',
  accent: '#ef4444',
  bright: '#f87171',
  dark: '#7f1d1d',
  deeper: '#450a0a',
  soft: '#fff1f2',
  muted: '#ffe4e6',
  orange: '#f97316',
};

const gradHero = `linear-gradient(135deg, ${R.deeper} 0%, ${R.dark} 50%, ${R.primary} 100%)`;
const gradBtn = `linear-gradient(135deg, ${R.accent} 0%, ${R.primary} 60%, ${R.dark} 100%)`;
const gradCard = `linear-gradient(135deg, ${R.soft} 0%, #fff 100%)`;

// ── Group Card component (one card per group) ──────────────────────────────────
const SummaryGroupCard = ({ icon: Icon, title, subtitle, badge, children }) => (
  <div className="rounded-2xl border border-gray-200/90 bg-white shadow-xs overflow-hidden">
    <div className="px-5 py-3.5 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <Icon size={14} className="text-red-600" strokeWidth={2.3} />
          </div>
        )}
        <div>
          <h4 className="text-h3 font-bold text-ink">
            {title}
          </h4>
          {subtitle && (
            <p className="text-caption font-normal text-muted">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {badge && <div>{badge}</div>}
    </div>
    <div className="p-4 sm:p-5">
      {children}
    </div>
  </div>
);

// ── Plain Key-Value Item (no individual card border or box) ─────────────────────
const SummaryInfoItem = ({ label, value, badge, colSpan2 }) => (
  <div className={`flex flex-col ${colSpan2 ? 'sm:col-span-2' : ''}`}>
    <span className="text-label font-semibold text-muted">
      {label}
    </span>
    <div className="mt-0.5">
      {badge ? (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-semibold ${badge.className}`}>
          {badge.text}
        </span>
      ) : (
        <span
          className="text-body-value font-medium text-ink truncate block tnum"
          title={typeof value === 'string' ? value : undefined}
        >
          {value || '—'}
        </span>
      )}
    </div>
  </div>
);

export const ReviewStep = ({
  data = {},
  senderName = 'John Doe',
  paymentLabel = 'Visa •••• 4242',
  onEdit,
  onCancel,
  onConfirm,
  isDealer = false,
}) => {
  const { selectedWarehouse } = useSettings();
  const [showNoWarehouseModal, setShowNoWarehouseModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const handleConfirm = async () => {
    if (isSubmitting) return;
    if (!selectedWarehouse?.warehouse) {
      setShowNoWarehouseModal(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await onConfirm?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const {
    sendAmount = 0,
    senderCurrency: _senderCurrency,
    receiverCurrency: _receiverCurrency,
    foreignCurrency,
    localCurrency,
    exchangeRate = 0,
    receiverGets = 0,
    firstName = '',
    lastName = '',
    bankName = '',
    accountNumber = '',
    deliveryMethod = 'BANK_DEPOSIT',
    country = '',
    exchangeType = 'BUY',
    totalDispensed,
    denominationRows = [],
  } = data;

  // Support both old field names (senderCurrency/receiverCurrency) and
  // the current payload field names (foreignCurrency/localCurrency).
  // sendAmount always represents the forex (foreign currency) amount regardless
  // of exchange type, so senderCurrency is always foreignCurrency.
  const senderCurrency =
    _senderCurrency ?? foreignCurrency ?? 'USD';
  const receiverCurrency =
    _receiverCurrency ?? localCurrency ?? 'EUR';

  const isCash = deliveryMethod === 'CASH_PICKUP';

  const maskedAcct = accountNumber
    ? `•••• ${String(accountNumber).slice(-4)}`
    : '•••• ––';

  const fmt = (val, decimals = 2) =>
    Number(val).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  const formatDate = (val) => {
    if (!val) return '—';
    if (val instanceof Date) return val.toISOString().slice(0, 10);
    if (typeof val === 'string') return val.slice(0, 10);
    return String(val);
  };

  const customerName =
    data.custom_full_name ||
    data.full_name ||
    data.fullName ||
    data.idName ||
    [data.firstName, data.lastName].filter(Boolean).join(' ') ||
    (senderName && senderName !== 'John Doe' ? senderName : '—');

  const customerId =
    data.customer_id ||
    data.custom_customer_id ||
    (isDealer ? 'DEALER' : '—');

  const phoneNumber =
    data.phone_number ||
    data.phoneNumber ||
    data.mobile_no ||
    '—';

  const dateOfBirth = formatDate(data.dateOfBirth || data.custom_date_of_birth);

  const idType = data.government_id || data.idType || '—';
  const idNumber = data.idNumber || data.id_number || '—';
  const idIssueCountry = data.idIssueCountry || data.id_issue_country || '—';
  const idIssueDate = formatDate(data.id_issue_date || data.idIssueDate);
  const idExpiryDate = formatDate(data.id_expiry_date || data.idExpiryDate);

  const rawOet = data.oet_code || data.oetCode;
  const oetCode = rawOet
    ? (String(rawOet).toLowerCase().startsWith('code') ? String(rawOet) : `Code ${rawOet}`)
    : '—';

  const riskLevel = data.risk_level || data.riskLevel || 'Low';

  const getRiskBadge = (level) => {
    const norm = String(level).toLowerCase();
    if (norm.includes('high')) {
      return {
        text: level,
        className: 'bg-red-100 text-red-800 border border-red-200',
      };
    }
    if (norm.includes('med')) {
      return {
        text: level,
        className: 'bg-amber-100 text-amber-800 border border-amber-200',
      };
    }
    return {
      text: level,
      className: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    };
  };

  const isBuy = exchangeType === 'BUY';
  const transactionTypeBadge = {
    text: isDealer
      ? (isBuy ? 'BUY (Dealer Sells Forex)' : 'SELL (Dealer Buys Forex)')
      : (isBuy ? 'BUY (Customer Sells Forex)' : 'SELL (Customer Buys Forex)'),
    className: isBuy
      ? 'bg-blue-50 text-blue-700 border border-blue-200'
      : 'bg-purple-50 text-purple-700 border border-purple-200',
  };

  const fjdAmount = data.receiverGets ?? receiverGets ?? 0;

  const location = [
    data.city || data.city__province,
    data.country || data.destination_country,
  ].filter(Boolean).join(', ');

  const purpose = data.rbf_purpose || data.purposeOfTransaction;
  const remarks = data.remarks;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Page heading ── */}
      <div className="text-center flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1 shadow-md"
          style={{ background: gradBtn }}>
          <CheckCircle2 size={22} className="text-white" strokeWidth={2} />
        </div>
        <h1 className="text-h1 font-bold text-ink tracking-tight">
          Review Exchange Details
        </h1>
        <p className="text-muted text-body max-w-sm">
          Please review the information below carefully before confirming your transaction.
        </p>
      </div>

      {/* ── Main card ── */}
      <div className="rounded-3xl overflow-hidden shadow-xl border border-red-100"
        style={{ boxShadow: `0 20px 60px ${R.primary}18` }}>

        {/* ── Hero: Customer Receives ── */}
        <div className="relative overflow-hidden px-8 pt-8 pb-10" style={{ background: gradHero }}>

          {/* Edit button */}
          <button onClick={onEdit}
            className="absolute z-25 top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-label font-semibold transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
            <Edit2 size={13} strokeWidth={2.5} />
            Edit
          </button>

          {/* Content */}
          <div className="relative text-center flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
              <Sparkles size={12} className="text-red-200" />
              <span className="text-overline font-semibold text-white/90 uppercase tracking-wider">
                {exchangeType === 'BUY' ? 'MH Receives' : (isDealer ? 'Dealer Receives' : 'Customer Receives')}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-display font-bold text-white tracking-tight leading-none tnum">
                {fmt(sendAmount)}
              </span>
              <span className="text-amount font-bold text-red-200">{senderCurrency}</span>
            </div>

            {exchangeRate > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
                <TrendingUp size={13} className="text-red-200" />
                <span className="text-white/90 text-caption font-semibold tnum">
                  {isDealer ? 'Agreed Dealer Rate:' : 'Rate:'} 1 FJD = {exchangeRate.toFixed(4)} {senderCurrency}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Breakdown body: Grouped Cards ── */}
        <div className="bg-gray-50/50 px-6 md:px-8 py-6 flex flex-col gap-4">

          {/* Group 1: Exchange Details Card */}
          <SummaryGroupCard
            icon={ArrowLeftRight}
            title="Exchange Details"
            subtitle="Currencies, rate, and net settlement"
            badge={
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-semibold ${transactionTypeBadge.className}`}>
                {transactionTypeBadge.text}
              </span>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5">
              <SummaryInfoItem
                label={exchangeType === 'BUY' ? 'Forex Received by MH' : (isDealer ? 'Forex Paid to Dealer' : 'Forex Paid to Customer')}
                value={`${fmt(sendAmount)} ${senderCurrency}`}
              />
              <SummaryInfoItem
                label={isDealer ? 'Agreed Dealer Rate' : 'Exchange Rate'}
                value={exchangeRate > 0 ? `1 FJD = ${Number(exchangeRate).toFixed(4)} ${senderCurrency}` : '—'}
              />
              <SummaryInfoItem
                label={exchangeType === 'BUY' ? (isDealer ? 'FJD Paid to Dealer' : 'FJD Paid to Customer') : (isDealer ? 'FJD Received from Dealer' : 'FJD Received from Customer')}
                value={`FJ$ ${fmt(fjdAmount)}`}
              />
              <SummaryInfoItem
                label="Settlement Method"
                value={isDealer ? 'Dealer Settlement' : (isCash ? 'Cash Counter' : 'Bank Deposit')}
              />
              {purpose ? (
                <SummaryInfoItem
                  label="Purpose of Transaction"
                  value={purpose}
                  colSpan2
                />
              ) : null}
            </div>
          </SummaryGroupCard>

          {/* Group 2: Customer / Dealer Profile Card */}
          <SummaryGroupCard
            icon={User}
            title={isDealer ? 'Dealer Information' : 'Personal Information'}
            subtitle={isDealer ? 'Dealer identification and credentials' : 'Customer identification and contact info'}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5">
              <SummaryInfoItem
                label={isDealer ? 'Dealer Full Name' : 'Full Name'}
                value={customerName}
              />
              <SummaryInfoItem
                label={isDealer ? 'Dealer ID' : 'Customer ID'}
                value={customerId}
              />
              {!isDealer && (
                <SummaryInfoItem
                  label="Phone Number"
                  value={phoneNumber}
                />
              )}
              <SummaryInfoItem
                label="Date of Birth"
                value={dateOfBirth}
              />
              {location ? (
                <SummaryInfoItem
                  label="Location / Destination"
                  value={location}
                  colSpan2
                />
              ) : null}
            </div>
          </SummaryGroupCard>

          {/* Group 3: ID Verification & Compliance Card */}
          <SummaryGroupCard
            icon={ShieldCheck}
            title={isDealer ? 'Verification & Compliance' : 'ID Verification & Compliance'}
            subtitle={isDealer ? 'Attached identification and regulatory risk checks' : 'Identification credentials and regulatory risk checks'}
            badge={
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-semibold ${getRiskBadge(riskLevel).className}`}>
                Risk: {getRiskBadge(riskLevel).text}
              </span>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5">
              {isDealer ? (
                <>
                  <SummaryInfoItem
                    label="Passport / ID Document"
                    value={data.docFile ? (data.docFile.name || 'Passport Document Uploaded') : 'Passport Document Uploaded'}
                  />
                  <SummaryInfoItem
                    label="OET Code"
                    value={oetCode}
                  />
                  {idNumber && idNumber !== '—' && (
                    <SummaryInfoItem
                      label="Dealer / ID Number"
                      value={idNumber}
                    />
                  )}
                  {remarks ? (
                    <SummaryInfoItem
                      label="Remarks / Notes"
                      value={remarks}
                      colSpan2
                    />
                  ) : null}
                </>
              ) : (
                <>
                  <SummaryInfoItem
                    label="ID Type"
                    value={idType}
                  />
                  <SummaryInfoItem
                    label="ID Number"
                    value={idNumber}
                  />
                  <SummaryInfoItem
                    label="ID Issue Country"
                    value={idIssueCountry}
                  />
                  <SummaryInfoItem
                    label="ID Expiry Date"
                    value={idExpiryDate}
                  />
                  {idIssueDate && idIssueDate !== '—' && (
                    <SummaryInfoItem
                      label="ID Issue Date"
                      value={idIssueDate}
                    />
                  )}
                  <SummaryInfoItem
                    label="OET Code"
                    value={oetCode}
                  />
                  {remarks ? (
                    <SummaryInfoItem
                      label="Remarks / Notes"
                      value={remarks}
                      colSpan2
                    />
                  ) : null}
                </>
              )}
            </div>
          </SummaryGroupCard>

          {/* Final amount strip */}
          <div className="mt-2 relative overflow-hidden rounded-2xl px-5 py-4"
            style={{ background: gradBtn, boxShadow: `0 8px 32px ${R.primary}44` }}>

            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 size={12} className="text-red-200" strokeWidth={3} />
                  <span className="text-red-100 text-overline font-semibold uppercase tracking-wider">
                    Total {exchangeType === 'BUY' ? 'Forex Received' : 'Forex Paid'}
                  </span>
                </div>
                <p className="text-red-100/90 text-caption font-medium">
                  Net Settlement: <span className="font-bold text-white tnum">FJ$ {fmt(fjdAmount)}</span>
                </p>
              </div>
              <div className="text-white font-bold text-display tracking-tight text-right tnum">
                {fmt(sendAmount)} <span className="text-h2 text-red-200">{senderCurrency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer actions ── */}
        <div className="px-6 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ background: R.soft, borderTop: `1.5px solid ${R.muted}` }}>

          {/* Security badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ background: 'white', border: `1px solid ${R.muted}` }}>
            <ShieldCheck size={15} style={{ color: R.primary }} strokeWidth={2.5} />
            <span className="text-overline font-semibold uppercase tracking-wider" style={{ color: R.dark }}>
              Encrypted &amp; Secure
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button onClick={onCancel}
              className="px-6 py-3 rounded-2xl text-btn-lg font-semibold border-2 text-gray-500 bg-white transition-all hover:border-red-200 hover:text-red-500"
              style={{ borderColor: R.muted }}>
              Cancel
            </button>

            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex items-center gap-2.5 px-8 py-3 rounded-2xl text-btn-lg font-semibold text-white transition-all active:scale-95 group"
              style={{
                background: gradBtn,
                boxShadow: `0 8px 24px ${R.primary}44`,
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? (
                <>
                  <span style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    border: '2.5px solid rgba(255,255,255,0.35)',
                    borderTopColor: '#fff',
                    animation: 'spin 0.7s linear infinite',
                    display: 'inline-block', flexShrink: 0,
                  }} />
                  Processing…
                </>
              ) : (
                <>
                  Confirm Transaction
                  <ArrowRight size={17} strokeWidth={2.5}
                    className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* ── No Warehouse Modal ── */}
      {showNoWarehouseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-7 max-w-sm w-full mx-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${R.primary}15` }}>
                <MapPin size={20} style={{ color: R.primary }} />
              </div>
              <div className="flex-1">
                <h3 className="text-h2 font-bold text-ink mb-1">Location Not Selected</h3>
                <p className="text-body text-muted leading-relaxed">
                  No location is set. Please select the default Location in Settings first, then continue.
                </p>
              </div>
              <button onClick={() => setShowNoWarehouseModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5">
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowNoWarehouseModal(false)}
                className="px-6 py-2.5 rounded-xl text-label font-semibold text-white transition-all hover:opacity-90"
                style={{ background: gradBtn }}>
                OK, Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};