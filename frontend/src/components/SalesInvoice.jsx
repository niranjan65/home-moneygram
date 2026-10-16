import React, { useRef } from 'react';
import mhlogo from "../assets/MH.png";

// ─── Number helpers ───────────────────────────────────────────────────────────
const fmt = (val, decimals = 2) =>
  Number(val || 0).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

// ─── Convert number to words (including cents/decimals) ──────────────────────
const toWords = (num) => {
  const val = Number(num || 0);
  if (isNaN(val) || val === 0) return 'Zero Dollars Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 1000000000) return convert(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 ? ' ' + convert(n % 1000000) : '');
    return convert(Math.floor(n / 1000000000)) + ' Billion' + (n % 1000000000 ? ' ' + convert(n % 1000000000) : '');
  };

  const absVal = Math.abs(val);
  const [dollarStr, centStr = '00'] = absVal.toFixed(2).split('.');
  const dollars = parseInt(dollarStr, 10);
  const cents = parseInt(centStr.slice(0, 2), 10);

  const parts = [];

  if (dollars > 0) {
    const dollarWord = convert(dollars);
    parts.push(`${dollarWord} ${dollars === 1 ? 'Dollar' : 'Dollars'}`);
  } else if (cents > 0) {
    parts.push('Zero Dollars');
  }

  if (cents > 0) {
    const centWord = convert(cents);
    parts.push(`and ${centWord} ${cents === 1 ? 'Cent' : 'Cents'}`);
  }

  if (parts.length === 0) {
    return 'Zero Dollars Only';
  }

  return parts.join(' ') + ' Only';
};

// ─── Helpers for Clean Date & Time ───────────────────────────────────────────
const formatInvoiceDate = (rawDate) => {
  if (!rawDate || rawDate === '—') return '—';
  const str = String(rawDate).trim();
  const datePart = (str.includes(' ') || str.includes('T')) ? str.split(/[\sT]/)[0] : str.split('.')[0];

  if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(datePart)) {
    return datePart.replace(/-/g, '/');
  }

  const ymdMatch = datePart.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const d = String(parsed.getDate()).padStart(2, '0');
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const y = parsed.getFullYear();
    return `${d}/${m}/${y}`;
  }

  return datePart;
};

const formatInvoiceTime = (rawTime, fallbackDatetime) => {
  let timeStr = '';
  if (rawTime && String(rawTime).trim() !== '' && String(rawTime).trim() !== '—') {
    timeStr = String(rawTime).trim();
  } else if (fallbackDatetime && String(fallbackDatetime).trim() !== '' && String(fallbackDatetime).trim() !== '—') {
    const s = String(fallbackDatetime).trim();
    if (s.includes(' ')) {
      timeStr = s.split(' ')[1] || '';
    } else if (s.includes('T')) {
      timeStr = s.split('T')[1] || '';
    }
  }

  if (!timeStr || timeStr === '—') return '';

  const clean = timeStr.split('.')[0].replace(/[Zz]$/, '').trim();
  if (/am|pm/i.test(clean)) {
    return clean;
  }

  const parts = clean.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].padStart(2, '0');
    const seconds = parts[2] ? parts[2].padStart(2, '0') : '';
    if (!isNaN(hours)) {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedHours = String(hours).padStart(2, '0');
      return seconds
        ? `${formattedHours}:${minutes}:${seconds} ${ampm}`
        : `${formattedHours}:${minutes} ${ampm}`;
    }
  }

  return clean;
};

