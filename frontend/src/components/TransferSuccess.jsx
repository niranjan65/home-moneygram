// import React, { useState } from 'react';
// import {
//   Check,
//   Copy,
//   LayoutDashboard,
//   FileText,
//   HelpCircle,
//   TrendingUp,
//   Info,
// } from 'lucide-react';
// import { useExchange } from '../context/ExchangeContext';

// const PRIMARY = '#30e87a';
// const PRIMARY_DARK = '#24b35f';

// /**
//  * TransferSuccess
//  *
//  * Props:
//  *  data — the transferPayload from ReceiverForm / MoneyExchange:
//  *    {
//  *      sendAmount, senderCurrency,
//  *      receiverGets, receiverCurrency,
//  *      exchangeRate,
//  *      firstName, lastName,
//  *      totalDispensed,       // cash pickup only
//  *    }
//  *  apiDoc — the created Currency Exchange For Customer doc from ERPNext API
//  *  transactionId    — string, e.g. '#TRX-882910' (auto-generated if omitted)
//  *  estimatedArrival — string, e.g. 'Today by 5:00 PM'
//  *  onDashboard      — () => void
//  *  onDownloadReceipt— () => void
//  */
// export const TransferSuccess = ({
//   data = {},
//   apiDoc,
//   transactionId,
//   estimatedArrival = 'Today by 5:00 PM',
//   onDashboard,
//   onDownloadReceipt,
// }) => {

//   console.log("transfer successfull ", apiDoc)

//   // Pull calculated exchange values from ExchangeContext
//   const exchange = useExchange();
//   // Prefer API doc values, fall back to local data
//   const sendAmount = apiDoc?.you_send ?? apiDoc?.send_amount ?? data.sendAmount ?? 0;
//   const senderCurrency = apiDoc?.you_send_currency_type ?? data.senderCurrency ?? 'USD';
//   const receiverGets = apiDoc?.they_receive ?? data.receiverGets ?? 0;
//   const receiverCurrency = apiDoc?.they_receive_currency_type ?? data.receiverCurrency ?? 'EUR';
//   const exchangeRate = apiDoc?.exchange_rate ?? data.exchangeRate ?? 0;
//   const firstName = apiDoc?.first_name ?? data.firstName ?? '';
//   const lastName = apiDoc?.last_name ?? data.lastName ?? '';
//   const totalDispensed = data.totalDispensed;
//   const transferFee = apiDoc?.transfer_fee ?? 0;
//   const totalAmount = apiDoc?.total_amount ?? 0;
//   const docName = apiDoc?.name ?? null;

//   // Use doc name as reference, or transactionId prop, or auto-generate
//   const txId = docName || transactionId || `#TRX-${Math.floor(100000 + Math.random() * 900000)}`;

//   const [copied, setCopied] = useState(false);

//   const handleCopy = () => {
//     navigator.clipboard.writeText(txId).catch(() => { });
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const fmt = (val, decimals = 2) =>
//     Number(val).toLocaleString(undefined, {
//       minimumFractionDigits: decimals,
//       maximumFractionDigits: decimals,
//     });

//   const recipientName = `${firstName} ${lastName}`.trim() || 'the recipient';
//   const finalAmount = totalDispensed ?? receiverGets;

//   // Currency symbol helper
//   const symMap = { USD: '$', EUR: '€', GBP: '£', INR: '₹', PHP: '₱', MXN: '$', JPY: '¥' };
//   const toSym = symMap[receiverCurrency] ?? '';

//   return (
//     <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6">
//       <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden relative border border-gray-100">

//         {/* Decorative top glow */}
//         <div
//           className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 rounded-full pointer-events-none"
//           style={{ background: `${PRIMARY}18`, filter: 'blur(60px)' }}
//         />

//         <div className="relative flex flex-col items-center p-8 sm:p-12 text-center">

