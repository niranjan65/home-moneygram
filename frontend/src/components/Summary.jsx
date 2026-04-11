
// import React from 'react';
// import { Info, ShieldCheck, Zap, TrendingUp } from 'lucide-react';
// import { useExchange } from '../context/ExchangeContext';


// export const Summary = () => {
//   const {
//     receiverGets,
//     serviceFee,
//     gstAmount,
//     total,
//     serviceRate,
//     gstRate,
//     exchangeType,
//   } = useExchange();

//   const roundToNearestFiveCents = (amount) => {
//   if (!amount) return 0;
//   return Math.round(amount / 0.05) * 0.05;
// };

//   const roundedTotal = roundToNearestFiveCents(total);

//   return (
//     <div className="sticky top-24 flex flex-col gap-5">
//       <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-primary/5 overflow-hidden">
        
//         <div className="bg-primary/5 p-5 border-b border-primary/10">
//           <h4 className="text-gray-900 font-extrabold text-lg">
//             Summary
//           </h4>
//         </div>

//         <div className="p-6 flex flex-col gap-5">

//           <div className="flex flex-col gap-3 pb-4 border-b border-dashed border-gray-200">

//             <div className="flex justify-between items-center">
//               <span className="text-gray-500 text-sm font-semibold">
//                 Receiver Gets
//               </span>
//               <span className="font-bold text-sm">
//                 {receiverGets.toLocaleString('en-US', {
//                   style: 'currency',
//                   currency: 'FJD',
//                 })}
//               </span>
//             </div>

//             {/* <div className="flex justify-between items-center">
//               <span className="text-gray-500 text-sm font-semibold flex items-center gap-1">
//                 Service Fee ({serviceRate * 100}%)
//                 <Info size={14} className="text-gray-400" />
//               </span>
//               <span className="font-bold text-sm">
//                 {serviceFee.toLocaleString('en-US', {
//                   style: 'currency',
//                   currency: 'FJD',
//                 })}
//               </span>
//             </div>

//             <div className="flex justify-between items-center">
//               <span className="text-gray-500 text-sm font-semibold">
//                 GST ({gstRate * 100}%)
//               </span>
//               <span className="font-bold text-sm">
//                 {gstAmount.toLocaleString('en-US', {
//                   style: 'currency',
//                   currency: 'FJD',
//                 })}
//               </span>
//             </div> */}

//           </div>

//           <div className="flex justify-between items-end pb-2">
//             <span className="text-gray-900 text-base font-extrabold">
//               {exchangeType === "BUY"
//                 ? "Total to Pay"
//                 : "Total Customer Gets"}
//             </span>
//             <span className="text-gray-900 text-2xl font-black">
//               {Math.abs(receiverGets).toLocaleString('en-US', {
//                 style: 'currency',
//                 currency: 'FJD',
//               })}
//             </span>
//           </div>

//           <div className="mt-2 rounded-2xl bg-primary p-5 text-gray-900">
//             <span className="block text-xs font-black uppercase tracking-widest opacity-70 mb-1">
//               Final Amount
//             </span>

//             <div className="text-3xl font-black tracking-tighter">
//               {Math.abs(receiverGets).toLocaleString('en-US', {
//                 style: 'currency',
//                 currency: 'FJD',
//               })}
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="flex items-center justify-center gap-2 text-gray-500 text-xs font-semibold">
//         <ShieldCheck size={16} className="text-primary" />
//         Encrypted & Secure Transaction
//       </div>
//     </div>
//   );
// };




// import React from 'react';
// import { Info, ShieldCheck, TrendingUp, Wallet, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
// import { useExchange } from '../context/ExchangeContext';

// // ── Red Design Tokens (mirrors ReceiverForm) ──────────────────────────────────
// const R = {
//   primary : '#dc2626',
//   accent  : '#ef4444',
//   bright  : '#f87171',
//   dark    : '#7f1d1d',
//   deeper  : '#450a0a',
//   soft    : '#fff1f2',
//   muted   : '#ffe4e6',
//   orange  : '#f97316',
// };

// const gradHero = `linear-gradient(135deg, ${R.deeper} 0%, ${R.dark} 50%, ${R.primary} 100%)`;
// const gradBtn  = `linear-gradient(135deg, ${R.accent} 0%, ${R.primary} 60%, ${R.dark} 100%)`;

