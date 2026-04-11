import React, { useRef } from 'react';
import mhlogo from "../assets/MH.png"; 

// ─── Number helpers ───────────────────────────────────────────────────────────
const fmt = (val, decimals = 2) =>
  Number(val).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

// ─── Convert number to words (simple, up to millions) ────────────────────────
const toWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    return convert(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 ? ' ' + convert(n % 1000000) : '');
  };
  const intPart = Math.floor(Math.abs(num));
  return convert(intPart) + ' Dollars Only';
};

// ─── The printable invoice layout ────────────────────────────────────────────
export const InvoiceDocument = ({ invoiceData }) => {
  const d = invoiceData || {};

  const currency = d.currency ?? 'FJD';
  const company = d.company ?? 'MH Money Express';
  const txnId = d.name ?? '—';
  const postingDate = d.posting_date ?? '—';
  const dueDate = d.due_date ?? '—';
  const rawTime = (d.posting_time ?? '').split('.')[0];
  const generatedAt = postingDate + (rawTime ? ' ' + rawTime : '');
  const customerName = d.customer_name ?? d.customer ?? '—';
  const customerId = d.customer ?? '—';
  const contactEmail = d.contact_email ?? '—';
  const contactMobile = d.contact_mobile || '—';
  // const txnStatus = d.status ?? 'Unpaid';
  const txnStatus = 'Paid';
  const remarks = d.remarks ?? 'No Remarks';

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
      <div className="flex justify-between items-start border-b-2 border-blue-100 pb-4 mb-4">
        {/* Left: Company */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {/* <div className="bg-blue-600 p-1.5 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 48 48">
                <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z" />
              </svg>
            </div> */}

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
          {/* <div className="text-xs text-slate-500 leading-relaxed space-y-0.5">
            <p>📍 Main St, Suva, Fiji</p>
            <p>✉️ contact@mhmoney.com</p>
            <p>📞 +679 123 4567</p>
          </div> */}
        </div>

        {/* Right: Invoice meta */}
        <div className="text-right">
          <h2 className="text-2xl font-black text-blue-100 mb-2 uppercase tracking-widest">
            Sales Invoice
          </h2>
          <div className="space-y-0.5 text-xs">
            <p className="text-slate-900">
              <span className="font-bold">Invoice #:</span>
              <span className="font-normal text-slate-600 ml-1">{txnId}</span>
            </p>
            <p className="text-slate-900">
              <span className="font-bold">Posting Date:</span>
              <span className="font-normal text-slate-600 ml-1">{postingDate}</span>
            </p>
            <p className="text-slate-900">
              <span className="font-bold">Due Date:</span>
              <span className="font-normal text-slate-600 ml-1">{dueDate}</span>
            </p>
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
            <span className="text-slate-500">Customer ID:</span>
            <span className="font-semibold text-slate-900">{customerId}</span>
            <span className="text-slate-500">Email:</span>
            <span className="font-semibold text-slate-900">{contactEmail}</span>
            <span className="text-slate-500">Mobile:</span>
            <span className="font-semibold text-slate-900">{contactMobile}</span>
          </div>
        </div>

        {/* Status panel */}
        <div className="flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Currency</p>
              <p className="font-bold text-xs text-slate-900">{currency}</p>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Status</p>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${isUnpaid ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                {txnStatus}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Remarks</p>
              <p className="font-medium text-slate-600 italic text-[10px]">{remarks}</p>
            </div>
          </div>
          <div className="p-2.5 border-l-4 border-blue-600 bg-blue-50 rounded-r-lg">
            <p className="text-[10px] font-semibold text-blue-600 uppercase mb-0.5">Payment Instructions</p>
            <p className="text-[10px] text-slate-600">
              Please include the Invoice # in your transfer description for faster processing.
            </p>
          </div>
        </div>
      </div>

      {/* ── Items Table ────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
              <th className="p-2 rounded-tl-lg">Item Code</th>
              <th className="p-2">Item Name</th>
              <th className="p-2 text-center">Qty</th>
              <th className="p-2 text-right">Rate</th>
              <th className="p-2 text-right">Amount</th>
              <th className="p-2 rounded-tr-lg">Warehouse</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="p-2 font-medium">{row.code}</td>
                <td className="p-2 text-slate-600">{row.name}</td>
                <td className="p-2 text-center">{row.qty}</td>
                <td className="p-2 text-right">{fmt(row.rate)}</td>
                <td className="p-2 text-right font-bold">{fmt(row.amount)}</td>
                <td className="p-2 text-slate-500">{row.warehouse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Totals & Taxes ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6 items-start mb-4">
        {/* Tax table */}
        <div>
          <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-widest">
            Tax Breakdown
          </h4>
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase">
                <th className="pb-1 text-left font-semibold">Type</th>
                <th className="pb-1 text-left font-semibold">Account</th>
                <th className="pb-1 text-right font-semibold">Rate %</th>
                <th className="pb-1 text-right font-semibold">Tax Amt</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {taxes.length > 0 ? taxes.map((tax, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-1">{tax.charge_type ?? 'VAT'}</td>
                  <td className="py-1">{tax.account_head ?? '—'}</td>
                  <td className="py-1 text-right">{tax.rate ?? 0}%</td>
                  <td className="py-1 text-right font-medium">{fmt(tax.tax_amount ?? 0)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-1 text-slate-400 italic">No taxes applied</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="bg-slate-50 p-4 rounded-lg space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Net Total:</span>
            <span className="font-semibold text-slate-900">{fmt(netTotal)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Taxes &amp; Charges:</span>
            <span className="font-semibold text-slate-900">{fmt(totalTaxes)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Discount:</span>
            <span className="font-semibold text-emerald-600">{fmt(discountAmount)}</span>
          </div>
          <div className="h-px bg-slate-200 my-1" />
          <div className="flex justify-between text-sm font-black text-slate-900">
            <span>Grand Total:</span>
            <span>{fmt(grandTotal)}</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-slate-900 pt-0.5">
            <span>Rounded Total:</span>
            <span className="text-blue-600">{currency} {fmt(roundedTotal)}</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-red-600 pt-1 border-t border-red-100">
            <span>Outstanding:</span>
            <span>{fmt(outstandingAmount)}</span>
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className="border-t border-slate-100 pt-4 mt-4">
        <div className="mb-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Total Amount in Words</p>
          <p className="text-xs font-medium text-slate-800">{toWords(Math.round(roundedTotal))}</p>
        </div>
        <div className="flex justify-between items-end">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Generated Date</p>
            <p className="text-[10px] text-slate-600">{generatedAt}</p>
          </div>
          <div className="text-center w-48">
            <div className="border-b border-slate-900 h-10 flex items-end justify-center pb-1 italic text-slate-300 text-[10px]">
              {/* signature space */}
            </div>
            <p className="mt-1 text-[10px] font-bold text-slate-900 uppercase tracking-widest">
              Authorized Signature
            </p>
          </div>
        </div>
      </div>

      {/* Watermark */}
      <div className="mt-4 text-center">
        <p className="text-[10px] text-slate-300 uppercase tracking-widest">
          This is a computer generated document. No physical signature required.
        </p>
      </div>
    </div>
  );
};

export default InvoiceDocument;