//           {/* Success Icon */}
//           <div className="mb-8 relative">
//             <div
//               className="absolute inset-0 rounded-full blur-xl scale-75"
//               style={{ background: `${PRIMARY}33` }}
//             />
//             <div
//               className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
//               style={{
//                 background: PRIMARY,
//                 boxShadow: `0 8px 32px ${PRIMARY}55`,
//                 animation: 'successBounce 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
//               }}
//             >
//               <Check size={40} strokeWidth={3.5} className="text-white" />
//             </div>
//           </div>

//           {/* Heading */}
//           <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
//             Transfer Successful
//           </h1>
//           <p className="text-gray-500 text-lg font-medium max-w-md">
//             Your money is securely on its way to{' '}
//             <span className="font-bold text-gray-900">{recipientName}</span>.
//           </p>

//           {/* Reference / Transaction ID chip */}
//           {/* <button
//             onClick={handleCopy}
//             className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full border transition-all group"
//             style={{
//               background: '#f6f8f7',
//               borderColor: copied ? PRIMARY : '#e5e7eb',
//             }}
//             title="Click to copy"
//           >
//             <span className="text-sm font-semibold text-gray-500">
//               {docName ? 'Reference No:' : 'Transaction ID:'}
//             </span>
//             <span className="text-sm font-bold text-gray-900 font-mono tracking-wide">{txId}</span>
//             {copied
//               ? <Check size={16} strokeWidth={3} style={{ color: PRIMARY }} />
//               : <Copy size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
//             }
//           </button> */}

//           {/* Details Card */}
//           <div className="mt-10 w-full bg-gray-50 rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100">

//             {/* Receiver Gets */}
//             <div className="flex justify-between items-center p-5">
//               <span className="text-gray-500 font-medium">Receiver Gets</span>
//               <span className="text-gray-900 font-bold text-lg">
//                 {receiverCurrency} {fmt(exchange.receiverGets)}
//               </span>
//             </div>

//             {/* Service Fee */}
//             <div className="flex justify-between items-center p-5">
//               <span className="text-gray-500 font-medium flex items-center gap-1.5">
//                 Service Fee ({(exchange.serviceRate * 100).toFixed(0)}%)
//                 <Info size={14} className="text-gray-400" />
//               </span>
//               <span className="text-gray-900 font-bold text-lg">
//                 {receiverCurrency} {fmt(exchange.serviceFee)}
//               </span>
//             </div>

//             {/* GST */}
//             <div className="flex justify-between items-center p-5">
//               <span className="text-gray-500 font-medium">
//                 GST ({(exchange.gstRate * 100).toFixed(0)}%)
//               </span>
//               <span className="text-gray-900 font-bold text-lg">
//                 {receiverCurrency} {fmt(exchange.gstAmount)}
//               </span>
//             </div>

//             {/* Total to Pay */}
//             <div className="flex justify-between items-center p-5 border-t border-gray-200">
//               <span className="text-gray-900 font-extrabold text-lg">Total to Pay</span>
//               <span className="text-gray-900 font-extrabold text-2xl">
//                 {receiverCurrency} {fmt(exchange.total)}
//               </span>
//             </div>

//             {/* Final Amount — highlighted */}
//             <div
//               className="mx-4 mb-4 rounded-xl px-6 py-5 text-center"
//               style={{ background: PRIMARY }}
//             >
//               <p className="text-xs font-black uppercase tracking-[0.15em] text-gray-900 mb-1 opacity-80">
//                 FINAL AMOUNT
//               </p>
//               <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
//                 {receiverCurrency} {fmt(exchange.total)}
//               </p>
//             </div>
//           </div>

//           {/* Arrival estimate */}
//           <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
//             <div
//               className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
//               style={{ background: `${PRIMARY}22`, color: PRIMARY_DARK }}
//             >
//               {firstName?.[0]?.toUpperCase() ?? '?'}
//             </div>
//             <p>
//               Estimated arrival:{' '}
//               <span className="font-semibold text-gray-900">{estimatedArrival}</span>
//             </p>
//           </div>