// export const Summary = () => {
//   const {
//     receiverGets,
//     serviceFee,
//     gstAmount,
//     total,
//     serviceRate,
//     gstRate,
//     exchangeType,
//   } = useExchange();

//   const roundToNearestFiveCents = (amount) => {
//     if (!amount) return 0;
//     return Math.round(amount / 0.05) * 0.05;
//   };

//   const roundedTotal = roundToNearestFiveCents(total);

//   const fmt = (val) =>
//     Math.abs(val).toLocaleString('en-US', { style: 'currency', currency: 'FJD' });

//   return (
//     <div className="sticky top-24 flex flex-col gap-4">

//       {/* ── Main summary card ── */}
//       <div className="rounded-3xl overflow-hidden shadow-xl" style={{ boxShadow: `0 20px 60px ${R.primary}22` }}>

//         {/* Header band */}
//         <div className="relative overflow-hidden px-6 pt-6 pb-5" style={{ background: gradHero }}>
          

//           <div className="relative flex items-center gap-3 mb-4">
//             <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
//               style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
//               <Wallet size={17} className="text-white" strokeWidth={2} />
//             </div>
//             <div>
//               <p className="text-white font-black text-base tracking-tight">Transaction Summary</p>
//               <p className="text-red-200 text-[11px] font-medium mt-0.5">Live calculation</p>
//             </div>
            
//           </div>

//           {/* Exchange type badge */}
//           <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl"
//             style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
//             <TrendingUp size={12} className="text-yellow-300" />
//             <span className="text-white font-black text-xs uppercase tracking-widest">
//               {exchangeType === 'BUY' ? 'Buying Foreign Currency' : 'Selling Foreign Currency'}
//             </span>
//           </div>
//         </div>

//         {/* Body */}
//         <div className="bg-white px-6 py-5 flex flex-col gap-4">

//           {/* Line items */}
//           <div className="flex flex-col gap-3 pb-4"
//             style={{ borderBottom: `1.5px dashed ${R.muted}` }}>

//             <div className="flex justify-between items-center">
//               <div className="flex items-center gap-2">
//                 <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
//                   style={{ background: R.soft }}>
//                   <ArrowRight size={11} style={{ color: R.primary }} strokeWidth={3} />
//                 </div>
//                 <span className="text-gray-500 text-sm font-bold">Amount</span>
//               </div>
//               <span className="font-black text-sm" style={{ color: R.dark }}>
//                 {fmt(receiverGets)}
//               </span>
//             </div>

            

//           </div>

//           {/* Total to Pay row */}
//           <div className="flex justify-between items-center px-4 py-3 rounded-2xl"
//             style={{ background: R.soft, border: `1.5px solid ${R.muted}` }}>
//             <div className="flex items-center gap-2">
//               <div className="w-7 h-7 rounded-xl flex items-center justify-center"
//                 style={{ background: gradBtn }}>
//                 <Wallet size={13} className="text-white" strokeWidth={2.5} />
//               </div>
//               <span className="font-black text-sm" style={{ color: R.dark }}>
//                 {exchangeType === 'BUY' ? 'Total to Pay' : 'Total Customer Gets'}
//               </span>
//             </div>
//             <span className="font-black text-lg" style={{ color: R.primary }}>
//               {fmt(receiverGets)}
//             </span>
//           </div>

//           {/* Final amount hero card */}
//           <div className="relative overflow-hidden rounded-2xl px-5 py-5"
//             style={{ background: gradBtn, boxShadow: `0 8px 32px ${R.primary}44` }}>
            

//             <div className="relative">
//               <div className="flex items-center gap-1.5 mb-2">
//                 <CheckCircle2 size={13} className="text-red-200" strokeWidth={3} />
//                 <span className="text-red-100 text-[10px] font-black uppercase tracking-[0.18em]">
//                   Final Amount
//                 </span>
//               </div>
//               <div className="text-white font-black text-3xl tracking-tight leading-none">
//                 {fmt(receiverGets)}
//               </div>
//               <p className="text-red-200 text-[11px] font-medium mt-2">
//                 Fijian Dollar · FJD
//               </p>
//             </div>
//           </div>

//         </div>
//       </div>

