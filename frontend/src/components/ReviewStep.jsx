
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



import React, { useState } from 'react';
import {
  Edit2,
  TrendingUp,
  Info,
  Landmark,
  Clock,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Wallet,
  ArrowLeftRight,
  MapPin,
  X,
} from 'lucide-react';
import { useExchange } from '../context/ExchangeContext';
import { useSettings } from '../context/SettingsContext';

// ── Red Design Tokens (mirrors ReceiverForm / Summary) ────────────────────────
const R = {
  primary : '#dc2626',
  accent  : '#ef4444',
  bright  : '#f87171',
  dark    : '#7f1d1d',
  deeper  : '#450a0a',
  soft    : '#fff1f2',
  muted   : '#ffe4e6',
  orange  : '#f97316',
};

const gradHero = `linear-gradient(135deg, ${R.deeper} 0%, ${R.dark} 50%, ${R.primary} 100%)`;
const gradBtn  = `linear-gradient(135deg, ${R.accent} 0%, ${R.primary} 60%, ${R.dark} 100%)`;
const gradCard = `linear-gradient(135deg, ${R.soft} 0%, #fff 100%)`;

// ── Tiny row component ────────────────────────────────────────────────────────
const ReviewRow = ({ label, value, icon: Icon, accent }) => (
  <div className="flex items-center justify-between py-3 px-4 rounded-2xl transition-colors hover:bg-gray-50">
    <div className="flex items-center gap-2.5">
      {Icon && (
        <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: accent ? `${R.primary}15` : '#f3f4f6' }}>
          <Icon size={13} style={{ color: accent ? R.primary : '#9ca3af' }} strokeWidth={2.5} />
        </div>
      )}
      <span className="text-sm font-bold text-gray-500">{label}</span>
    </div>
    <span className="font-black text-sm" style={{ color: accent ? R.dark : '#1f2937' }}>{value}</span>
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

  const handleConfirm = () => {
    if (!selectedWarehouse?.warehouse) {
      setShowNoWarehouseModal(true);
      return;
    }
    onConfirm?.();
  };

  const {
    sendAmount       = 0,
    senderCurrency   : _senderCurrency,
    receiverCurrency : _receiverCurrency,
    foreignCurrency,
    localCurrency,
    exchangeRate     = 0,
    receiverGets     = 0,
    firstName        = '',
    lastName         = '',
    bankName         = '',
    accountNumber    = '',
    deliveryMethod   = 'BANK_DEPOSIT',
    country          = '',
    exchangeType     = 'BUY',
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

  return (
    <div className="flex flex-col gap-6">

      {/* ── Page heading ── */}
      <div className="text-center flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1 shadow-md"
          style={{ background: gradBtn }}>
          <CheckCircle2 size={22} className="text-white" strokeWidth={2} />
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
          Review Exchange Details
        </h2>
        <p className="text-gray-400 text-sm font-medium max-w-sm">
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
            className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
            <Edit2 size={13} strokeWidth={2.5} />
            Edit
          </button>

          {/* Content */}
          <div className="relative text-center flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
              <Sparkles size={12} className="text-yellow-300" />
              <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">
                {exchangeType === 'BUY' ? 'MH Receives' : (isDealer ? 'Dealer Receives' : 'Customer Receives')}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-5xl md:text-6xl font-black text-white tracking-tight leading-none">
                {fmt(sendAmount)}
              </span>
              <span className="text-2xl font-black text-red-200">{senderCurrency}</span>
            </div>

            {exchangeRate > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
                <TrendingUp size={13} className="text-yellow-300" />
                <span className="text-white/80 text-xs font-bold">
                  Rate: 1 {senderCurrency} = {exchangeRate.toFixed(4)} FJD
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Breakdown body ── */}
        <div className="bg-white px-6 md:px-8 py-6 flex flex-col gap-2">

          {/* Cost section — commented rows kept intact, logic unchanged */}
          <div className="pb-4" style={{ borderBottom: `1.5px dashed ${R.muted}` }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">

              {/* ── Commented section — LOGIC UNCHANGED ──
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Send Amount</span>
                  <span className="font-bold text-gray-900">
                    {fmt(sendAmount)} {senderCurrency}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1">
                    Service Fee ({serviceRate * 100}%)
                    <Info size={14} className="text-gray-400" />
                  </span>
                  <span className="font-bold text-gray-900">
                    +{fmt(serviceFee)} {senderCurrency}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">GST ({gstRate * 100}%)</span>
                  <span className="font-bold text-gray-900">
                    +{fmt(gstAmount)} {senderCurrency}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total to Pay</span>
                  <span className="font-extrabold text-lg text-gray-900">
                    {fmt(total)} {senderCurrency}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery Method</span>
                  <span className="font-bold flex items-center gap-1">
                    <Landmark size={16} style={{ color: R.primary }} />
                    {isCash ? 'Cash Pickup' : 'Bank Deposit'}
                  </span>
                </div>
              </div>
              ── end commented section ── */}

            </div>
          </div>

          {/* Cash Denomination Breakdown — commented, LOGIC UNCHANGED */}
          {/* {isCash && denominationRows.length > 0 && (
            <div className="pb-6 border-b border-gray-100">
              <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-3">
                Cash Denomination Breakdown
              </h3>
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs uppercase text-gray-400">
                      <th className="px-4 py-2 text-left">Denomination</th>
                      <th className="px-4 py-2 text-center">Count</th>
                      <th className="px-4 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {denominationRows.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-2 font-bold">{row.denomination_value}</td>
                        <td className="px-4 py-2 text-center">× {row.count}</td>
                        <td className="px-4 py-2 text-right font-bold">{fmt(row.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )} */}

          {/* Arrival Info — commented, LOGIC UNCHANGED */}
          {/* <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
            <Clock size={18} className="text-blue-600" />
            <div>
              <p className="text-sm font-bold text-blue-900">
                Estimated Arrival: 1–2 Business Days
              </p>
              <p className="text-xs text-blue-700">
                Funds are typically available within 24 hours depending on bank processing.
              </p>
            </div>
          </div> */}

          {/* Summary highlight card */}
          <div className="mt-2 flex flex-col gap-2">
            <ReviewRow
              label={exchangeType === 'BUY' ? 'MH Receives' : (isDealer ? 'Dealer Receives' : 'Customer Receives')}
              value={`${fmt(sendAmount)} ${senderCurrency}`}
              icon={ArrowLeftRight}
              accent
            />
            <ReviewRow
              label="Exchange Rate"
              value={exchangeRate > 0 ? `1 ${senderCurrency} = ${exchangeRate.toFixed(4)} FJD` : '—'}
              icon={TrendingUp}
              accent
            />
            {/* <ReviewRow
              label="Delivery Method"
              value={isCash ? 'Cash Pickup' : 'Bank Deposit'}
              icon={Landmark}
            /> */}
          </div>

          {/* Final amount strip */}
          <div className="mt-3 relative overflow-hidden rounded-2xl px-5 py-5"
            style={{ background: gradBtn, boxShadow: `0 8px 32px ${R.primary}44` }}>
            
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 size={12} className="text-red-200" strokeWidth={3} />
                  <span className="text-red-100 text-[10px] font-black uppercase tracking-[0.18em]">
                    Final Forex Amount
                  </span>
                </div>
                {/* <p className="text-red-200 text-xs font-medium">Fijian Dollar · FJD</p> */}
              </div>
              <div className="text-white font-black text-3xl tracking-tight">
                {fmt(sendAmount)} <span className="text-xl text-red-200">{senderCurrency}</span>
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
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: R.dark }}>
              Encrypted &amp; Secure
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button onClick={onCancel}
              className="px-6 py-3 rounded-2xl text-sm font-black border-2 text-gray-500 bg-white transition-all hover:border-red-200 hover:text-red-500"
              style={{ borderColor: R.muted }}>
              Cancel
            </button>

            <button onClick={handleConfirm}
              className="flex items-center gap-2.5 px-8 py-3 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-95 group"
              style={{ background: gradBtn, boxShadow: `0 8px 24px ${R.primary}44` }}>
              Confirm Transaction
              <ArrowRight size={17} strokeWidth={2.5}
                className="group-hover:translate-x-1 transition-transform" />
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
                <h3 className="text-base font-black text-gray-900 mb-1">Location Not Selected</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
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
                className="px-6 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:opacity-90"
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