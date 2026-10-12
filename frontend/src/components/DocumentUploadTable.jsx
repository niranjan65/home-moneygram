import React, { useId } from 'react';
import { FileText, Plus, Trash2, UploadCloud } from 'lucide-react';

const inputStyle = 'h-12 w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E00000] focus:bg-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60';
const documentTypes = ['ID', 'Additional Info', 'Tax Clearance', 'Passport', 'Government ID', "Driver's Licence", 'Voter ID Card', 'Ticket', 'RBF Document', 'Annual Compliance', 'Other'];

export default function DocumentUploadTable({ rows = [], onChange, disabled = false }) {
  const typesId = useId();
  const update = (index, field, value) => onChange(rows.map((row, i) => i === index ? { ...row, [field]: value } : row));

  return (
    <section className="mt-8" aria-label="Documents">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-700">Documents</h3>
          <p className="mt-1 text-sm text-gray-400">Upload ID, additional information, and supporting documents.</p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange([...rows, { document_type: '', attachment: '', notes: '' }])}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#E00000] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#c70000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E00000] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={16} aria-hidden="true" /> Add Document
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200/80 bg-white">
        <table className="w-full min-w-[760px] table-fixed text-left text-sm">
          <colgroup>
            <col style={{ width: '24%' }} />
            <col style={{ width: '36%' }} />
            <col style={{ width: '26%' }} />
            <col style={{ width: '14%' }} />
          </colgroup>
          <thead className="bg-gray-50/80 text-xs font-bold uppercase tracking-wide text-gray-400">
            <tr>
              <th scope="col" className="px-4 py-3">Document Type</th>
              <th scope="col" className="px-4 py-3">Document</th>
              <th scope="col" className="px-4 py-3">Notes</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const fileName = row.attachment instanceof File
                ? row.attachment.name
                : typeof row.attachment === 'string' ? row.attachment.split('/').pop() : '';
              return (
                <tr key={index} className="border-t border-gray-100">
                  <td className="px-4 py-4 align-middle">
                    <input aria-label={`Document type ${index + 1}`} list={typesId} value={row.document_type || ''} placeholder="Select or enter type" disabled={disabled} onChange={e => update(index, 'document_type', e.target.value)} className={inputStyle} />
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <div className="flex min-w-0 items-center gap-2">
                    <label title={fileName || 'Choose a supporting document'} className={`group relative flex h-12 min-w-0 flex-1 items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-3 transition focus-within:border-[#E00000] focus-within:ring-2 focus-within:ring-[#E00000]/20 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-[#E00000]'}`}>
                      <UploadCloud size={20} aria-hidden="true" className="shrink-0 text-gray-400 group-hover:text-[#E00000]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-gray-600">{fileName || 'Click to upload'}</span>
                      </span>
                      <input aria-label={`Upload document ${index + 1}`} type="file" disabled={disabled} onChange={e => { const file = e.target.files?.[0]; if (file) update(index, 'attachment', file); }} className="sr-only" />
                    </label>
                    {typeof row.attachment === 'string' && row.attachment && (
                      <a href={row.attachment} target="_blank" rel="noopener noreferrer" aria-label={`View document ${index + 1}`} title="View document" className="inline-flex h-12 w-10 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-[#E00000] transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E00000]">
                        <FileText size={16} aria-hidden="true" />
                      </a>
                    )}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <input aria-label={`Document notes ${index + 1}`} value={row.notes || ''} placeholder="Optional note" disabled={disabled} onChange={e => update(index, 'notes', e.target.value)} className={inputStyle} />
                  </td>
                  <td className="px-4 py-4 text-right align-middle">
                    <button type="button" aria-label={`Remove document ${index + 1}`} disabled={disabled} onClick={() => onChange(rows.filter((_, i) => i !== index))} className="inline-flex h-12 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-red-100 bg-red-50 px-3 py-3 text-xs font-semibold text-[#E00000] transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E00000] disabled:cursor-not-allowed disabled:opacity-60">
                      <Trash2 size={14} aria-hidden="true" /> Remove
                    </button>
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr><td colSpan={4} className="px-6 py-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E00000]/10 text-[#E00000]"><FileText size={22} aria-hidden="true" /></div>
                <p className="text-sm font-semibold text-gray-600">No documents added</p>
                <p className="mt-1 text-xs text-gray-400">Click Add Document to upload your files.</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <datalist id={typesId}>{documentTypes.map(type => <option key={type} value={type} />)}</datalist>
    </section>
  );
}