// ─── The printable invoice layout ────────────────────────────────────────────
export const InvoiceDocument = ({ invoiceData }) => {
  const d = invoiceData || {};

  const currency = d.currency ?? 'FJD';
  const company = d.company ?? 'MH Money Express';
  const txnId = d.name ?? d.transaction_id ?? '—';
  const postingDate = formatInvoiceDate(d.posting_date || d.creation || d.modified);
  const postingTime = formatInvoiceTime(d.posting_time || d.time, d.posting_date || d.creation || d.modified);
  const generatedAt = postingDate !== '—' ? `${postingDate}${postingTime ? ' ' + postingTime : ''}` : (postingTime || '—');

  const customerName =
    d.custom_customer_full_name ||
    d.custom_full_name ||
    d.customer_name ||
    d.full_name ||
    d.customerFullName ||
    '—';
  const customerId = d.customer || d.customer_id || '';
  const contactEmail = d.contact_email || d.email || d.receiver_mailid || '';
  const contactMobile = d.contact_mobile || d.mobile_no || d.phone || d.mobile || '';
  const dob = d.dob || d.custom_date_of_birth || '';

  const txnStatus = invoiceData?.docstatus === 2 ? 'Cancelled' : (d.status || 'Paid');
  const remarks = d.remarks || d.custom_remarks || '';
  const inWords = d.in_words;

  const rows = (d.items ?? []).map(item => ({
    code: item.item_code ?? '—',
    name: item.item_name ?? '—',
    qty: item.qty ?? 0,
    rate: item.rate ?? 0,
    amount: item.amount ?? 0,
    warehouse: item.warehouse ?? '—',
  }));

  const taxes = Array.isArray(d.taxes) ? d.taxes : [];
  const netTotal = d.net_total ?? d.total ?? 0;
  const totalTaxes = d.total_taxes_and_charges ?? 0;
  const discountAmount = d.discount_amount ?? 0;
  const grandTotal = d.grand_total ?? 0;
  const roundedTotal = d.rounded_total ?? grandTotal;
  const outstandingAmount = d.outstanding_amount ?? roundedTotal;

  const isUnpaid = txnStatus?.toLowerCase() === 'unpaid';
  const isCancelled = txnStatus?.toLowerCase() === 'cancelled';

  const exRate =
    d.exchange_rate ??
    d.exchangeRate ??
    (d.conversion_rate && Number(d.conversion_rate) !== 1 ? d.conversion_rate : null) ??
    null;

  const senderCurrency =
    d.you_send_currency_type ||
    d.senderCurrency ||
    d.foreignCurrency ||
    d.foreign_currency ||
    null;

  const receiverCurrency =
    d.they_receive_currency_type ||
    d.receiverCurrency ||
    d.localCurrency ||
    currency ||
    'FJD';

  const exchangeRateText =
    exRate && Number(exRate) > 0
      ? senderCurrency && receiverCurrency && senderCurrency !== receiverCurrency
        ? `1 ${receiverCurrency} = ${fmt(exRate, 4)} ${senderCurrency}`
        : fmt(exRate, 4)
      : null;

  return (
    <div id="invoice-print-area" className="bg-white font-sans text-slate-900 w-full p-6 print:p-4" style={{ fontSize: '12px' }}>

      {/* Print-specific styles to force single-page layout */}
      <style>{`
        @media print {
          @page { size: A4; margin: 8mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #invoice-print-area { font-size: 11px !important; }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={`flex justify-between items-start border-b-2 pb-4 mb-4 ${isCancelled ? 'border-red-200' : 'border-blue-100'}`}>
        {/* Left: Company */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <img
              src={mhlogo}
              alt="MH Logo"
              className="h-10 w-auto object-contain"
            />
            <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
              {company}
            </h1>
          </div>
        </div>

        {/* Right: Invoice meta */}
        <div className="text-right">
          <h2 className={`text-2xl font-black mb-2 uppercase tracking-widest ${isCancelled ? 'text-red-600' : 'text-blue-600'}`}>
            Sales Invoice
          </h2>
          <div className="space-y-1 text-xs">
            <div className="flex justify-end items-baseline gap-2">
              <span className="font-bold text-slate-500">Invoice ID:</span>
              <span className="font-bold text-slate-900 font-mono">{txnId}</span>
            </div>
            <div className="flex justify-end items-baseline gap-2">
              <span className="font-bold text-slate-500">Date:</span>
              <span className="font-medium text-slate-700">{postingDate}</span>
            </div>
            {postingTime ? (
              <div className="flex justify-end items-baseline gap-2">
                <span className="font-bold text-slate-500">Time:</span>
                <span className="font-medium text-slate-700">{postingTime}</span>
              </div>
            ) : null}
            {exchangeRateText && (
              <div className="flex justify-end items-baseline gap-2">
                <span className="font-bold text-slate-500">Exchange Rate:</span>
                <span className="font-semibold text-slate-900 font-mono">{exchangeRateText}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Customer & Status Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Customer info card */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-[10px] font-bold uppercase text-blue-600 mb-2.5 tracking-wider">
              Customer Information
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="grid grid-cols-[85px_1fr] items-baseline gap-2">
                <span className="text-slate-500 font-medium">Name:</span>
                <span className="font-semibold text-slate-900 break-words">{customerName}</span>
              </div>
              {customerId && customerId !== '—' && (
                <div className="grid grid-cols-[85px_1fr] items-baseline gap-2">
                  <span className="text-slate-500 font-medium">Customer ID:</span>
                  <span className="font-semibold text-slate-900 font-mono break-words">{customerId}</span>
                </div>
              )}
              {dob && (
                <div className="grid grid-cols-[85px_1fr] items-baseline gap-2">
                  <span className="text-slate-500 font-medium">Date of Birth:</span>
                  <span className="font-semibold text-slate-900">{formatInvoiceDate(dob)}</span>
                </div>
              )}
              <div className="grid grid-cols-[85px_1fr] items-baseline gap-2 min-w-0">
                <span className="text-slate-500 font-medium shrink-0">Email:</span>
                <span className="font-semibold text-slate-900 break-all [overflow-wrap:anywhere] min-w-0">
                  {contactEmail || '—'}
                </span>
              </div>
              <div className="grid grid-cols-[85px_1fr] items-baseline gap-2">
                <span className="text-slate-500 font-medium">Mobile:</span>
                <span className="font-semibold text-slate-900 break-words">{contactMobile || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status panel & Remarks */}
        <div className="flex flex-col gap-2.5">
          {/* Top Badges Bar */}
          <div className={`flex items-center justify-around p-2.5 rounded-lg border ${isCancelled ? 'bg-red-50/70 border-red-100' : 'bg-blue-50/70 border-blue-100'}`}>
            <div className="text-center px-2">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Currency</p>
              <p className="font-bold text-xs text-slate-900">{currency}</p>
            </div>
            {exchangeRateText && (
              <>
                <div className="h-6 w-px bg-slate-200" />
                <div className="text-center px-2">
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Exchange Rate</p>
                  <p className="font-bold text-xs text-blue-700 font-mono">{exchangeRateText}</p>
                </div>
              </>
            )}
            <div className="h-6 w-px bg-slate-200" />
            <div className="text-center px-2">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Status</p>
              <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${isCancelled ? 'bg-red-100 text-red-600' :
                isUnpaid ? 'bg-yellow-100 text-yellow-600' :
                  'bg-green-100 text-green-700'
                }`}>
                {txnStatus}
              </span>
            </div>
          </div>

          {/* Dedicated Remarks card */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex-1 flex flex-col justify-start min-h-[60px]">
            <p className="text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-wider">
              Remarks
            </p>
            <p className="text-xs text-slate-700 italic break-words [overflow-wrap:anywhere] leading-relaxed">
              {remarks && remarks !== 'No Remarks' ? remarks : <span className="text-slate-400 not-italic">No Remarks</span>}
            </p>
          </div>
        </div>
      </div>

      {/* ── Items Table ────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`text-white text-[10px] uppercase tracking-wider ${isCancelled ? 'bg-red-700' : 'bg-slate-900'}`}>
              <th className="p-2.5 rounded-tl-lg text-left">Currency Code with Denomination</th>
              <th className="p-2.5 text-center w-24">Qty</th>
              <th className="p-2.5 text-right w-36 rounded-tr-lg">Amount ({currency})</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="p-2.5 font-medium text-left">{row.code}</td>
                <td className="p-2.5 text-center font-mono">{row.qty}</td>
                <td className="p-2.5 text-right font-bold font-mono">{fmt(row.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Totals & Taxes ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6 items-start mb-4">
        <div />

        {/* Summary */}
        <div className="bg-slate-50 p-4 rounded-lg space-y-1.5 border border-slate-100">
          <div className="flex justify-between items-baseline text-xs">
            <span className="text-slate-500 font-medium">Net Total:</span>
            <span className="font-semibold text-slate-900 font-mono">{currency} {fmt(netTotal)}</span>
          </div>
          {totalTaxes > 0 && (
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-slate-500 font-medium">Taxes:</span>
              <span className="font-semibold text-slate-900 font-mono">{currency} {fmt(totalTaxes)}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-slate-500 font-medium">Discount:</span>
              <span className="font-semibold text-slate-900 font-mono">-{currency} {fmt(discountAmount)}</span>
            </div>
          )}
          <div className="h-px bg-slate-200 my-1" />
          <div className="flex justify-between items-baseline text-sm font-black text-slate-900">
            <span>Grand Total:</span>
            <span className="font-mono">{currency} {fmt(grandTotal)}</span>
          </div>
          <div className="flex justify-between items-baseline text-xs font-bold text-slate-900 pt-0.5">
            <span>Rounded Total:</span>
            <span className={`font-mono ${isCancelled ? 'text-red-600' : 'text-blue-600'}`}>{currency} {fmt(roundedTotal)}</span>
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className="border-t border-slate-200 pt-3 mt-4">
        <div className="mb-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Amount in Words</p>
          <p className="text-xs font-semibold text-slate-800 break-words leading-relaxed">{inWords || toWords(roundedTotal)}</p>
        </div>
        <div className="flex justify-between items-end text-slate-500">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Generated Date & Time</p>
            <p className="text-[11px] text-slate-600 font-medium">{generatedAt}</p>
          </div>
        </div>
      </div>

      {/* Watermark */}
      <div className="mt-4 text-center">
        <p className="text-[10px] text-slate-300 uppercase tracking-widest">
          This is a computer generated document.
        </p>
      </div>
    </div>
  );
};

export default InvoiceDocument;