//       {/* ── Security badge ── */}
//       <div className="flex items-center justify-center gap-2 py-3 rounded-2xl"
//         style={{ background: R.soft, border: `1px solid ${R.muted}` }}>
//         <ShieldCheck size={15} style={{ color: R.primary }} strokeWidth={2.5} />
//         <span className="text-xs font-black uppercase tracking-widest" style={{ color: R.dark }}>
//           Encrypted &amp; Secure Transaction
//         </span>
//       </div>

//     </div>
//   );
// };











import React from 'react';
import { ShieldCheck, TrendingUp, Wallet, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useExchange } from '../context/ExchangeContext';

export const Summary = ({transferPayload, isDealer = false}) => {
  const {
    receiverGets,
    serviceFee,
    gstAmount,
    total,
    serviceRate,
    gstRate,
    exchangeType,
  } = useExchange();
  

  console.log('Summary render', transferPayload);

  const roundToNearestFiveCents = (amount) => {
    if (!amount) return 0;
    return Math.round(amount / 0.05) * 0.05;
  };

  const roundedTotal = roundToNearestFiveCents(total);

  const fmt = (val) =>
    Math.abs(val).toLocaleString('en-US', { style: 'currency', currency: 'FJD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="sticky top-24 flex flex-col gap-3">

      {/* Main summary card */}
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">

        {/* Header */}
        <div className="px-5 py-4 bg-[#B70000] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
              <Wallet size={15} className="text-white" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Transaction Summary</p>
              <p className="text-[#b5f000] text-xs mt-0.5">Live calculation</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-yellow-200 bg-white/10 border border-white/20 px-2.5 py-1 rounded-lg uppercase tracking-wide">
            <TrendingUp size={11} strokeWidth={2} />
            {exchangeType === 'BUY' ? 'Buying' : 'Selling'}
          </span>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-3">

          {/* Line items */}
          <div className="flex flex-col gap-2.5 pb-3 border-b border-dashed border-gray-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ArrowRight size={13} className="text-[#E00000]" strokeWidth={2} />
                <span className="text-gray-500 text-sm">Amount</span>
              </div>
              <span className="font-semibold text-sm text-gray-800">
                {fmt(receiverGets)}
              </span>
            </div>
          </div>

          {/* Total row */}
          <div className="flex justify-between items-center px-3 py-2.5 rounded-lg bg-[#E00000]/10 border border-[#E00000]/20">
            <div className="flex items-center gap-2">
              <Wallet size={13} className="text-[#E00000]" strokeWidth={2} />
              <span className="text-sm font-medium text-[#B70000]">
                {exchangeType === 'BUY' ? (isDealer ? 'Dealer Pays' : 'Customer Pays') : (isDealer ? 'Dealer Pays' : 'Customer Pays')}
              </span>
            </div>
            <span className="font-semibold text-sm text-[#B70000]">
              {/* {fmt(receiverGets)} */}
              {/* {exchangeType === 'BUY' ? `${transferPayload?.sendAmount} ${transferPayload?.receiverCurrency}` : fmt(receiverGets)} */}
              {exchangeType === 'BUY'
  ? `${transferPayload?.sendAmount ?? 0} ${transferPayload?.receiverCurrency ?? ''}`
  : fmt(receiverGets ?? 0)
}
            </span>
          </div>

          {/* Final amount */}
          <div className="rounded-lg bg-[#E00000] px-4 py-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <CheckCircle2 size={12} className="text-[#b5f000]" strokeWidth={2.5} />
              <span className="text-[#b5f000] text-[10px] font-semibold uppercase tracking-widest">
                {/* MH {exchangeType === 'SELL' ? 'Gets' : 'Pays'} */}
                MH Pays
              </span>
            </div>
            <div className="text-white font-bold text-2xl tracking-tight">
              {exchangeType === 'BUY' ? fmt(receiverGets ?? 0) : `${transferPayload?.receiverCurrency ?? ''} ${transferPayload?.sendAmount ?? 0}`}
            </div>
            {/* <p className="text-white/80 text-xs mt-1">Fijian Dollar · FJD</p> */}
          </div>

        </div>
      </div>

      {/* Security badge */}
      <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-50 border border-gray-100">
        <ShieldCheck size={13} className="text-[#E00000]" strokeWidth={2} />
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Encrypted &amp; Secure Transaction
        </span>
      </div>

    </div>
  );
};