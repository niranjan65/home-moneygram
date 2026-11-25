import React, { useState, useEffect } from 'react';
import { sessionAxios as axios } from '../../api/sessionClient';
import { useSelector } from 'react-redux';
import { useExchange } from '../../context/ExchangeContext';
import { useUser } from '../../context/UserContext';
import { InvoiceDocument } from './SalesInvoice';
import { printThermalReceipt } from './ThermalReceiptPrint';

// ─── Modal Styles ─────────────────────────────────────────────────────────────
const modalOverlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.45)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '16px',
};

const modalDialog = {
  background: 'var(--color-surface, #fff)',
  border: '1px solid var(--color-line, #E3E6EB)',
  borderRadius: '16px',
  boxShadow: 'var(--shadow-sheet, 0 20px 40px rgba(0,0,0,0.15))',
  width: '100%',
  maxWidth: '440px',
  padding: '24px',
};

export const TransferSuccessNew = ({
  data = {},
  apiDoc,
  transactionId,
  onDashboard,
  onDownloadReceipt,
  isDealer: propIsDealer,
  isExchange: propIsExchange,
  type,
}) => {
  const exchange = useExchange();
  const loginUser = useUser();
  const reduxIsDealer = useSelector((state) => state.exchange?.isDealer);
  const isDealer = propIsDealer !== undefined ? propIsDealer : reduxIsDealer;

  const isExchange = propIsExchange !== undefined
    ? Boolean(propIsExchange)
    : type === 'exchange'
      ? true
      : type === 'transfer'
        ? false
        : Boolean(data?.exchangeType || apiDoc?.exchange_type);

  const [invoiceData, setInvoiceData] = useState(() => {
    const saved = sessionStorage.getItem('exchangeInvoiceData');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoading, setIsLoading] = useState(() => {
    const saved = sessionStorage.getItem('exchangeInvoiceData');
    if (saved) return false;
    return Boolean(apiDoc?.invoice || apiDoc?.sales_invoice_number || apiDoc?.purchase_invoice_number);
  });

  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelled, setIsCancelled] = useState(() => {
    const saved = sessionStorage.getItem('exchangeInvoiceData');
    const savedDoc = saved ? JSON.parse(saved) : null;
    const finalDataTemp = savedDoc ?? apiDoc ?? data;
    return finalDataTemp?.docstatus === 2;
  });

  const [txnStatus, setTxnStatus] = useState(() => {
    const saved = sessionStorage.getItem('exchangeInvoiceData');
    const savedDoc = saved ? JSON.parse(saved) : null;
    const finalDataTemp = savedDoc ?? apiDoc ?? data;
    return finalDataTemp?.docstatus === 2 ? 'Cancelled' : 'Paid';
  });

  const [modalVariant, setModalVariant] = useState(null); // null | 'confirm' | 'success' | 'error'
  const [modalError, setModalError] = useState('');

  // Fetch invoice details on mount if available
  useEffect(() => {
    const invoiceId = apiDoc?.invoice || apiDoc?.sales_invoice_number || apiDoc?.purchase_invoice_number;
    if (!invoiceId) {
      setIsLoading(false);
      return;
    }

    const fetchInvoice = async () => {
      try {
        const isPurchase = String(invoiceId).includes('PINV') || Boolean(apiDoc?.purchase_invoice_number);
        const doctype = isPurchase ? 'Purchase Invoice' : 'Sales Invoice';
        const response = await axios.get(`/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(invoiceId)}`);
        if (response.data?.data) {
          setInvoiceData(response.data.data);
        }
      } catch (err) {
        try {
          const fallbackDoctype = String(invoiceId).includes('PINV') ? 'Sales Invoice' : 'Purchase Invoice';
          const pResponse = await axios.get(`/api/resource/${encodeURIComponent(fallbackDoctype)}/${encodeURIComponent(invoiceId)}`);
          if (pResponse.data?.data) {
            setInvoiceData(pResponse.data.data);
          }
        } catch (err2) {
          console.error('Error fetching invoice details:', err2);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [apiDoc]);

  useEffect(() => {
    if (invoiceData) {
      sessionStorage.setItem('exchangeInvoiceData', JSON.stringify(invoiceData));
    }
  }, [invoiceData]);

  // Combined Data Mapping
  const finalData = {
    ...(data || {}),
    ...(apiDoc || {}),
    ...(invoiceData || {}),
    customer_name: data?.selectedCustomer?.custom_full_name || (data?.firstName + data?.lastName) || ""
  };
  console.info('cusotmer full name: ', data)

  const exchangeType = (
    finalData?.exchangeType ||
    data?.exchangeType ||
    apiDoc?.exchange_type ||
    'BUY'
  ).toUpperCase();
  const isBuy = exchangeType === 'BUY';
  const partyLabel = isDealer ? 'Dealer' : 'Customer';

  // Currency resolution
  const foreignCurrency =
    finalData?.you_send_currency_type ||
    finalData?.foreignCurrency ||
    finalData?.foreign_currency_type ||
    data?.foreignCurrency ||
    data?.senderCurrency ||
    'AUD';

  const localCurrency =
    finalData?.they_receive_currency_type ||
    finalData?.localCurrency ||
    finalData?.local_currency_type ||
    data?.localCurrency ||
    data?.receiverCurrency ||
    'FJD';

  const senderCurrency = foreignCurrency;
  const receiverCurrency = localCurrency;

  // Amount & Rate Formatting (Amounts rounded to 2 digits, Rates to 4 digits)
  const fmt = (val, decimals = 2) => {
    if (val === null || val === undefined || isNaN(Number(val))) return '0.00';
    return Number(val).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const fmtRate = (val) => {
    if (val === null || val === undefined || isNaN(Number(val))) return '0.0000';
    return Number(val).toFixed(4);
  };

  // Rates
  const exchangeRate = Number(finalData?.exchange_rate ?? data?.exchangeRate ?? 0);
  const rateInFjd = exchangeRate > 0 ? (1 / exchangeRate) : 0;
  const rateInForeign = exchangeRate > 0 ? exchangeRate : 0;

  // Amounts
  const netAmount = finalData?.net_total ?? finalData?.total ?? data?.sendAmount ?? 0;
  const grandTotal = finalData?.grand_total ?? exchange?.total ?? data?.receiverGets ?? 0;
  const roundedTotal = finalData?.rounded_total ?? grandTotal;
  const roundingVal = finalData?.rounding_adjustment !== undefined && finalData?.rounding_adjustment !== null
    ? Number(finalData.rounding_adjustment)
    : (Number(roundedTotal) - Number(netAmount));

  // Date and Time
  const rawDate = finalData?.posting_date || new Date().toISOString().slice(0, 10);
  const rawTime = (finalData?.posting_time || new Date().toTimeString().slice(0, 8)).split('.')[0];
  const txnDate = `${rawDate} ${rawTime}`;

  // IDs and Names
  const txnId =
    invoiceData?.name ||
    apiDoc?.sales_invoice_number ||
    apiDoc?.purchase_invoice_number ||
    apiDoc?.invoice ||
    apiDoc?.name ||
    transactionId ||
    '—';

  const customerId = (
    data?.customer_id ||
    data?.custom_customer_id ||
    apiDoc?.customer_id ||
    finalData?.custom_customer_id ||
    finalData?.customer_id ||
    finalData?.customer ||
    finalData?.supplier ||
    ''
  ).trim();

  const nameCandidates = [
    data?.custom_full_name,
    data?.full_name,
    data?.fullName,
    data?.idName,
    [data?.firstName, data?.lastName].filter(Boolean).join(' '),
    data?.custom_customer_full_name,
    data?.customer_full_name,
    apiDoc?.custom_customer_full_name,
    apiDoc?.customer_full_name,
    apiDoc?.full_name,
    apiDoc?.fullName,
    [apiDoc?.first_name, apiDoc?.last_name].filter(Boolean).join(' '),
    finalData?.custom_customer_full_name,
    finalData?.customer_full_name,
    finalData?.custom_full_name,
    finalData?.full_name,
    finalData?.fullName,
    finalData?.idName,
    [finalData?.firstName, finalData?.lastName].filter(Boolean).join(' '),
    finalData?.customer_name,
    finalData?.supplier_name,
  ];

  const recipientName = nameCandidates
    .map(name => (typeof name === 'string' ? name.trim() : ''))
    .find(name => name && (!customerId || name.toLowerCase() !== customerId.toLowerCase()))
    || (data?.full_name || data?.idName || 'Customer');

  const tellerName =
    finalData?.owner_name ||
    finalData?.teller ||
    loginUser?.fullName ||
    loginUser?.first_name ||
    (finalData?.owner && !finalData.owner.includes('@') ? finalData.owner : null) ||
    (finalData?.owner?.includes('@') ? finalData.owner.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : null) ||
    'Dev Team';

  // Rows for Denomination & Items Table
  let rows = [];
  if (Array.isArray(finalData?.items) && finalData.items.length > 0) {
    rows = finalData.items.map(item => ({
      label: item.item_name || item.item_code || '—',
      qty: item.qty ?? 1,
      amount: item.amount ?? (item.qty * (item.rate || 0)),
    }));
  } else if (Array.isArray(finalData?.denomination) && finalData.denomination.length > 0) {
    rows = finalData.denomination.map(item => ({
      label: item.denomination || '—',
      qty: item.qty ?? item.count ?? 1,
      amount: item.amount ?? item.subtotal ?? 0,
    }));
  } else {
    const denomSource = isBuy
      ? (data?.senderDenominationRows || data?.receiverDenominationRows || [])
      : (data?.receiverDenominationRows || data?.senderDenominationRows || []);

    rows = denomSource
      .filter(item => (item.count || item.qty) > 0)
      .map(item => {
        const val = item.denomination_value || item.denomination || '';
        const typeStr = item.denomination_type ? `${item.denomination_type.toLowerCase()}s` : 'notes';
        return {
          label: `${foreignCurrency} $${val} ${typeStr}`,
          qty: item.count ?? item.qty ?? 1,
          amount: item.subtotal ?? item.amount ?? ((item.count || 1) * Number(val)),
        };
      });
  }

  if (rows.length === 0) {
    rows = [
      {
        label: `${foreignCurrency} Exchange`,
        qty: 1,
        amount: netAmount,
      },
    ];
  }

  // Handover card calculation
  const foreignSendAmount = Number(data?.sendAmount || finalData?.send_amount || 0);
  const handoverAmount = isBuy
    ? `FJD ${fmt(roundedTotal, 2)}`
    : `${foreignCurrency} ${fmt(foreignSendAmount > 0 ? foreignSendAmount : (data?.receiverGets || 0), 2)}`;

  const cleanDenomText = (qty, val, ccy) => {
    let str = String(val ?? '').trim();
    // Strip words like 'note', 'notes', 'coin', 'coins' (case-insensitive)
    str = str.replace(/\b(notes?|coins?)\b/gi, '').trim();
    if (str.includes(ccy)) {
      str = str.replace(/\s+/g, ' ');
    } else if (str.startsWith('$')) {
      str = `${ccy} ${str}`;
    } else {
      str = `${ccy} $${str}`;
    }
    return `${qty} × ${str}`.replace(/\s+/g, ' ').trim();
  };

  let handoverLines = [];
  if (isBuy) {
    const fjdRows = (data?.receiverDenominationRows || []).filter(r => (r.count || r.qty) > 0);
    if (fjdRows.length > 0) {
      handoverLines = fjdRows.map(r => {
        const qty = r.count || r.qty || 1;
        const val = r.denomination_value || r.denomination || '';
        return cleanDenomText(qty, val, 'FJD');
      });
    } else {
      handoverLines = ['Cash payout in FJD'];
    }
  } else {
    const forexRows = (data?.receiverDenominationRows || data?.senderDenominationRows || []).filter(r => (r.count || r.qty) > 0);
    if (forexRows.length > 0) {
      handoverLines = forexRows.map(r => {
        const qty = r.count || r.qty || 1;
        const val = r.denomination_value || r.denomination || '';
        return cleanDenomText(qty, val, foreignCurrency);
      });
    } else {
      const fallbackVal = foreignSendAmount > 0 ? foreignSendAmount : (data?.receiverGets || '');
      handoverLines = [cleanDenomText(1, fallbackVal, foreignCurrency)];
    }
  }

  // Print Invoice Handler
  const printInvoice = (inv) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Please allow popups to print the receipt.');
      return;
    }
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
        } catch {
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
          <title>Invoice - ${inv?.name ?? 'Receipt'}</title>
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
            window.onload = () => { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const downloadPDF = (inv) => {
    printInvoice(inv);
  };

  // Cancellation Handlers
  const handleCancelClick = () => {
    const docName = apiDoc?.currency_exchange || apiDoc?.exchange_name || apiDoc?.name || data?.exchangeDocName || data?.name;
    if (!docName) {
      setModalError('Cannot find the transaction document name.');
      setModalVariant('error');
      return;
    }
    setModalVariant('confirm');
  };

  const executeCancellation = async () => {
    const docName = apiDoc?.currency_exchange || apiDoc?.exchange_name || apiDoc?.name || data?.exchangeDocName || data?.name;
    if (!docName) {
      setModalError('Cannot find the transaction document name.');
      setModalVariant('error');
      return;
    }
    setIsCancelling(true);
    try {
      if (isDealer) {
        const resolvedDocType = apiDoc?.doctype || "Currency Exchange For Dealer";
        await axios.put(
          `/api/resource/${encodeURIComponent(resolvedDocType)}/${encodeURIComponent(docName)}`,
          { docstatus: 2 },
          { headers: { "Content-Type": "application/json" } }
        );
      } else {
        await axios.post(
          "/api/method/moneygram.moneygram.doctype.currency_exchange_for_customer.currency_exchange_for_customer.cancel_currency_exchange",
          { docname: docName },
          { headers: { "Content-Type": "application/json" } }
        );
      }
      setInvoiceData(prev => ({ ...prev, docstatus: 2 }));
      setIsCancelled(true);
      setTxnStatus("Cancelled");
      setModalVariant('success');
    } catch (error) {
      console.error("Error cancelling transaction:", error);
      let raw =
        error.response?.data?.message ||
        error.response?.data?._server_messages ||
        error.message ||
        "Failed to cancel the transaction.";
      if (typeof raw === 'string' && (raw.startsWith('["{') || raw.startsWith('{"'))) {
        try {
          const parsed = JSON.parse(raw.startsWith('["{') ? JSON.parse(raw)[0] : raw);
          raw = parsed.message || raw;
        } catch (_) {}
      }
      setModalError(typeof raw === 'string' ? raw : JSON.stringify(raw));
      setModalVariant('error');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <style>{`
        .ts-new-root {
          width: 100%;
          font-family: var(--font-sans, Inter, system-ui, -apple-system, sans-serif);
          color: var(--color-ink, #14171F);
        }
        .ts-new-root * {
          box-sizing: border-box;
        }
        .ts-new-root .card {
          background: var(--color-surface, #fff);
          border: 1px solid var(--color-line, #E3E6EB);
          border-radius: var(--radius-card, 16px);
        }
        .ts-new-root .cap {
          font-size: 13px;
          color: var(--color-muted, #5B6270);
          display: block;
          margin-bottom: 4px;
        }
        .ts-new-root .v {
          font-size: 15px;
          font-weight: 600;
          color: var(--color-ink, #14171F);
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        .ts-new-root .th {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-muted, #5B6270);
          padding: 12px 20px;
          background: var(--color-surface-alt, #FAFAFB);
          border-bottom: 1px solid var(--color-line, #E3E6EB);
        }
        .ts-new-root .td {
          padding: 16px 20px;
          font-size: 15px;
          color: var(--color-ink, #14171F);
          font-variant-numeric: tabular-nums;
        }
        .ts-new-root .row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 8px 0;
          font-size: 15px;
        }
        .ts-new-root .row span:first-child {
          color: var(--color-muted, #4A5160);
        }
        .ts-new-root .chip {
          display: inline-flex;
          align-items: center;
          height: 32px;
          padding: 0 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          background: var(--color-chip, #EEF0F3);
          color: var(--color-ink-soft, #2C323D);
        }
        .ts-new-root .chip.ok {
          background: var(--color-success-bg, #E3F3EA);
          color: var(--color-success-fg, #0B5A33);
          border: 1px solid var(--color-success-border, transparent);
        }
        .ts-new-root .chip.warn {
          background: var(--color-warning-bg, #FFF3D6);
          color: var(--color-warning-fg, #7A4B00);
          border: 1px solid var(--color-warning-border, transparent);
        }
        .ts-new-root .chip.danger {
          background: var(--color-danger-bg, #FDF1F3);
          color: var(--color-danger-fg, #9E0C24);
          border: 1px solid var(--color-danger-border, transparent);
        }
        .ts-new-root .btn {
          height: 48px;
          padding: 0 24px;
          border-radius: var(--radius-btn, 12px);
          border: 0;
          background: var(--color-brand-600, #C8102E);
          color: #fff;
          font: 600 15px var(--font-sans, Inter, system-ui, sans-serif);
          cursor: pointer;
          transition: opacity .15s, background .15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .ts-new-root .btn:hover {
          background: var(--color-brand-700, #9E0C24);
          opacity: 0.95;
        }
        .ts-new-root .btn.ghost {
          background: var(--color-surface, #fff);
          color: var(--color-ink, #14171F);
          border: 1px solid var(--color-line-strong, #BFC5CE);
        }
        .ts-new-root .btn.ghost:hover {
          background: var(--color-surface-alt, #F4F5F7);
        }
        .ts-new-root .lnk {
          border: 0;
          background: none;
          font: 600 14px var(--font-sans, Inter, system-ui, sans-serif);
          color: var(--color-danger-fg, #C8102E);
          padding: 8px;
          cursor: pointer;
        }
        .ts-new-root .lnk:hover {
          text-decoration: underline;
        }
        .ts-new-root .help {
          font-size: 13px;
          color: var(--color-muted, #5B6270);
          margin-top: 6px;
        }
        @media (max-width: 960px) {
          .ts-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* ── Cancel Modal ── */}
      {modalVariant && (
        <div style={modalOverlay}>
          <div style={modalDialog} role="dialog" aria-modal="true">
            {modalVariant === 'confirm' && (
              <>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: 'var(--color-ink, #14171F)' }}>
                  Cancel this exchange?
                </h3>
                <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--color-muted, #5B6270)', lineHeight: 1.5 }}>
                  This will cancel the transaction document and reverse the currency exchange in the system. This action cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn ghost"
                    style={{ height: '40px', padding: '0 16px', fontSize: '14px' }}
                    onClick={() => setModalVariant(null)}
                    disabled={isCancelling}
                  >
                    Keep exchange
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{ height: '40px', padding: '0 16px', fontSize: '14px' }}
                    onClick={executeCancellation}
                    disabled={isCancelling}
                  >
                    {isCancelling ? 'Cancelling…' : 'Yes, cancel'}
                  </button>
                </div>
              </>
            )}

            {modalVariant === 'success' && (
              <>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--color-success-bg, #E3F3EA)', color: 'var(--color-success-fg, #0B5A33)', border: '1px solid var(--color-success-border, transparent)', display: 'grid', placeItems: 'center', margin: '0 0 12px 0' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: 'var(--color-ink, #14171F)' }}>
                  Exchange cancelled
                </h3>
                <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--color-muted, #5B6270)' }}>
                  The exchange has been cancelled successfully.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn"
                    style={{ height: '40px', padding: '0 20px', fontSize: '14px' }}
                    onClick={() => setModalVariant(null)}
                  >
                    Done
                  </button>
                </div>
              </>
            )}

            {modalVariant === 'error' && (
              <>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: 'var(--color-danger, #C8102E)' }}>
                  Cancellation failed
                </h3>
                <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--color-muted, #5B6270)' }}>
                  {modalError || 'An error occurred while cancelling the transaction.'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn ghost"
                    style={{ height: '40px', padding: '0 16px', fontSize: '14px' }}
                    onClick={() => setModalVariant(null)}
                  >
                    Dismiss
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Main Success View ── */}
      <div className="ts-new-root flex flex-col gap-6">

        {/* ── Top Status Banner ── */}
        <div
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            padding: '24px 28px',
            background: isCancelled ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
            borderColor: isCancelled ? 'var(--color-danger-border)' : 'var(--color-success-border)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: isCancelled ? 'var(--color-danger)' : 'var(--color-success)',
              display: 'grid',
              placeItems: 'center',
              flex: 'none',
            }}
          >
            {isCancelled ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '28px', lineHeight: '36px', fontWeight: 700, color: 'var(--color-ink)' }}>
              {isCancelled ? 'Exchange cancelled' : 'Exchange complete'}
            </h1>
            <div style={{ fontSize: '14px', color: 'var(--color-ink-soft)', marginTop: '2px' }}>
              {isBuy ? 'Buy forex' : 'Sell forex'} · {foreignCurrency} · recorded at {txnDate}
            </div>
          </div>

          <span
            className={`chip ${isCancelled ? 'danger' : 'ok'}`}
            style={{
              height: '36px',
              fontSize: '14px',
            }}
          >
            {isCancelled ? 'Cancelled' : 'Paid in cash'}
          </span>
        </div>

        {/* ── 2-Column Content Layout ── */}
        <div
          className="ts-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 360px',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Left Column Card */}
          <div className="card" style={{ overflow: 'hidden' }}>
            {/* Meta Grid */}
            <div
              style={{
                padding: '24px 28px',
                display: 'grid',
                gridTemplateColumns: '1.5fr 1.2fr 1fr 1fr',
                gap: '20px',
                borderBottom: '1px solid var(--color-line)',
              }}
            >
              <div>
                <span className="cap">Transaction ID</span>
                <span className="v">{txnId}</span>
              </div>
              <div>
                <span className="cap">Date and time</span>
                <span className="v">{txnDate}</span>
              </div>
              <div>
                <span className="cap">{isDealer ? 'Dealer Name' : 'Customer Name'}</span>
                <span className="v">{recipientName}</span>
              </div>
              <div>
                <span className="cap">Teller</span>
                <span className="v">{tellerName}</span>
              </div>
            </div>

            {/* Denomination Items Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 140px' }}>
              <div className="th">Currency and denomination</div>
              <div className="th" style={{ textAlign: 'right' }}>Qty</div>
              <div className="th" style={{ textAlign: 'right' }}>Amount ({localCurrency})</div>

              {rows.map((row, idx) => (
                <React.Fragment key={idx}>
                  <div
                    className="td"
                    style={{
                      fontWeight: 600,
                      borderBottom: idx < rows.length - 1 ? '1px solid var(--color-line-subtle)' : 'none',
                    }}
                  >
                    {row.label}
                  </div>
                  <div
                    className="td"
                    style={{
                      textAlign: 'right',
                      borderBottom: idx < rows.length - 1 ? '1px solid var(--color-line-subtle)' : 'none',
                    }}
                  >
                    {row.qty}
                  </div>
                  <div
                    className="td"
                    style={{
                      textAlign: 'right',
                      fontWeight: 600,
                      borderBottom: idx < rows.length - 1 ? '1px solid var(--color-line-subtle)' : 'none',
                    }}
                  >
                    {localCurrency} {fmt(row.amount, 2)}
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* Breakdown Footer */}
            <div
              style={{
                padding: '20px 28px',
                borderTop: '1px solid var(--color-line)',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '24px',
                alignItems: 'flex-end',
                flexWrap: 'wrap',
              }}
            >
              {/* Rate Used */}
              <div style={{ fontSize: '13px', color: 'var(--color-muted)', lineHeight: '20px' }}>
                <strong style={{ color: 'var(--color-ink)', fontSize: '14px' }}>Rate used</strong>
                <br />
                {exchangeRate > 0 ? (
                  <span>1 FJD = {foreignCurrency} {fmtRate(exchangeRate)}</span>
                ) : (
                  <span>—</span>
                )}
              </div>

              {/* Amounts Summary */}
              <div style={{ width: '300px', minWidth: '240px' }}>
                <div className="row">
                  <span>Net amount</span>
                  <strong className="v">{localCurrency} {fmt(netAmount, 2)}</strong>
                </div>
                <div className="row">
                  <span>Rounding</span>
                  <strong className="v">
                    {roundingVal >= 0 ? '+' : '-'}{localCurrency} {fmt(Math.abs(roundingVal), 2)}
                  </strong>
                </div>
                <div style={{ borderTop: '1px solid var(--color-line)', margin: '8px 0 0 0', paddingTop: '12px' }}>
                  <span className="cap">
                    {isBuy
                      ? `${partyLabel} received`
                      : `${partyLabel} paid`}
                  </span>
                  <div
                    style={{
                      fontSize: '36px',
                      lineHeight: '40px',
                      fontWeight: 700,
                      color: 'var(--color-brand-600)',
                      whiteSpace: 'nowrap',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    FJD {fmt(roundedTotal, 2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Aside */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Hand Over Card */}
            <div className="card" style={{ padding: '24px' }}>
              <span className="cap" style={{ fontWeight: 600 }}>
                Hand over to {partyLabel.toLowerCase()}
              </span>
              <div
                style={{
                  fontSize: '36px',
                  lineHeight: '40px',
                  fontWeight: 700,
                  color: 'var(--color-ink)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {handoverAmount}
              </div>
              <div className="help" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                {handoverLines.map((line, idx) => (
                  <div key={idx} style={{ lineHeight: '1.4' }}>{line}</div>
                ))}
              </div>
            </div>

            {/* Receipt Card */}
            <div className="card" style={{ padding: '24px' }}>
              <span className="cap" style={{ fontWeight: 600, marginBottom: '12px' }}>
                Receipt
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => printInvoice(finalData)}
                  style={{
                    height: '84px',
                    padding: '0 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '14px',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 9V3h12v6M6 18H4a1 1 0 01-1-1v-6a2 2 0 012-2h14a2 2 0 012 2v6a1 1 0 01-1 1h-2M7 14h10v7H7z" />
                  </svg>
                  Print
                </button>

                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => downloadPDF(finalData)}
                  style={{
                    height: '84px',
                    padding: '0 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '14px',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5M9 13h6M9 17h6" />
                  </svg>
                  Save PDF
                </button>

                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => printThermalReceipt({ ...finalData, exchange_rate: exchangeRate, you_send_currency_type: senderCurrency }, exchange)}
                  style={{
                    height: '84px',
                    padding: '0 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '14px',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" />
                  </svg>
                  Thermal print
                </button>
              </div>

              <button
                type="button"
                className="btn"
                onClick={onDashboard}
                style={{
                  width: '100%',
                  height: '52px',
                  fontSize: '16px',
                  marginTop: '16px',
                }}
              >
                New exchange
              </button>
            </div>

            {/* Cancel Action */}
            <div style={{ textAlign: 'center', fontSize: '14px' }}>
              {!isCancelled ? (
                <button
                  type="button"
                  className="lnk"
                  onClick={handleCancelClick}
                  disabled={isCancelling}
                  style={{ color: 'var(--color-danger-fg)' }}
                >
                  Cancel this exchange
                </button>
              ) : (
                <span style={{ color: 'var(--color-muted)' }}>This exchange has been cancelled</span>
              )}
            </div>
          </aside>
        </div>

        {/* ── Help Footer ── */}
        <div className="help" style={{ textAlign: 'center', marginTop: '24px' }}>
          Need help with this exchange?{' '}
          <a href="#" style={{ color: 'var(--color-brand-600)', fontWeight: 600 }}>
            Contact support
          </a>
        </div>
      </div>

      {/* ── Hidden Invoice DOM for A4 print and PDF ── */}
      <div className="hidden" style={{ display: 'none' }}>
        <div id="invoice-print-area">
          <InvoiceDocument
            invoiceData={{
              ...finalData,
              exchange_rate: exchangeRate,
              you_send_currency_type: senderCurrency,
              they_receive_currency_type: receiverCurrency,
              docstatus: isCancelled ? 2 : 1,
            }}
          />
        </div>
      </div>
    </>
  );
};

export default TransferSuccessNew;
