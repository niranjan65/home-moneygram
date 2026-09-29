import React from 'react';
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

// ─── Helpers for Clean Date & Time (Stripping Microseconds/Macroseconds) ─────
const formatInvoiceDate = (rawDate) => {
  if (!rawDate || rawDate === '—') return '—';
  const str = String(rawDate).trim();
  if (str.includes(' ') || str.includes('T')) {
    return str.split(/[\sT]/)[0];
  }
  return str.split('.')[0];
};

const formatInvoiceTime = (rawTime, fallbackDatetime) => {
  let timeStr = '';
  if (rawTime && String(rawTime).trim() !== '') {
    timeStr = String(rawTime).trim();
  } else if (fallbackDatetime && String(fallbackDatetime).trim() !== '') {
    const s = String(fallbackDatetime).trim();
    if (s.includes(' ')) {
      timeStr = s.split(' ')[1] || '';
    } else if (s.includes('T')) {
      timeStr = s.split('T')[1] || '';
    }
  }

  if (!timeStr) return '';
  return timeStr.split('.')[0].replace(/[Zz]$/, '').trim();
};

// ─── Printable Money Transfer Invoice / Receipt Layout ───────────────────────
export const MoneyTransferInvoiceDocument = ({ invoiceData }) => {
  const d = invoiceData || {};

  const currency = d.currency ?? 'FJD';
  const company = d.company ?? 'MH MoneyGram';
  const txnId = d.name || d.transaction_id || '—';
  const postingDate = formatInvoiceDate(d.posting_date || d.creation || d.modified);
  const rawTime = formatInvoiceTime(d.posting_time || d.time, d.posting_date || d.creation || d.modified);
  const generatedAt = postingDate !== '—' ? `${postingDate}${rawTime ? ' ' + rawTime : ''}` : (rawTime || '—');

  // Resolve Customer Name correctly from all potential fields
  const customerName =
    d.custom_customer_full_name ||
    d.custom_full_name ||
    d.customer_name ||
    d.full_name ||
    d.customerFullName ||
    d.customer ||
    d.customer_id ||
    '—';

  const customerId = d.customer || d.customer_id || '';
  const dob = d.dob || d.custom_date_of_birth || '';
  const contactEmail = d.contact_email || d.email || '';
  const contactMobile = d.contact_mobile || d.phone || d.mobile || '';

  // Transaction type: Send / Receive
  const transactionType = (d.transfer_type || d.transaction_type || 'Send').toUpperCase();

  const txnStatus = invoiceData?.docstatus === 2 ? 'Cancelled' : 'Paid';
  const remarks = d.remarks ?? 'No Remarks';
  const inWords = d.in_words;

  // Checkbox: enable_currency_denomination
  const isDenominationEnabled = Boolean(
    d.enable_currency_denomination === 1 ||
    d.enable_currency_denomination === '1' ||
    d.enable_currency_denomination === true
  );

  const rows = (d.items ?? []).map((item) => ({
    code: item.item_code ?? '—',
    name: item.item_name ?? '—',
    qty: item.qty ?? 0,
    rate: item.rate ?? 0,
    amount: item.amount ?? 0,
    warehouse: item.warehouse ?? '—',
  }));

  const netTotal = d.net_total ?? d.total ?? d.amount ?? 0;
  const grandTotal = d.grand_total ?? d.amount ?? 0;
  const roundedTotal = d.rounded_total ?? grandTotal;

  const isCancelled = txnStatus?.toLowerCase() === 'cancelled';
  const isUnpaid = txnStatus?.toLowerCase() === 'unpaid';

  return (
    <div id="invoice-print-area" className="bg-white font-sans text-slate-900 w-full p-6 print:p-4" style={{ fontSize: '12px' }}>

      {/* Print-specific styles to force clean layout */}
      <style>{`
        @media print {
          @page { size: A4; margin: 8mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #invoice-print-area { font-size: 11px !important; }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={`flex justify-between items-start border-b-2 pb-4 mb-4 ${isCancelled ? 'border-red-200' : 'border-blue-100'}`}>
        {/* Left: Company & Logo */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div>
              <img
                src={mhlogo}
                alt="MH Logo"
                className="h-10 w-auto object-contain"
              />
            </div>

            <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
              {company}
            </h1>
          </div>
        </div>

        {/* Right: Invoice meta */}
        <div className="text-right">
          <h2 className={`text-2xl font-black mb-2 uppercase tracking-widest ${isCancelled ? 'text-red-100' : 'text-blue-100'}`}>
            Sales Invoice
          </h2>
          <div className="space-y-0.5 text-xs">
            <p className="text-slate-900">
              <span className="font-bold">Invoice ID:</span>
              <span className="font-normal text-slate-600 ml-1">{txnId}</span>
            </p>
            <p className="text-slate-900">
              <span className="font-bold">Date:</span>
              <span className="font-normal text-slate-600 ml-1">{postingDate}</span>
            </p>
            {rawTime ? (
              <p className="text-slate-900">
                <span className="font-bold">Time:</span>
                <span className="font-normal text-slate-600 ml-1">{rawTime}</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Customer & Status Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Customer info */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
          <h3 className="text-[10px] font-bold uppercase text-blue-600 mb-2 tracking-wider">
            Customer Information
          </h3>
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs">
            <span className="text-slate-500">Name:</span>
            <span className="font-semibold text-slate-900">{customerName}</span>

            {customerId && customerId !== '—' && (
              <>
                <span className="text-slate-500">Customer ID:</span>
                <span className="font-semibold text-slate-900">{customerId}</span>
              </>
            )}

            {dob && (
              <>
                <span className="text-slate-500">Date of Birth:</span>
                <span className="font-semibold text-slate-900">{dob}</span>
              </>
            )}

            {contactEmail ? (
              <>
                <span className="text-slate-500">Email:</span>
                <span className="font-semibold text-slate-900">{contactEmail}</span>
              </>
            ) : (
              <>
                <span className="text-slate-500">Email:</span>
                <span className="font-semibold text-slate-900">—</span>
              </>
            )}

            {contactMobile ? (
              <>
                <span className="text-slate-500">Mobile:</span>
                <span className="font-semibold text-slate-900">{contactMobile}</span>
              </>
            ) : (
              <>
                <span className="text-slate-500">Mobile:</span>
                <span className="font-semibold text-slate-900">—</span>
              </>
            )}
          </div>
        </div>

        {/* Status panel */}
        <div className="flex flex-col justify-between gap-2">
          <div className={`flex items-center justify-between p-3 rounded-lg border ${isCancelled ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Transaction Type</p>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase bg-[#E00000]/10 text-[#E00000] border border-[#E00000]/20">
                {transactionType}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Currency</p>
              <p className="font-bold text-xs text-slate-900">{currency}</p>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Status</p>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${isCancelled ? 'bg-red-100 text-red-600' :
                isUnpaid ? 'bg-yellow-100 text-yellow-600' :
                  'bg-green-100 text-green-600'
                }`}>
                {txnStatus}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Remarks</p>
              <p className="font-medium text-slate-600 italic text-[10px]">{remarks}</p>
            </div>
          </div>
          {/* <div className={`p-2.5 border-l-4 rounded-r-lg ${isCancelled ? 'border-red-500 bg-red-50' : 'border-[#E00000] bg-red-50/40'}`}>
            <p className={`text-[10px] font-semibold uppercase mb-0.5 ${isCancelled ? 'text-red-600' : 'text-[#E00000]'}`}>
              {isCancelled ? 'Cancellation Notice' : 'Payment Instructions'}
            </p>
            <p className="text-[10px] text-slate-600">
              Please include the Invoice # in your transfer description for faster processing.
            </p>
          </div> */}
        </div>
      </div>

      {/* ── Denomination Table: ONLY rendered if enable_currency_denomination is checked and has rows ── */}
      {isDenominationEnabled && rows.length > 0 && (
        <div className="mb-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-white text-[10px] uppercase tracking-wider ${isCancelled ? 'bg-red-700' : 'bg-slate-900'}`}>
                <th className="p-2 rounded-tl-lg">Currency Code with Denomination</th>
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-right">Rate ({currency})</th>
                <th className="p-2 text-right rounded-tr-lg">Amount ({currency})</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-2 font-medium">{row.code}</td>
                  <td className="p-2 text-center">{row.qty}</td>
                  <td className="p-2 text-right">{fmt(row.rate)}</td>
                  <td className="p-2 text-right font-bold">{fmt(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Totals ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6 items-start mb-4">
        <div />
        {/* Summary */}
        <div className="bg-slate-50 p-4 rounded-lg space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Net Total:</span>
            <span className="font-semibold text-slate-900">{currency} {fmt(netTotal)}</span>
          </div>
          <div className="h-px bg-slate-200 my-1" />
          <div className="flex justify-between text-sm font-black text-slate-900">
            <span>Grand Total:</span>
            <span>{currency} {fmt(grandTotal)}</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-slate-900 pt-0.5">
            <span>Rounded Total:</span>
            <span className={isCancelled ? 'text-red-600' : 'text-blue-600'}>{currency} {fmt(roundedTotal)}</span>
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className="border-t border-slate-100 pt-4 mt-4">
        <div className="mb-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Total Amount in Words</p>
          <p className="text-xs font-medium text-slate-800">{inWords || toWords(roundedTotal)}</p>
        </div>
        <div className="flex justify-between items-end">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Generated Date</p>
            <p className="text-[10px] text-slate-600">{generatedAt}</p>
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

export default MoneyTransferInvoiceDocument;
