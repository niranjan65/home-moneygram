import React from 'react';

// ─── Thermal Receipt Print Component ─────────────────────────────────────────
// Drop this into your existing TransferSuccess.jsx
// Usage: <ThermalReceipt invoiceData={finalData} exchange={exchange} />
// For printing: call window.print() — the @media print rules will handle the rest

export const ThermalReceipt = ({ invoiceData = {}, exchange = {} }) => {
  const fmt = (val, dec = 2) =>
    Number(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    });

  const currency     = invoiceData?.currency ?? 'FJD';
  const company      = invoiceData?.company ?? 'MH MONEY EXPRESS';
  const companyAddr  = invoiceData?.company_address ?? '123 Main Street, Suva, Fiji';
  const companyPhone = invoiceData?.company_phone ?? '+679 000 0000';
  const txnId        = invoiceData?.name ?? '—';
  const rawTime      = (invoiceData?.posting_time ?? '').split('.')[0];
  const txnDate      = invoiceData?.posting_date ?? '—';
  const txnTime      = rawTime || '—';
  const customer     = invoiceData?.customer_name ?? invoiceData?.customer ?? '—';
  const status       = invoiceData?.status ?? 'Paid';

  const rows = (invoiceData?.items ?? []).map(item => ({
    label:  item.item_name ?? item.item_code ?? '—',
    qty:    item.qty    ?? 1,
    rate:   item.rate   ?? 0,
    amount: item.amount ?? 0,
  }));

  const netAmount  = invoiceData?.net_total ?? invoiceData?.total ?? 0;
  const taxAmount  = invoiceData?.total_taxes_and_charges ?? 0;
  const grandTotal = invoiceData?.rounded_total ?? invoiceData?.grand_total ?? exchange?.total ?? 0;

  // Exchange details from items or direct fields
  const youSend    = invoiceData?.you_send ?? 0;
  const sendCcy    = invoiceData?.you_send_currency_type ?? 'AUD';
  const theyGet    = invoiceData?.they_receive ?? 0;
  const getCcy     = invoiceData?.they_receive_currency_type ?? currency;
  const exRate     = invoiceData?.exchange_rate ?? exchange?.rate ?? exchange?.exchangeRate ?? 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

        .receipt-root * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .receipt-root {
          font-family: 'Share Tech Mono', 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.5;
          color: #000;
          background: #fff;
          width: 300px;
          padding: 20px 16px 28px;
          border: 1px dashed #ccc;
        }

        /* Jagged top & bottom edges */
        .receipt-root::before,
        .receipt-root::after {
          content: '';
          display: block;
          height: 10px;
          background: 
            radial-gradient(circle at 6px -2px, transparent 6px, white 6px) 0 0 / 12px 10px repeat-x;
          margin: 0 -16px;
        }
        .receipt-root::before { margin-bottom: 16px; }
        .receipt-root::after  { margin-top: 20px; }

        .r-center  { text-align: center; }
        .r-right   { text-align: right; }
        .r-bold    { font-weight: 700; letter-spacing: 0.04em; }
        .r-divider { 
          border: none; 
          border-top: 1px dashed #555; 
          margin: 10px 0; 
        }
        .r-divider-solid { 
          border: none; 
          border-top: 2px solid #000; 
          margin: 10px 0; 
        }
        .r-row {
          display: flex;
          justify-content: space-between;
          gap: 4px;
        }
        .r-row .label { flex: 1; }
        .r-row .value { white-space: nowrap; }
        .r-heading {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .r-large {
          font-size: 16px;
          font-weight: 700;
        }
        .r-xl {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .r-small {
          font-size: 10px;
          line-height: 1.6;
          color: #333;
        }
        .r-barcode {
          font-family: 'Libre Barcode 39', 'Courier New', monospace;
          font-size: 36px;
          letter-spacing: 4px;
          line-height: 1;
        }
        .r-status {
          display: inline-block;
          border: 1.5px solid #000;
          padding: 1px 8px;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        /* ── Print styles ── */
        @media print {
          body * { visibility: hidden !important; }
          .receipt-root,
          .receipt-root * { visibility: visible !important; }
          .receipt-root {
            position: fixed !important;
            top: 0; left: 50%;
            transform: translateX(-50%);
            border: none;
            width: 80mm;
            padding: 8mm 6mm 16mm;
          }
          .receipt-root::before,
          .receipt-root::after { display: none; }
          @page { size: 80mm auto; margin: 0; }
        }
      `}</style>

      <div className="receipt-root" id="thermal-receipt">

        {/* Store Header */}
        <div className="r-center" style={{ marginBottom: 12 }}>
          <div className="r-bold" style={{ fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {company}
          </div>
          <div className="r-small" style={{ marginTop: 3 }}>{companyAddr}</div>
          <div className="r-small">TEL: {companyPhone}</div>
          <div className="r-small">www.mhmoneyexpress.com</div>
        </div>

        <hr className="r-divider-solid" />

        {/* Receipt Title */}
        <div className="r-center r-bold r-heading" style={{ marginBottom: 8 }}>
          *** REMITTANCE RECEIPT ***
        </div>

        {/* Date / Time / Ref */}
        <div className="r-row"><span className="label">DATE:</span><span className="value">{txnDate}</span></div>
        <div className="r-row"><span className="label">TIME:</span><span className="value">{txnTime}</span></div>
        <div className="r-row">
          <span className="label">SALE REF:</span>
          <span className="value r-bold">{txnId}</span>
        </div>
        <div className="r-row">
          <span className="label">STATUS:</span>
          <span className="value"><span className="r-status">{status}</span></span>
        </div>

        <hr className="r-divider" />

        {/* Customer */}
        <div className="r-row"><span className="label">CUSTOMER:</span><span className="value r-bold">{customer}</span></div>

        <hr className="r-divider" />

        {/* Exchange Details */}
        {youSend > 0 && (
          <>
            <div className="r-heading r-bold" style={{ marginBottom: 6 }}>EXCHANGE DETAILS</div>
            <div className="r-row">
              <span className="label">YOU SEND:</span>
              <span className="value r-bold">{sendCcy} {fmt(youSend, 4)}</span>
            </div>
            <div className="r-row">
              <span className="label">THEY RECEIVE:</span>
              <span className="value r-bold">{getCcy} {fmt(theyGet, 4)}</span>
            </div>
            <hr className="r-divider" />
          </>
        )}

        {/* Always show rate if available */}
        {exRate > 0 && (
          <>
            <div className="r-row r-bold" style={{ marginBottom: 4 }}>
              <span className="label">EXCH. RATE:</span>
              <span className="value">1 {sendCcy} = {fmt(exRate, 4)} {getCcy}</span>
            </div>
            <hr className="r-divider" />
          </>
        )}

        {/* Items */}
        {rows.length > 0 && (
          <>
            <div className="r-heading r-bold" style={{ marginBottom: 6 }}>ITEMS</div>
            {rows.map((row, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div style={{ textTransform: 'uppercase', fontWeight: 700 }}>{row.label}</div>
                <div className="r-row r-small">
                  <span>  {row.qty} x {fmt(row.rate, 4)}</span>
                  <span className="r-bold">{fmt(row.amount, 4)} {currency}</span>
                </div>
              </div>
            ))}
            <hr className="r-divider" />
          </>
        )}

        {/* Totals */}
        <div className="r-row">
          <span className="label">NET AMOUNT:</span>
          <span className="value">{currency} {fmt(netAmount, 4)}</span>
        </div>
        <div className="r-row">
          <span className="label">VAT/TAX:</span>
          <span className="value">{currency} {fmt(taxAmount, 4)}</span>
        </div>

        <hr className="r-divider-solid" />

        <div className="r-row" style={{ alignItems: 'baseline' }}>
          <span className="label r-bold r-heading">TOTAL AMOUNT:</span>
          <span className="value r-xl">{currency} {fmt(grandTotal)}</span>
        </div>

        <hr className="r-divider-solid" />

        {/* Footer */}
        <div className="r-center" style={{ marginTop: 12 }}>
          <div className="r-small">
            I have been offered a choice of currencies and<br />
            have chosen to accept this exchange rate.
          </div>

          <div style={{ margin: '12px 0 4px' }}>
            {'- '.repeat(18).trim()}
          </div>

          <div className="r-barcode">*{txnId}*</div>
          <div className="r-small" style={{ marginTop: 2, letterSpacing: '0.08em' }}>{txnId}</div>

          <div style={{ marginTop: 14 }} className="r-small">
            THANK YOU FOR CHOOSING<br />
            <span className="r-bold">{company}</span><br />
            Customer support: {companyPhone}
          </div>

          <div style={{ marginTop: 10 }} className="r-small">
            *** AUTHORISED SIGNATORY ***<br /><br />
            <span style={{ borderBottom: '1px solid #000', display: 'inline-block', width: 140, marginTop: 4 }}>&nbsp;</span><br />
            Signature
          </div>
        </div>

      </div>
    </>
  );
};

// ─── Updated printInvoice function ────────────────────────────────────────────
// Replace your existing printInvoice with this one:

export const printThermalReceipt = (invoiceData, exchange) => {
  const printWindow = window.open('', '_blank', 'width=400,height=700');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt - ${invoiceData?.name ?? 'Receipt'}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Libre+Barcode+39&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #f0f0f0; display: flex; justify-content: center; padding: 30px; }
          
          .receipt-root {
            font-family: 'Share Tech Mono', 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.5;
            color: #000;
            background: #fff;
            width: 300px;
            padding: 20px 16px 28px;
          }
          .r-center { text-align: center; }
          .r-right { text-align: right; }
          .r-bold { font-weight: 700; letter-spacing: 0.04em; }
          .r-divider { border: none; border-top: 1px dashed #555; margin: 10px 0; }
          .r-divider-solid { border: none; border-top: 2px solid #000; margin: 10px 0; }
          .r-row { display: flex; justify-content: space-between; gap: 4px; }
          .r-row .label { flex: 1; }
          .r-row .value { white-space: nowrap; }
          .r-heading { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; }
          .r-xl { font-size: 20px; font-weight: 700; letter-spacing: 0.05em; }
          .r-small { font-size: 10px; line-height: 1.6; color: #333; }
          .r-barcode { font-family: 'Libre Barcode 39', 'Courier New', monospace; font-size: 36px; letter-spacing: 4px; line-height: 1; }
          .r-status { display: inline-block; border: 1.5px solid #000; padding: 1px 8px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; }

          @media print {
            body { background: white; padding: 0; }
            @page { size: 80mm auto; margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-root" id="receipt">
          <!-- header -->
          <div class="r-center" style="margin-bottom:12px">
            <div class="r-bold" style="font-size:14px;letter-spacing:0.1em;text-transform:uppercase">${invoiceData?.company ?? 'MH MONEY EXPRESS'}</div>
            <div class="r-small" style="margin-top:3px">${invoiceData?.company_address ?? '123 Main Street, Suva, Fiji'}</div>
            <div class="r-small">TEL: ${invoiceData?.company_phone ?? '+679 000 0000'}</div>
          </div>
          <hr class="r-divider-solid" />
          <div class="r-center r-bold r-heading" style="margin-bottom:8px">*** REMITTANCE RECEIPT ***</div>

          <div class="r-row"><span class="label">DATE:</span><span class="value">${invoiceData?.posting_date ?? '—'}</span></div>
          <div class="r-row"><span class="label">TIME:</span><span class="value">${(invoiceData?.posting_time ?? '').split('.')[0] || '—'}</span></div>
          <div class="r-row"><span class="label">SALE REF:</span><span class="value r-bold">${invoiceData?.name ?? '—'}</span></div>
          <div class="r-row"><span class="label">STATUS:</span><span class="value"><span class="r-status">${'Paid'}</span></span></div>

          <hr class="r-divider" />
          <div class="r-row"><span class="label">CUSTOMER:</span><span class="value r-bold">${invoiceData?.customer_name ?? invoiceData?.customer ?? '—'}</span></div>
          <hr class="r-divider" />

          ${invoiceData?.you_send ? `
          <div class="r-heading r-bold" style="margin-bottom:6px">EXCHANGE DETAILS</div>
          <div class="r-row"><span class="label">YOU SEND:</span><span class="value r-bold">${invoiceData?.you_send_currency_type ?? ''} ${Number(invoiceData?.you_send ?? 0).toFixed(4)}</span></div>
          <div class="r-row"><span class="label">THEY RECEIVE:</span><span class="value r-bold">${invoiceData?.they_receive_currency_type ?? ''} ${Number(invoiceData?.they_receive ?? 0).toFixed(4)}</span></div>
          ${invoiceData?.exchange_rate ? `<div class="r-row"><span class="label">EXCHANGE RATE:</span><span class="value">1 ${invoiceData?.you_send_currency_type} = ${Number(invoiceData.exchange_rate).toFixed(4)} ${invoiceData?.they_receive_currency_type}</span></div>` : ''}
          <hr class="r-divider" />
          ` : ''}

          ${(invoiceData?.items ?? []).map(item => `
            <div style="margin-bottom:6px">
              <div style="text-transform:uppercase;font-weight:700">${item.item_name ?? item.item_code ?? '—'}</div>
              <div class="r-row r-small">
                <span>  ${item.qty ?? 1} x ${Number(item.rate ?? 0).toFixed(4)}</span>
                <span class="r-bold">${Number(item.amount ?? 0).toFixed(4)} ${invoiceData?.currency ?? 'FJD'}</span>
              </div>
            </div>
          `).join('')}

          ${(invoiceData?.items ?? []).length ? '<hr class="r-divider" />' : ''}

          <div class="r-row"><span class="label">NET AMOUNT:</span><span class="value">${invoiceData?.currency ?? 'FJD'} ${Number(invoiceData?.net_total ?? invoiceData?.total ?? 0).toFixed(4)}</span></div>
          <div class="r-row"><span class="label">VAT/TAX:</span><span class="value">${invoiceData?.currency ?? 'FJD'} ${Number(invoiceData?.total_taxes_and_charges ?? 0).toFixed(4)}</span></div>

          <hr class="r-divider-solid" />

          <div class="r-row" style="align-items:baseline">
            <span class="label r-bold r-heading">TOTAL AMOUNT:</span>
            <span class="value r-xl">${invoiceData?.currency ?? 'FJD'} ${Number(invoiceData?.rounded_total ?? invoiceData?.grand_total ?? exchange?.total ?? 0).toFixed(2)}</span>
          </div>

          ${(() => {
            const rate = invoiceData?.exchange_rate ?? exchange?.rate ?? exchange?.exchangeRate ?? 0;
            const sc = invoiceData?.you_send_currency_type ?? '';
            const rc = invoiceData?.they_receive_currency_type ?? invoiceData?.currency ?? 'FJD';
            return rate > 0
              ? `<div class="r-row r-bold" style="margin-top:6px"><span class="label">EXCH. RATE:</span><span class="value">1 ${sc} = ${Number(rate).toFixed(4)} ${rc}</span></div>`
              : '';
          })()}

          <hr class="r-divider-solid" />

          <div class="r-center" style="margin-top:12px">
            <div class="r-small">I have been offered a choice of currencies and<br>have chosen to accept this exchange rate.</div>
            <div style="margin:12px 0 4px">${'- '.repeat(18).trim()}</div>
            <div class="r-barcode">*${invoiceData?.name ?? 'RECEIPT'}*</div>
            <div class="r-small" style="margin-top:2px;letter-spacing:0.08em">${invoiceData?.name ?? '—'}</div>
            <div style="margin-top:14px" class="r-small">
              THANK YOU FOR CHOOSING<br>
              <span class="r-bold">${invoiceData?.company ?? 'MH MONEY EXPRESS'}</span><br>
              Customer support: ${invoiceData?.company_phone ?? '+679 000 0000'}
            </div>
            <div style="margin-top:16px" class="r-small">
              *** AUTHORISED SIGNATORY ***<br><br>
              <span style="border-bottom:1px solid #000;display:inline-block;width:140px;margin-top:4px">&nbsp;</span><br>
              Signature
            </div>
          </div>
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export default ThermalReceipt;