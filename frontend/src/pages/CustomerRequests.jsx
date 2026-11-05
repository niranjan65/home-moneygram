import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { sessionFetch as fetch } from '../api/sessionClient';

const call = async (method, payload = {}) => {
  const response = await fetch(`/api/method/moneygram.moneygram.api.customer_requests.${method}`, {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok || result.exc) throw new Error(result.message || 'Unable to process customer request.');
  return result.message;
};

export default function CustomerRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const navigate = useNavigate();
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setRequests(await call('list_requests')); } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const approve = async row => {
    setBusy(row.name); try { await call('approve_request', { request_kind: row.kind, request_name: row.name }); await load(); } catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  const create = async row => {
    setBusy(row.name); try {
      const prefill = await call('get_transaction_prefill', { request_kind: row.kind, request_name: row.name });
      if (prefill.target === 'exchange') {
        sessionStorage.setItem('exchangeReceiverInfo', JSON.stringify({ ...prefill.data, customer_id: prefill.data.customer_id, idName: prefill.data.full_name, phone_number: prefill.data.phone_number, government_id: prefill.data.government_id, idNumber: prefill.data.passport_number, request_reference: prefill.request_name }));
        sessionStorage.setItem('exchangeSummary', JSON.stringify({ sendAmount: prefill.data.sendAmount, currency: prefill.data.foreignCurrency, exchangeRate: prefill.data.exchangeRate, receiverGets: prefill.data.receiverGets, exchangeType: prefill.data.exchangeType }));
      } else sessionStorage.setItem('customerMoneyTransferRequestPrefill', JSON.stringify(prefill));
      navigate(prefill.target === 'exchange' ? '/exchange' : '/money-transfer');
    } catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  return <div className="min-h-screen bg-gray-50"><Navbar /><main className="max-w-7xl mx-auto px-4 sm:px-8 py-8"><div className="flex justify-between gap-4 mb-6"><div><h1 className="text-2xl font-bold text-gray-900">Customer Requests</h1><p className="text-sm text-gray-500 mt-1">Forex and Money Transfer requests submitted from the customer portal.</p></div><button onClick={load} className="rounded-lg border px-4 py-2 text-sm font-semibold">Refresh</button></div>{error && <div className="mb-4 rounded-lg bg-red-50 text-red-700 p-3 text-sm">{error}</div>}<div className="overflow-x-auto rounded-xl border bg-white"><table className="min-w-full text-sm"><thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="p-3">Request</th><th className="p-3">Customer / Portal user</th><th className="p-3">Details</th><th className="p-3">Branch</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{loading ? <tr><td className="p-6 text-center text-gray-500" colSpan="6">Loading requests…</td></tr> : requests.length === 0 ? <tr><td className="p-6 text-center text-gray-500" colSpan="6">No customer requests found.</td></tr> : requests.map(row => <tr key={`${row.kind}-${row.name}`} className="border-t"><td className="p-3"><b>{row.kind === 'forex' ? 'Forex' : 'Money Transfer'}</b><br/><span className="text-xs text-gray-500">{row.name}</span></td><td className="p-3">{row.customer_name || row.customer}<br/><span className="text-xs text-gray-500">{row.portal_user}</span></td><td className="p-3">{row.currency} {Number(row.amount || 0).toLocaleString()}<br/><span className="text-xs text-gray-500">{row.details}</span></td><td className="p-3">{row.warehouse}</td><td className="p-3"><span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold">{row.status}</span></td><td className="p-3"><div className="flex justify-end gap-2">{['Pending', 'In Review'].includes(row.status) && <button disabled={busy === row.name} onClick={() => approve(row)} className="rounded-lg bg-[#B70000] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Approve</button>}{['Pending', 'In Review', 'Approved'].includes(row.status) && <button disabled={busy === row.name} onClick={() => create(row)} className="rounded-lg border border-[#B70000] px-3 py-1.5 text-xs font-semibold text-[#B70000] disabled:opacity-50">Create Transaction</button>}</div></td></tr>)}</tbody></table></div></main></div>;
}