//           {/* Action Buttons */}
//           <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full justify-center">
//             <button
//               onClick={onDashboard}
//               className="flex-1 max-w-xs h-12 flex items-center justify-center gap-2 rounded-xl font-bold text-base transition-all active:scale-95 hover:opacity-90"
//               style={{
//                 background: PRIMARY,
//                 color: '#111',
//                 boxShadow: `0 8px 24px ${PRIMARY}44`,
//               }}
//             >
//               <LayoutDashboard size={18} strokeWidth={2.5} />
//               New Exchange
//             </button>
//             <button
//               onClick={onDownloadReceipt}
//               className="flex-1 max-w-xs h-12 flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 text-gray-900 font-bold text-base transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-95 bg-white"
//             >
//               <FileText size={18} strokeWidth={2.5} />
//               Download Receipt
//             </button>
//           </div>

//           {/* Support link */}
//           <div className="mt-8">
//             <a
//               href="#"
//               className="text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1 group"
//             >
//               <HelpCircle size={16} className="group-hover:scale-110 transition-transform" />
//               Need help with this transaction?
//             </a>
//           </div>
//         </div>
//       </div>

//       {/* Bounce keyframe */}
//       <style>{`
//         @keyframes successBounce {
//           0%   { transform: scale(0.3); opacity: 0; }
//           50%  { transform: scale(1.1); opacity: 1; }
//           70%  { transform: scale(0.95); }
//           100% { transform: scale(1); }
//         }
//       `}</style>
//     </div>
//   );
// };








// import React, { useState, useEffect } from 'react';
// import {
//   Check,
//   LayoutDashboard,
//   FileText,
//   HelpCircle,
//   Info,
// } from 'lucide-react';
// import { io } from 'socket.io-client';
// import { useExchange } from '../context/ExchangeContext';

// const PRIMARY = '#30e87a';
// const PRIMARY_DARK = '#24b35f';

// // 🔌 Connect to your webhook server
// const socket_server = 'http://182.71.135.110:8079';
// // const socket_server = 'http://192.168.101.172:5000';
// const socket = io(socket_server, {
//   transports: ['websocket'],
// });

// export const TransferSuccess = ({
//   data = {},
//   apiDoc,
//   transactionId,
//   estimatedArrival = 'Today by 5:00 PM',
//   onDashboard,
//   onDownloadReceipt,
// }) => {

//   const exchange = useExchange();

//   // 🔄 New States
//   const [isLoading, setIsLoading] = useState(true);
//   const [invoiceData, setInvoiceData] = useState(null);

//   // 🎧 Listen for socket event
//   useEffect(() => {

//     socket.on('connect', () => {
//       console.log('Socket connected');
//     });

//     socket.on('new-sales-invoice', (payload) => {
//       console.log('Invoice received from socket:', payload);

//       setInvoiceData(payload);
//       setIsLoading(false);
//     });

//     socket.on('disconnect', () => {
//       console.log('Socket disconnected');
//     });

//     return () => {
//       socket.off('new-sales-invoice');
//       socket.off('connect');
//       socket.off('disconnect');
//     };
//   }, []);

//   // ⏳ Loading Screen
//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-screen bg-white">
//         <div className="flex flex-col items-center gap-4">
//           <div
//             className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin"
//             style={{ borderColor: `${PRIMARY}`, borderTopColor: 'transparent' }}
//           />
//           <p className="text-gray-600 font-semibold text-lg">
//             Waiting for confirmation...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // Use socket data if available
//   const finalData = invoiceData || apiDoc || data;

//   const sendAmount = finalData?.you_send ?? data.sendAmount ?? 0;
//   const senderCurrency = finalData?.you_send_currency_type ?? data.senderCurrency ?? 'USD';
//   const receiverGets = finalData?.they_receive ?? data.receiverGets ?? 0;
//   const receiverCurrency = finalData?.they_receive_currency_type ?? data.receiverCurrency ?? 'EUR';
//   const firstName = finalData?.first_name ?? data.firstName ?? '';
//   const lastName = finalData?.last_name ?? data.lastName ?? '';
//   const recipientName = `${firstName} ${lastName}`.trim() || 'the recipient';

//   const fmt = (val, decimals = 2) =>
//     Number(val).toLocaleString(undefined, {
//       minimumFractionDigits: decimals,
//       maximumFractionDigits: decimals,
//     });

