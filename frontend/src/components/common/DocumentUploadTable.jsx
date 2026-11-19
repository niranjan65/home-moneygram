import React, { useEffect, useState, useMemo, useRef } from 'react';
import { sessionFetch } from '../../api/sessionClient.js';
import { useERPFileUpload } from '../../hooks/useERPFileUpload';
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  Camera,
  Eye,
  AlertTriangle,
  CheckCircle2,
  X,
  Calendar,
  Hash,
  Shield,
  UploadCloud,
  FileCheck2,
  Loader2,
  Edit2,
} from 'lucide-react';
import CustomerSelfieModal from '../CustomerSelfieModal';
import DocumentPreviewModal from '../DocumentPreviewModal';

export const DOCUMENT_CATEGORIES = [
  {
    value: 'PROOF_OF_IDENTITY',
    label: 'Proof of Identity',
    documents: [
      { value: 'Passport', label: 'Passport' },
      { value: "Driver's Licence", label: "Driver's Licence" },
      { value: 'National ID Card', label: 'National ID Card' },
      { value: 'Voter ID Card', label: 'Voter ID Card' },
      { value: 'TIN Card', label: 'TIN Card / FRCS Joint Card' },
      { value: 'Government ID', label: 'Official Government ID' },
    ],
  },
  {
    value: 'PROOF_OF_ADDRESS',
    label: 'Proof of Address',
    documents: [
      { value: 'Utility Bill', label: 'Utility Bill (Electricity / Water)' },
      { value: 'Bank Statement', label: 'Bank Statement' },
      { value: 'Tenancy Agreement', label: 'Tenancy / Lease Agreement' },
      { value: 'Government Letter', label: 'Official Government Letter' },
      { value: 'Proof of Address', label: 'Other Proof of Address' },
    ],
  },
  {
    value: 'TRAVEL_SUPPORTING',
    label: 'Travel & Supporting',
    documents: [
      { value: 'Ticket', label: 'Travel / Flight Ticket' },
      { value: 'Source of Funds Declaration', label: 'Source of Funds Evidence' },
      { value: 'Invoice', label: 'Commercial Invoice' },
      { value: 'Other', label: 'Other Supporting Document' },
    ],
  },
  {
    value: 'PHOTO',
    label: 'Photo',
    documents: [
      { value: 'Customer Photo', label: 'Customer Photograph / Portrait' },
    ],
  },
];

// Document Type Pills definition matching new-document-layout.html
const PILL_OPTIONS = [
  { label: 'Passport', value: 'Passport', category: 'Proof of Identity', requiresDocNum: true, requiresExpiry: true },
  { label: 'Driver’s licence', value: "Driver's Licence", category: 'Proof of Identity', requiresDocNum: true, requiresExpiry: true },
  { label: 'National ID', value: 'National ID Card', category: 'Proof of Identity', requiresDocNum: true, requiresExpiry: true },
  { label: 'Proof of address', value: 'Proof of Address', category: 'Proof of Address', requiresDocNum: false, requiresExpiry: false },
  { label: 'Other', value: 'Other', category: 'Travel & Supporting', requiresDocNum: false, requiresExpiry: false },
];

const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getIdExpiryStatus = (rawDate) => {
  if (!rawDate) return { isExpired: false, daysDiff: null };
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return { isExpired: false, daysDiff: null };
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffTime = d.getTime() - todayMidnight.getTime();
  const daysDiff = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return {
    isExpired: daysDiff < 0,
    daysDiff,
  };
};