//   return (
//     <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6">
//       <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden relative border border-gray-100">

//         <div className="relative flex flex-col items-center p-8 sm:p-12 text-center">

//           {/* Success Icon */}
//           <div className="mb-8 relative">
//             <div
//               className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
//               style={{
//                 background: PRIMARY,
//                 boxShadow: `0 8px 32px ${PRIMARY}55`,
//               }}
//             >
//               <Check size={40} strokeWidth={3.5} className="text-white" />
//             </div>
//           </div>

//           <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
//             Transfer Successful
//           </h1>

//           <p className="text-gray-500 text-lg font-medium max-w-md">
//             Your money is securely on its way to{' '}
//             <span className="font-bold text-gray-900">{recipientName}</span>.
//           </p>

//           {/* Details Card */}
//           <div className="mt-10 w-full bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">

//             <div className="flex justify-between items-center p-5">
//               <span className="text-gray-500 font-medium">Receiver Gets</span>
//               <span className="text-gray-900 font-bold text-lg">
//                 {receiverCurrency} {fmt(receiverGets)}
//               </span>
//             </div>

//             <div className="flex justify-between items-center p-5 border-t border-gray-200">
//               <span className="text-gray-900 font-extrabold text-lg">Total to Pay</span>
//               <span className="text-gray-900 font-extrabold text-2xl">
//                 {receiverCurrency} {fmt(exchange.total)}
//               </span>
//             </div>

//             <div
//               className="mx-4 mb-4 rounded-xl px-6 py-5 text-center"
//               style={{ background: PRIMARY }}
//             >
//               <p className="text-xs font-black uppercase tracking-[0.15em] text-gray-900 mb-1 opacity-80">
//                 FINAL AMOUNT
//               </p>
//               <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
//                 {receiverCurrency} {fmt(exchange.total)}
//               </p>
//             </div>
//           </div>

//           {/* Buttons */}
//           <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full justify-center">
//             <button
//               onClick={onDashboard}
//               className="flex-1 max-w-xs h-12 flex items-center justify-center gap-2 rounded-xl font-bold text-base"
//               style={{
//                 background: PRIMARY,
//                 color: '#111',
//               }}
//             >
//               <LayoutDashboard size={18} />
//               New Exchange
//             </button>

//             <button
//               onClick={onDownloadReceipt}
//               className="flex-1 max-w-xs h-12 flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 text-gray-900 font-bold text-base bg-white"
//             >
//               <FileText size={18} />
//               Download Receipt
//             </button>
//           </div>

//           <div className="mt-8">
//             <a
//               href="#"
//               className="text-sm font-medium text-gray-400 hover:text-gray-700 flex items-center gap-1"
//             >
//               <HelpCircle size={16} />
//               Need help with this transaction?
//             </a>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };













import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useExchange } from '../context/ExchangeContext';
import { InvoiceDocument } from './SalesInvoice';
import { printThermalReceipt } from './ThermalReceiptPrint';
import { useUser } from '../context/UserContext';
import axios from 'axios';

// const socket_server = 'http://182.71.135.110:8079';
const socket_server = 'http://187.127.109.162:5000';
const socket = io(socket_server, { transports: ['websocket'] });

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────
const Icon = ({ name, size = 24, className = '' }) => {
  const icons = {
    check_circle: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4-4 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z" />
      </svg>
    ),
    person: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} className={className}>
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    ),
    person_pin: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} className={className}>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.3c-2.5-3.2-6-8.4-6-11.3 0-3.31 2.69-6 6-6s6 2.69 6 6c0 2.9-3.5 8.1-6 11.3z" />
      </svg>
    ),
    send: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} className={className}>
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
      </svg>
    ),
    dashboard: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} className={className}>
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    ),
    print: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} className={className}>
        <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />
      </svg>
    ),
    pdf: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} className={className}>
        <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" />
      </svg>
    ),
    wallet: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} className={className}>
        <path d="M21 7.28V5c0-1.1-.9-2-2-2H5C3.89 3 3 3.9 3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28A2 2 0 0022 15V9a2 2 0 00-1-1.72zM20 9v6h-7V9h7zM5 19V5h14v2h-6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6v2H5z" />
      </svg>
    ),
  };
  return icons[name] || null;
};