export default function DocumentUploadTable({
  rows = [],
  onChange,
  disabled = false,
  hideHeader = false,
  title = 'Identification Documents',
  subtitle = 'Passport, ID or other supporting identity document',
  defaultDocumentNumber = '',
}) {
  const { uploadFile: erpUploadFile } = useERPFileUpload();
  const [maxFileSize, setMaxFileSize] = useState(25 * 1024 * 1024); // 25 MB default
  const [warning, setWarning] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // null = adding new, number = editing row
  const [activeCameraIndex, setActiveCameraIndex] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Upload Form State (matching new-document-layout.html)
  const [selectedPill, setSelectedPill] = useState('Passport');
  const [uploadCategory, setUploadCategory] = useState('Proof of Identity');
  const [uploadDocType, setUploadDocType] = useState('Passport');
  const [subDocType, setSubDocType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadFile, setUploadFile] = useState(null); // File object or URL string
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const [isPreFilledNumber, setIsPreFilledNumber] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch max file size from ERPNext
  useEffect(() => {
    const controller = new AbortController();
    sessionFetch('/api/method/frappe.core.api.file.get_max_file_size', {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        const size = Number(data.message);
        if (Number.isFinite(size) && size > 0 && !controller.signal.aborted) {
          setMaxFileSize(size);
        }
      })
      .catch(() => { });
    return () => controller.abort();
  }, []);

  // Update object URL when selected file changes
  useEffect(() => {
    if (!uploadFile) {
      setFilePreviewUrl('');
      return;
    }
    if (typeof uploadFile === 'string') {
      setFilePreviewUrl(uploadFile);
      return;
    }
    try {
      const previewUrl = URL.createObjectURL(uploadFile);
      setFilePreviewUrl(previewUrl);
      return () => URL.revokeObjectURL(previewUrl);
    } catch {
      setFilePreviewUrl('');
    }
  }, [uploadFile]);

  // Handle Pill Selection
  const handlePillSelect = (pill) => {
    setSelectedPill(pill.label);
    setUploadCategory(pill.category);
    setUploadDocType(pill.value);
    setSubDocType('');
  };

  // Open modal for new document
  const handleOpenAddModal = () => {
    setEditingIndex(null);
    setSelectedPill('Passport');
    setUploadCategory('Proof of Identity');
    setUploadDocType('Passport');
    setSubDocType('');

    // Pre-fill document number if provided
    if (defaultDocumentNumber) {
      setDocumentNumber(defaultDocumentNumber);
      setIsPreFilledNumber(true);
    } else {
      setDocumentNumber('');
      setIsPreFilledNumber(false);
    }

    setIssueDate('');
    setExpiryDate('');
    setNotes('');
    setUploadFile(null);
    setFilePreviewUrl('');
    setWarning('');
    setIsSubmitting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowModal(true);
  };

  // Open modal to edit existing document
  const handleOpenEditModal = (row, index) => {
    setEditingIndex(index);
    // Find matching pill or fallback
    const pill = PILL_OPTIONS.find((p) => p.value === row.document_type || p.label === row.document_type);
    if (pill) {
      setSelectedPill(pill.label);
    } else {
      setSelectedPill('Other');
    }
    setUploadCategory(row.document_category || 'Proof of Identity');
    setUploadDocType(row.document_type || 'Passport');
    setSubDocType(row.document_type || '');
    setDocumentNumber(row.document_number || '');
    setIsPreFilledNumber(false);
    setIssueDate(row.issue_date || '');
    setExpiryDate(row.expiry_date || '');
    setNotes(row.notes || '');
    setUploadFile(row.attachment || null);
    setWarning('');
    setIsSubmitting(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingIndex(null);
    setUploadFile(null);
    setFilePreviewUrl('');
    setWarning('');
    setIsSubmitting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFilePicked = (file) => {
    if (!file) return;
    if (maxFileSize && file.size > maxFileSize) {
      setWarning(
        `“${file.name}” exceeds maximum allowed size of ${(maxFileSize / (1024 * 1024)).toFixed(1)} MB.`
      );
      return;
    }
    setWarning('');
    setUploadFile(file);
  };

  const handleCameraCapture = async ({ file }) => {
    if (file) {
      if (activeCameraIndex === 'modal') {
        handleFilePicked(file);
      } else if (typeof activeCameraIndex === 'number' && activeCameraIndex >= 0) {
        try {
          const uploadedUrl = await erpUploadFile(file, { isPrivate: 1 });
          const updated = rows.map((r, i) =>
            i === activeCameraIndex
              ? { ...r, attachment: uploadedUrl || file, file_name: file.name }
              : r
          );
          onChange(updated);
        } catch (_) {
          const updated = rows.map((r, i) =>
            i === activeCameraIndex
              ? { ...r, attachment: file, file_name: file.name }
              : r
          );
          onChange(updated);
        }
      }
    }
    setActiveCameraIndex(null);
  };

  const handleRemoveRow = (index) => {
    if (typeof onChange === 'function') {
      const nextRows = (rows || []).filter((_, i) => i !== index);
      onChange(nextRows);
    }
    if (editingIndex === index) {
      handleCloseModal();
    }
  };

  // Submit modal (Add or Update)
  const handleSubmitDocument = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();

    const activeDocType = subDocType || uploadDocType || selectedPill;
    const activePill = PILL_OPTIONS.find((p) => p.label === selectedPill) || PILL_OPTIONS[0];

    // Validation
    if (activePill.requiresDocNum && !documentNumber.trim()) {
      setWarning('Document number is required for passports and identity documents.');
      return;
    }

    if (!uploadFile) {
      setWarning('Please attach a document file or take a live photo.');
      return;
    }

    const expiryStatus = getIdExpiryStatus(expiryDate);
    if (expiryStatus.isExpired) {
      setWarning('Expired documents cannot be added. Please provide a valid document.');
      return;
    }

    setIsSubmitting(true);
    setWarning('');

    try {
      let attachmentUrl = uploadFile;
      let finalFileName = uploadFile?.name || `${activeDocType}.pdf`;

      if (uploadFile instanceof File) {
        attachmentUrl = await erpUploadFile(uploadFile, { isPrivate: 1 });
        if (!attachmentUrl) {
          throw new Error('Upload failed. Please check your network connection and try again.');
        }
        finalFileName = uploadFile.name;
      } else if (typeof uploadFile === 'string') {
        finalFileName = uploadFile.split('/').pop() || `${activeDocType}.pdf`;
      }

      const docRow = {
        document_category: uploadCategory,
        document_type: activeDocType,
        document_number: documentNumber.trim(),
        issue_date: issueDate || '',
        expiry_date: expiryDate || '',
        attachment: attachmentUrl,
        file_name: finalFileName,
        notes: notes.trim(),
      };

      if (editingIndex !== null && editingIndex >= 0) {
        const updated = [...rows];
        updated[editingIndex] = docRow;
        onChange(updated);
      } else {
        onChange([...rows, docRow]);
      }

      handleCloseModal();
    } catch (err) {
      setWarning(err.message || 'Failed to upload document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Current Expiry status for modal
  const uploadExpiryStatus = getIdExpiryStatus(expiryDate);
  const activePill = PILL_OPTIONS.find((p) => p.label === selectedPill) || PILL_OPTIONS[0];
  const isDocNumberRequired = activePill.requiresDocNum;
  const isFormValid =
    Boolean(uploadFile) &&
    (!isDocNumberRequired || Boolean(documentNumber.trim())) &&
    !uploadExpiryStatus.isExpired;

  // File size / type formatted for filled state
  const getFileMeta = () => {
    if (!uploadFile) return { name: '', meta: '', isPdf: false };
    if (uploadFile instanceof File) {
      const sizeMb = (uploadFile.size / (1024 * 1024)).toFixed(2);
      const isPdf = uploadFile.type === 'application/pdf' || uploadFile.name.toLowerCase().endsWith('.pdf');
      return {
        name: uploadFile.name,
        meta: `${sizeMb} MB · ${isPdf ? 'PDF document' : 'Image file'}`,
        isPdf,
      };
    }
    const name = String(uploadFile).split('/').pop() || 'document.pdf';
    const isPdf = name.toLowerCase().endsWith('.pdf');
    return {
      name,
      meta: `Attached · ${isPdf ? 'PDF document' : 'Image document'}`,
      isPdf,
    };
  };

  const fileMeta = getFileMeta();

  return (
    <div id="exchange-documents" className="w-full min-w-0">
      {/* Scoped CSS Styles to guarantee 100% fidelity to new-document-layout.html */}
      <style>{`
        .doc-card { background: #fff; border: 1px solid #E3E6EB; border-radius: 16px; }
        .doc-l { display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px; color: #14171F; font-family: Inter, system-ui, sans-serif; }
        .doc-l i { font-style: normal; font-weight: 400; color: #5B6270; }
        .doc-l b { color: #C8102E; }
        .doc-inp { width: 100%; height: 48px; border: 1px solid #BFC5CE; border-radius: 10px; padding: 0 14px; font: 500 15px Inter, system-ui, sans-serif; color: #14171F; background: #fff; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
        .doc-inp:focus { border-color: #C8102E; box-shadow: 0 0 0 3px rgba(200, 16, 46, 0.1); }
        .doc-help { font-size: 13px; color: #5B6270; margin-top: 6px; font-family: Inter, system-ui, sans-serif; }
        .doc-chip { display: inline-flex; align-items: center; height: 32px; padding: 0 12px; border-radius: 999px; font-size: 13px; font-weight: 600; background: #EEF0F3; color: #2C323D; font-family: Inter, system-ui, sans-serif; }
        .doc-chip.ok { background: #E3F3EA; color: #0B5A33; }
        .doc-chip.warn { background: #FFF3D6; color: #7A4B00; }
        .doc-chip.err { background: #FDE8E8; color: #9B1C1C; }
        .doc-pill { height: 40px; padding: 0 16px; border: 1.5px solid #CDD2DA; border-radius: 999px; background: #fff; font: 600 14px Inter, system-ui, sans-serif; color: #2C323D; cursor: pointer; transition: all 0.15s; }
        .doc-pill:hover { border-color: #9499A3; background: #F8F9FA; }
        .doc-pill.sel { border-color: #C8102E; background: #FDF1F3; color: #9E0C24; }
        .doc-btn { height: 48px; padding: 0 24px; border-radius: 12px; border: 0; background: #C8102E; color: #fff; font: 600 15px Inter, system-ui, sans-serif; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.15s; }
        .doc-btn:hover:not(:disabled) { background: #9E0C24; }
        .doc-btn.ghost { background: #fff; color: #14171F; border: 1px solid #BFC5CE; }
        .doc-btn.ghost:hover:not(:disabled) { background: #F4F5F7; border-color: #9499A3; }
        .doc-btn.off { background: #E3E6EB; color: #4A5160; cursor: not-allowed; }
        .doc-lnk { border: 0; background: none; font: 600 14px Inter, system-ui, sans-serif; color: #C8102E; padding: 8px; cursor: pointer; border-radius: 6px; }
        .doc-lnk:hover { background: #FDF1F3; }
      `}</style>

      {/* Main Section Header Controls */}
      {!hideHeader && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-h3 font-bold text-ink font-sans">
              {title}
            </h3>
            <p className="text-caption text-muted mt-0.5">{subtitle}</p>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={handleOpenAddModal}
            className="doc-btn !h-10 !px-4 !text-label !rounded-xl !bg-[#C8102E] hover:!bg-[#9E0C24] text-white font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Plus size={15} />
            <span>Add Document</span>
          </button>
        </div>
      )}

      {/* ATTACHED DOCUMENTS LIST ON PAGE */}
      {!rows.length ? (
        <div className="doc-card border-2 border-dashed !border-[#CDD2DA] bg-[#FAFAFB] p-8 text-center rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF0F3] flex items-center justify-center text-gray-500 mx-auto mb-3">
            <Shield size={22} />
          </div>
          <h4 className="text-h3 font-bold text-ink mb-1 font-sans">
            No Identification Documents Attached Yet
          </h4>
          <p className="text-caption text-muted max-w-md mx-auto mb-5 leading-relaxed font-sans">
            Upload government identity documents, passport, proof of address, or supporting documents to proceed with KYC compliance.
          </p>
          <button
            type="button"
            disabled={disabled}
            onClick={handleOpenAddModal}
            className="doc-btn !h-11 !px-5 !text-label !rounded-xl !bg-[#C8102E] hover:!bg-[#9E0C24] text-white font-semibold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Add Identification Document</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-label font-semibold text-muted px-1">
            <span>Attached Documents ({rows.length})</span>
            <span className="text-caption font-normal text-muted">
              Verified for customer transaction
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {rows.map((row, index) => {
              const rowExpiry = getIdExpiryStatus(row.expiry_date);
              const fileName =
                row.file_name ||
                (typeof row.attachment === 'string'
                  ? row.attachment.split('/').pop()
                  : row.attachment?.name || '');

              return (
                <div
                  key={index}
                  className="doc-card p-4 sm:p-5 shadow-xs hover:border-gray-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  {/* Left Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${rowExpiry.isExpired
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-[#EEF0F3] text-gray-700 border-[#CDD2DA]'
                        }`}
                    >
                      <FileText size={18} strokeWidth={2} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="text-body font-semibold text-ink leading-snug">
                          {row.document_type || 'Document'}
                        </h4>

                        {row.document_category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-semibold bg-[#EEF0F3] text-[#2C323D]">
                            {row.document_category}
                          </span>
                        )}

                        {row.document_number && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-caption font-mono font-semibold bg-[#E3F3EA] text-[#0B5A33]">
                            <Hash size={11} />
                            {row.document_number}
                          </span>
                        )}

                        {rowExpiry.isExpired ? (
                          <span className="doc-chip err !h-6 !text-caption !px-2.5 animate-pulse font-semibold">
                            ⚠️ EXPIRED ({Math.abs(rowExpiry.daysDiff)}d ago)
                          </span>
                        ) : row.expiry_date ? (
                          <span
                            className={`doc-chip ${rowExpiry.daysDiff !== null && rowExpiry.daysDiff <= 30
                              ? 'warn'
                              : 'ok'
                              } !h-6 !text-caption !px-2.5`}
                          >
                            {rowExpiry.daysDiff !== null && rowExpiry.daysDiff <= 30
                              ? `Expires in ${rowExpiry.daysDiff} days`
                              : `Expires ${row.expiry_date}`}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-muted">
                        {row.issue_date && (
                          <span className="inline-flex items-center gap-1 text-caption">
                            <Calendar size={12} className="text-gray-400" />
                            Issued: <strong className="text-ink">{row.issue_date}</strong>
                          </span>
                        )}
                        {fileName && (
                          <span className="inline-flex items-center gap-1 text-caption truncate max-w-xs text-muted font-mono">
                            📎 {fileName}
                          </span>
                        )}
                        {row.notes && (
                          <span className="text-caption text-muted italic">
                            “{row.notes}”
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Preview Button */}
                    {row.attachment && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPreviewDoc(row);
                        }}
                        className="doc-btn ghost !h-9 !px-3 !text-label !rounded-lg inline-flex items-center gap-1 font-semibold"
                        title="Preview Document"
                      >
                        <Eye size={13} />
                        <span>Preview</span>
                      </button>
                    )}

                    {/* Edit button */}
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpenEditModal(row, index);
                      }}
                      className="p-2 rounded-lg border border-[#CDD2DA] text-gray-600 hover:text-[#C8102E] hover:border-red-300 bg-white hover:bg-red-50/20 transition-colors cursor-pointer shadow-2xs"
                      title="Edit Document Details"
                    >
                      <Edit2 size={14} />
                    </button>

                    {/* Camera capture / replace button */}
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveCameraIndex(index);
                      }}
                      className="p-2 rounded-lg border border-[#CDD2DA] text-gray-600 hover:text-[#C8102E] hover:border-red-300 bg-white hover:bg-red-50/20 transition-colors cursor-pointer shadow-2xs"
                      title="Replace file using live camera"
                    >
                      <Camera size={14} />
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveRow(index);
                      }}
                      className="p-2 rounded-lg border border-[#CDD2DA] text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer shadow-2xs"
                      title="Remove Document"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT DOCUMENT MODAL (100% Matching new-document-layout.html)       */}
      {/* ========================================================================= */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              handleCloseModal();
            }
          }}
        >
          <div
            className="doc-card w-full max-w-[760px] overflow-hidden my-auto shadow-2xl relative animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && !isSubmitting) {
                handleCloseModal();
              }
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '24px 28px',
                borderBottom: '1px solid #E3E6EB',
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#14171F' }}>
                  {editingIndex !== null ? 'Edit identification document' : 'Add identification document'}
                </h2>
                <div className="doc-help" style={{ marginTop: '4px' }}>
                  Passport, ID or other supporting identity document
                </div>
              </div>
              <button
                type="button"
                aria-label="Close"
                disabled={isSubmitting}
                onClick={handleCloseModal}
                style={{
                  width: '40px',
                  height: '40px',
                  border: '1px solid #BFC5CE',
                  borderRadius: '10px',
                  background: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  color: '#14171F',
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#14171F"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18"></path>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 28px' }}>
              {/* Document Type Pills */}
              <span className="doc-l">
                Document type <b>*</b>
              </span>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginBottom: selectedPill === 'Proof of address' || selectedPill === 'Other' ? '14px' : '24px',
                }}
              >
                {PILL_OPTIONS.map((pill) => {
                  const isSelected = selectedPill === pill.label;
                  return (
                    <button
                      key={pill.label}
                      type="button"
                      onClick={() => handlePillSelect(pill)}
                      className={`doc-pill ${isSelected ? 'sel' : ''}`}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>

              {/* Sub-type selection if Proof of address or Other is selected */}
              {selectedPill === 'Proof of address' && (
                <div className="mb-5 flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                  <span className="font-semibold text-gray-600 shrink-0">Address Proof:</span>
                  <select
                    value={subDocType || 'Utility Bill'}
                    onChange={(e) => setSubDocType(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-800 outline-none focus:ring-1 focus:ring-[#C8102E] flex-1 cursor-pointer"
                  >
                    <option value="Utility Bill">Utility Bill (Electricity / Water)</option>
                    <option value="Bank Statement">Bank Statement</option>
                    <option value="Tenancy Agreement">Tenancy / Lease Agreement</option>
                    <option value="Government Letter">Official Government Letter</option>
                    <option value="Proof of Address">Other Proof of Address</option>
                  </select>
                </div>
              )}

              {selectedPill === 'Other' && (
                <div className="mb-5 flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                  <span className="font-semibold text-gray-600 shrink-0">Specific Type:</span>
                  <select
                    value={subDocType || 'Ticket'}
                    onChange={(e) => setSubDocType(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-800 outline-none focus:ring-1 focus:ring-[#C8102E] flex-1 cursor-pointer"
                  >
                    <option value="Ticket">Travel / Flight Ticket</option>
                    <option value="Source of Funds Declaration">Source of Funds Evidence</option>
                    <option value="Invoice">Commercial Invoice</option>
                    <option value="Other">Other Supporting Document</option>
                  </select>
                </div>
              )}

              {/* 2-Column Grid Layout */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                  gap: '24px',
                  width: '100%',
                  minWidth: 0,
                }}
              >
                {/* Left Column: Form Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
                  {/* Document Number */}
                  <label style={{ display: 'block' }}>
                    <span className="doc-l">
                      Document number {isDocNumberRequired ? <b>*</b> : <i>(optional)</i>}
                    </span>
                    <input
                      className="doc-inp"
                      placeholder="e.g. P1234567"
                      value={documentNumber}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        setDocumentNumber(e.target.value);
                        setIsPreFilledNumber(false);
                      }}
                    />
                    <div className="doc-help">
                      {isPreFilledNumber
                        ? 'Pre-filled from the customer ID section'
                        : isDocNumberRequired
                          ? 'Required for passports and national IDs'
                          : 'Optional for supporting documents'}
                    </div>
                  </label>

                  {/* Issue Date */}
                  <label style={{ display: 'block' }}>
                    <span className="doc-l">
                      Issue date <i>(optional)</i>
                    </span>
                    <input
                      type="date"
                      className="doc-inp"
                      placeholder="YYYY-MM-DD"
                      max={formatLocalDate(new Date())}
                      value={issueDate}
                      disabled={isSubmitting}
                      onChange={(e) => setIssueDate(e.target.value)}
                    />
                  </label>

                  {/* Expiry Date */}
                  <label style={{ display: 'block' }}>
                    <span className="doc-l">
                      Expiry date {activePill.requiresExpiry ? <b>*</b> : <i>(optional)</i>}
                    </span>
                    <input
                      type="date"
                      className="doc-inp"
                      placeholder="YYYY-MM-DD"
                      value={expiryDate}
                      disabled={isSubmitting}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                    {expiryDate ? (
                      <div style={{ marginTop: '8px' }}>
                        {uploadExpiryStatus.isExpired ? (
                          <span className="doc-chip err">
                            ⚠️ Expired {Math.abs(uploadExpiryStatus.daysDiff)} days ago
                          </span>
                        ) : uploadExpiryStatus.daysDiff !== null && uploadExpiryStatus.daysDiff <= 30 ? (
                          <span className="doc-chip warn">
                            Expires in {uploadExpiryStatus.daysDiff} days
                          </span>
                        ) : (
                          <span className="doc-chip ok">
                            Valid (Expires in {uploadExpiryStatus.daysDiff} days)
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="doc-help">Expired documents cannot be added</div>
                    )}
                  </label>

                  {/* Notes */}
                  <label style={{ display: 'block' }}>
                    <span className="doc-l">
                      Notes <i>(optional)</i>
                    </span>
                    <input
                      className="doc-inp"
                      placeholder="e.g. Original sighted at counter"
                      value={notes}
                      disabled={isSubmitting}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </label>
                </div>

                {/* Right Column: Document File Dropzone / Filled State Preview */}
                <div style={{ minWidth: 0, width: '100%' }}>
                  <span className="doc-l">
                    Document file <b>*</b>
                  </span>

                  {!uploadFile ? (
                    /* EMPTY STATE: Dropzone */
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        handleFilePicked(e.dataTransfer.files?.[0]);
                      }}
                      style={{
                        height: '292px',
                        border: isDragging ? '2px dashed #C8102E' : '1.5px dashed #BFC5CE',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        textAlign: 'center',
                        padding: '16px',
                        background: isDragging ? '#FDF1F3' : '#FAFAFB',
                        transition: 'all 0.15s ease',
                        width: '100%',
                        minWidth: 0,
                      }}
                    >
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#5B6270"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 16V5M7 10l5-5 5 5M5 19h14"></path>
                      </svg>
                      <strong style={{ fontSize: '15px', color: '#14171F' }}>
                        {isDragging ? 'Drop file to upload' : 'Drop a file here'}
                      </strong>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => fileInputRef.current?.click()}
                          className="doc-btn"
                          style={{ height: '44px', padding: '0 18px' }}
                        >
                          Upload file
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => setActiveCameraIndex('modal')}
                          className="doc-btn ghost"
                          style={{ height: '44px', padding: '0 18px' }}
                        >
                          Take photo
                        </button>
                      </div>
                      <div className="doc-help" style={{ margin: 0, textAlign: 'center' }}>
                        PDF, PNG or JPG · up to {(maxFileSize / (1024 * 1024)).toFixed(0)} MB
                        <br />
                        You can add more pages after the first
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="sr-only"
                        disabled={isSubmitting}
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => handleFilePicked(e.target.files?.[0])}
                      />
                    </div>
                  ) : (
                    /* FILLED STATE: File preview card with tools */
                    <div
                      style={{
                        border: '1px solid #CDD2DA',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        background: '#fff',
                        width: '100%',
                        minWidth: 0,
                      }}
                    >
                      {/* Top bar with file name and replace/remove links */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          padding: '10px 12px',
                          borderBottom: '1px solid #E3E6EB',
                          width: '100%',
                          minWidth: 0,
                          boxSizing: 'border-box',
                        }}
                      >
                        <div style={{ flex: '1 1 0%', minWidth: 0, overflow: 'hidden' }}>
                          <strong
                            title={fileMeta.name}
                            style={{
                              fontSize: '14px',
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              color: '#14171F',
                            }}
                          >
                            {fileMeta.name}
                          </strong>
                          <div
                            className="doc-help"
                            style={{
                              margin: 0,
                              fontSize: '12px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {fileMeta.meta}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => fileInputRef.current?.click()}
                            className="doc-lnk"
                            style={{ whiteSpace: 'nowrap', padding: '6px 8px', flexShrink: 0 }}
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => {
                              setUploadFile(null);
                              setFilePreviewUrl('');
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="doc-lnk"
                            style={{ whiteSpace: 'nowrap', padding: '6px 8px', flexShrink: 0 }}
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="sr-only"
                          disabled={isSubmitting}
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => handleFilePicked(e.target.files?.[0])}
                        />
                      </div>

                      {/* Preview Box */}
                      <div
                        style={{
                          height: '210px',
                          background: '#EEF0F3',
                          display: 'grid',
                          placeItems: 'center',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        {fileMeta.isPdf ? (
                          /* PDF Placeholder / Card illustration */
                          <div
                            style={{
                              width: '140px',
                              height: '175px',
                              background: '#fff',
                              boxShadow: '0 2px 8px rgba(20,23,31,.18)',
                              padding: '14px',
                              borderRadius: '4px',
                              display: 'flex',
                              flexDirection: 'column',
                            }}
                          >
                            <div
                              style={{
                                width: '44px',
                                height: '54px',
                                background: '#D5D9E0',
                                marginBottom: '10px',
                                borderRadius: '2px',
                              }}
                            />
                            <div
                              style={{
                                height: '6px',
                                background: '#D5D9E0',
                                marginBottom: '8px',
                                borderRadius: '1px',
                              }}
                            />
                            <div
                              style={{
                                height: '6px',
                                width: '70%',
                                background: '#D5D9E0',
                                marginBottom: '8px',
                                borderRadius: '1px',
                              }}
                            />
                            <div
                              style={{
                                height: '6px',
                                width: '85%',
                                background: '#D5D9E0',
                                marginBottom: '8px',
                                borderRadius: '1px',
                              }}
                            />
                            <div
                              style={{
                                height: '6px',
                                width: '55%',
                                background: '#D5D9E0',
                                borderRadius: '1px',
                              }}
                            />
                          </div>
                        ) : (
                          /* Image Preview */
                          <img
                            src={filePreviewUrl}
                            alt="Document Preview"
                            style={{
                              maxHeight: '175px',
                              maxWidth: '85%',
                              objectFit: 'contain',
                              boxShadow: '0 2px 8px rgba(20,23,31,.18)',
                              borderRadius: '4px',
                              background: '#fff',
                            }}
                          />
                        )}
                      </div>

                      {/* Tool Button: Preview */}
                      <div style={{ display: 'flex', gap: '8px', padding: '10px 12px', borderTop: '1px solid #E3E6EB' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (filePreviewUrl || uploadFile) {
                              setPreviewDoc({
                                document_type: subDocType || uploadDocType,
                                attachment: uploadFile,
                                file_name: fileMeta.name,
                              });
                            }
                          }}
                          className="doc-btn ghost"
                          style={{ height: '36px', padding: '0 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Eye size={14} />
                          <span>Preview</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {warning && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-label font-normal text-danger flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0 text-danger" />
                  <span>{warning}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '20px 28px',
                borderTop: '1px solid #E3E6EB',
                background: '#FAFAFB',
              }}
            >
              <span className="doc-help" style={{ margin: 0, flex: 1 }}>
                {uploadExpiryStatus.isExpired ? (
                  <span style={{ color: '#C8102E', fontWeight: 600 }}>
                    ⚠️ Expired documents cannot be added
                  </span>
                ) : isFormValid ? (
                  <span style={{ color: '#0B5A33', fontWeight: 600 }}>
                    Ready to add
                  </span>
                ) : !uploadFile ? (
                  'Attach a file and enter the document number to continue'
                ) : (
                  'Enter the document number to continue'
                )}
              </span>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCloseModal}
                className="doc-btn ghost"
                style={{ borderColor: 'transparent', background: 'none' }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!isFormValid || isSubmitting}
                onClick={handleSubmitDocument}
                className={`doc-btn ${!isFormValid || isSubmitting ? 'off' : ''}`}
                aria-disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Uploading…</span>
                  </>
                ) : (
                  <span>{editingIndex !== null ? 'Save changes' : 'Add document'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webcam Selfie / Photo Capture Modal */}
      <CustomerSelfieModal
        isOpen={activeCameraIndex !== null}
        onClose={() => setActiveCameraIndex(null)}
        onCapture={handleCameraCapture}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewDoc !== null}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />
    </div>
  );
}