// ─── Print Invoice in a new window ───────────────────────────────────────────
const printInvoice = (invoiceData) => {
  const printWindow = window.open('', '_blank', 'width=900,height=700');

  // Collect all stylesheets from the current page to inject into the print window
  const styles = Array.from(document.styleSheets)
    .map(sheet => {
      try {
        return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
      } catch {
        // Cross-origin stylesheets can't be read
        return '';
      }
    })
    .join('\n');

  const invoiceHTML = document.getElementById('invoice-print-area')?.innerHTML ?? '';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice - ${invoiceData?.name ?? 'Receipt'}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
        <style>
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: white; }
          @page { size: A4; margin: 20mm; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          ${styles}
        </style>
      </head>
      <body>
        <div style="padding: 40px; max-width: 800px; margin: 0 auto;">
          ${invoiceHTML}
        </div>
        <script>
          window.onload = () => { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

// ─── Download PDF using browser print-to-PDF ─────────────────────────────────
const downloadPDF = (invoiceData) => {
  const printWindow = window.open('', '_blank', 'width=900,height=700');

  const invoiceHTML = document.getElementById('invoice-print-area')?.innerHTML ?? '';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice - ${invoiceData?.name ?? 'Receipt'}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
        <style>
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: white; }
          @page { size: A4; margin: 20mm; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div style="padding: 40px; max-width: 800px; margin: 0 auto;">
          ${invoiceHTML}
        </div>
        <script>
          window.onload = () => {
            // Trigger save-as-PDF dialog
            document.title = 'Invoice-${invoiceData?.name ?? 'receipt'}';
            window.print();
            window.close();
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const TransferSuccess = ({
  data = {},
  apiDoc,
  transactionId,
  onDashboard,
}) => {
  const exchange = useExchange();
  const loginUser = useUser();
  const [invoiceData, setInvoiceData] = useState(() => {
    const saved = sessionStorage.getItem('exchangeInvoiceData');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(() => {
    const saved = sessionStorage.getItem('exchangeInvoiceData');
    return saved ? false : true;
  });

  const getInvoiceData = async (invoice_id) => {
    try {
      const response = await axios.get(`https://mhmoneyexpress.anantdv.com/api/resource/Sales%20Invoice/${invoice_id}`, {
        headers: {
          Authorization: `token ${loginUser?.user?.api_key}:${loginUser?.user?.api_secret}`,
        },
      });
      return response.data.data;
    } catch (error) {
      
    }
  }

  useEffect(() => {
  if (!apiDoc?.invoice) return;

  console.log('Fetching invoice:', apiDoc.invoice);

  getInvoiceData(apiDoc.invoice)
    .then(data => {
      setInvoiceData(data);
      setIsLoading(false);
    })
    .catch((err) => {
      console.error('Error fetching invoice:', err);
      setIsLoading(false);
    });

}, [apiDoc]);
  
  useEffect(() => {
    if (invoiceData) {
      sessionStorage.setItem('exchangeInvoiceData', JSON.stringify(invoiceData));
    }
  }, [invoiceData]);

  // useEffect(() => {
  //   socket.on('connect', () => console.log('Socket connected'));
  //   socket.on('new-sales-invoice', (payload) => {
  //     console.log('Invoice received from socket:', payload);
  //     setInvoiceData(payload);
  //     setIsLoading(false);
  //   });
  //   socket.on('disconnect', () => console.log('Socket disconnected'));
  //   return () => {
  //     socket.off('new-sales-invoice');
  //     socket.off('connect');
  //     socket.off('disconnect');
  //   };
  // }, []);

  // ── Loading Screen ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#421010]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full border-4 border-[#b5f000] border-t-transparent animate-spin" />
          <p className="text-white/80 font-semibold text-lg tracking-wide">Waiting for confirmation...</p>
        </div>
        <button
          onClick={onDashboard}
          className="mt-8 px-6 py-2.5 rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm font-bold"
        >
          Cancel & Start Fresh
        </button>
      </div>
    );
  }

  // ── Data Mapping ──────────────────────────────────────────────────────────
  const finalData = invoiceData || apiDoc || data;

  const fmt = (val, decimals = 2) =>
    Number(val).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  const currency = finalData?.currency ?? 'FJD';
  const company = finalData?.company ?? 'MH Money Express';
  const senderName = finalData?.contact_email
    ? finalData.contact_email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Sender';
  const recipientName = finalData?.customer_name ?? finalData?.customer ?? 'Recipient';
  const txnId = transactionId ?? finalData?.name ?? '—';
  const rawTime = (finalData?.posting_time ?? '').split('.')[0];
  const txnDate = finalData?.posting_date
    ? `${finalData.posting_date}${rawTime ? ' | ' + rawTime : ''}`
    : '—';
  // const txnStatus     = finalData?.status ?? 'Unpaid';
  const txnStatus = 'Paid';
  const exchangeRate = finalData?.exchange_rate ?? data?.exchangeRate ?? null;
  const senderCurrency = finalData?.you_send_currency_type ?? data?.senderCurrency ?? data?.foreignCurrency ?? null;
  const receiverCurrency = finalData?.they_receive_currency_type ?? data?.receiverCurrency ?? 'FJD';

  const rows = (finalData?.items ?? []).map(item => ({
    label: item.item_code ?? item.item_name ?? '—',
    qty: item.qty ?? 0,
    rate: item.rate ?? 0,
    amount: item.amount ?? 0,
  }));

  const netAmount = finalData?.net_total ?? finalData?.total ?? 0;
  const taxAmount = finalData?.total_taxes_and_charges
    ?? (Array.isArray(finalData?.taxes)
      ? finalData.taxes.reduce((s, t) => s + (t.tax_amount ?? 0), 0)
      : 0);
  const grandTotal = finalData?.grand_total ?? exchange?.total ?? 0;
  const roundedTotal = finalData?.rounded_total ?? grandTotal;

  return (
    <div className="min-h-screen bg-[url('../assets/redbg.png')] bg-cover relative z-10 font-sans flex flex-col">

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex justify-center py-10 px-4">
        <div className="w-full max-w-4xl flex flex-col gap-8 relative z-20">

          {/* ── Hero Section ────────────────────────────────────────────── */}
          <div className="flex flex-col items-center text-center gap-4 mt-6">

            <div className="w-20 h-20 rounded-full bg-green-500 text-white flex items-center justify-center ring-8 ring-green-500/30 mt-2 shadow-xl shadow-green-500/20">
              <Icon name="check_circle" size={48} />
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-snug drop-shadow-sm">
              Transfer Successful
            </h1>
            <p className="text-gray-700 text-lg font-medium drop-shadow-sm">
              Your transaction has been completed successfully
            </p>
          </div>

          {/* ── Details Card ────────────────────────────────────────────── */}
          <div className="bg-[#602020] rounded-3xl border border-[#E00000]/30 shadow-2xl p-8 md:p-10 text-white">

            {/* Meta grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-8 border-b border-[#E00000]/30">
              <div>
                <p className="text-xs font-bold text-[#b5f000] uppercase tracking-widest mb-1">Transaction ID</p>
                <p className="font-bold text-white text-sm tracking-wide">{invoiceData?.name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-[#b5f000] uppercase tracking-widest mb-1">Date &amp; Time</p>
                <p className="font-medium text-white/90 text-sm tracking-wide">{txnDate}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-[#b5f000] uppercase tracking-widest mb-1">Status</p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#b5f000]/20 text-[#b5f000] border border-[#b5f000]/30 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#b5f000] inline-block animate-pulse" />
                  {txnStatus}
                </span>
              </div>
              <div className="md:text-right">
                <p className="text-xs font-bold text-[#b5f000] uppercase tracking-widest mb-1">Payment Method</p>
                <p className="font-medium text-white/90 text-sm tracking-wide">Cash</p>
              </div>
              {exchangeRate && (
                <div className="md:text-right col-span-2 md:col-span-1">
                  <p className="text-xs font-bold text-[#b5f000] uppercase tracking-widest mb-1">Exchange Rate</p>
                  <p className="font-bold text-white text-sm tracking-wide">
                    1 {senderCurrency ?? '—'} = {fmt(exchangeRate, 4)} FJD
                  </p>
                </div>
              )}
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-8">

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center flex-shrink-0 border border-white/20">
                  <Icon name="person_pin" size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#b5f000] uppercase tracking-widest mb-1">Customer Details</p>
                  <h3 className="text-xl font-black text-white">{recipientName}</h3>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="rounded-xl border border-[#E00000]/30 overflow-hidden bg-[#421010]/30 custom-scrollbar overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead className="bg-[#421010]/50 border-b border-[#E00000]/30">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-[#b5f000] uppercase tracking-wider">Item</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#b5f000] uppercase tracking-wider text-right">Qty</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#b5f000] uppercase tracking-wider text-right">Rate</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#b5f000] uppercase tracking-wider text-right">Amount ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E00000]/20">
                  {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-white/90">{row.label}</td>
                      <td className="px-6 py-4 text-sm text-white/70 text-right">{row.qty}</td>
                      <td className="px-6 py-4 text-sm text-white/70 text-right">{fmt(row.rate, 4)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-white text-right">{fmt(row.amount, 4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-8 pt-8 border-t border-[#E00000]/30 flex flex-col items-end gap-3">
              <div className="flex justify-between w-full max-w-[260px]">
                <span className="text-sm font-medium text-white/70">Net Amount:</span>
                <span className="text-sm font-bold text-white">{fmt(netAmount, 4)} {currency}</span>
              </div>
              <div className="flex justify-between w-full max-w-[260px]">
                <span className="text-sm font-medium text-white/70">Taxes (VAT):</span>
                <span className="text-sm font-bold text-white">{fmt(taxAmount, 4)} {currency}</span>
              </div>
              {exchangeRate && (
                <div className="flex justify-between w-full max-w-[260px]">
                  <span className="text-sm font-medium text-white/70">Exchange Rate:</span>
                  <span className="text-sm font-bold text-[#b5f000]">
                    1 {senderCurrency ?? '—'} = {fmt(exchangeRate, 4)} FJD
                  </span>
                </div>
              )}
              <div className="flex justify-between w-full max-w-[260px] pt-5 mt-2 border-t border-[#E00000]/30">
                <span className="text-lg font-black text-white">Grand Total:</span>
                <span className="text-lg font-black text-[#b5f000]">{fmt(roundedTotal)} {currency}</span>
              </div>
            </div>
          </div>

          {/* ── Action Buttons ───────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <button
              onClick={onDashboard}
              className="flex items-center justify-center gap-2 bg-[#E00000] hover:bg-[#b5f000] text-white hover:text-[#421010] font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 group"
            >
              <Icon name="send" size={20} className="transition-transform group-hover:translate-x-1" />
              Make Another Transfer
            </button>

            

            <div className="flex gap-2">
              {/* Print Receipt */}
              <button
                title="Print Receipt"
                onClick={() => printInvoice(finalData)}
                className="w-14 h-14 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/10 shadow-lg"
              >
                <Icon name="print" size={22} />
              </button>

              {/* Download PDF */}
              <button
                title="Download PDF"
                onClick={() => downloadPDF(finalData)}
                className="w-14 h-14 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/10 shadow-lg"
              >
                <Icon name="pdf" size={22} />
              </button>

              <button
                onClick={() => printThermalReceipt(finalData, exchange)}
                className="w-14 h-14 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/10 shadow-lg"
                title="Print Thermal Receipt"
              >
                <Icon name="print" size={22} />
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-white/50 mb-8 mt-4">
            Need help with this transfer?{' '}
            <a href="#" className="text-[#b5f000] font-bold hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </main>

      {/* ── Hidden Invoice DOM (used for print/PDF extraction) ──────────── */}
      <div className="hidden">
        <InvoiceDocument invoiceData={finalData} />
      </div>
    </div>
  );
};

export default TransferSuccess;