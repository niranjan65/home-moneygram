import React, { useEffect, useState, useMemo } from 'react';
import {
  X,
  Eye,
  FileText,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  AlertCircle,
  File as FileIcon,
} from 'lucide-react';

/**
 * Helper to determine file info, mime type, and preview URL.
 */
export function getDocumentFileInfo(attachment) {
  if (!attachment) {
    return {
      hasFile: false,
      fileName: '',
      fileSizeFormatted: '',
      isImage: false,
      isPdf: false,
      mimeType: '',
      previewUrl: '',
    };
  }

  let fileName = '';
  let fileSize = 0;
  let mimeType = '';
  let previewUrl = '';

  const isBrowserFile =
    typeof window !== 'undefined' &&
    typeof window.File !== 'undefined' &&
    attachment instanceof window.File;

  if (isBrowserFile) {
    fileName = attachment.name;
    fileSize = attachment.size;
    mimeType = attachment.type || '';
    try {
      previewUrl = URL.createObjectURL(attachment);
    } catch {
      previewUrl = '';
    }
  } else if (typeof attachment === 'string' && attachment.trim()) {
    fileName = attachment.split('/').pop()?.split('?')[0] || 'document';
    previewUrl = attachment;
    // Guess mimeType from string/url
    if (attachment.startsWith('data:image/')) {
      mimeType = attachment.substring(5, attachment.indexOf(';'));
    } else if (attachment.startsWith('data:application/pdf')) {
      mimeType = 'application/pdf';
    }
  }

  const cleanName = fileName.toLowerCase();
  const isPdf =
    mimeType === 'application/pdf' ||
    cleanName.endsWith('.pdf');

  const isImage =
    mimeType.startsWith('image/') ||
    cleanName.endsWith('.png') ||
    cleanName.endsWith('.jpg') ||
    cleanName.endsWith('.jpeg') ||
    cleanName.endsWith('.webp') ||
    cleanName.endsWith('.gif') ||
    cleanName.endsWith('.svg') ||
    cleanName.endsWith('.bmp');

  let fileSizeFormatted = '';
  if (fileSize > 0) {
    if (fileSize >= 1024 * 1024) {
      fileSizeFormatted = `${(fileSize / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      fileSizeFormatted = `${(fileSize / 1024).toFixed(0)} KB`;
    }
  }

  return {
    hasFile: Boolean(previewUrl),
    fileName: fileName || 'Uploaded Document',
    fileSizeFormatted,
    isImage,
    isPdf,
    mimeType,
    previewUrl,
  };
}

/**
 * DocumentPreviewModal component for previewing images and PDFs.
 */
export default function DocumentPreviewModal({
  isOpen = true,
  onClose,
  document: docItem, // aliased to docItem so it does not shadow global window.document
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loadError, setLoadError] = useState(false);

  const fileInfo = useMemo(() => {
    if (!docItem?.attachment) return null;
    return getDocumentFileInfo(docItem.attachment);
  }, [docItem?.attachment]);

  // Clean up blob URL created for modal
  useEffect(() => {
    return () => {
      const isBrowserFile =
        typeof window !== 'undefined' &&
        typeof window.File !== 'undefined' &&
        docItem?.attachment instanceof window.File;

      if (
        isBrowserFile &&
        fileInfo?.previewUrl &&
        fileInfo.previewUrl.startsWith('blob:')
      ) {
        URL.revokeObjectURL(fileInfo.previewUrl);
      }
    };
  }, [docItem?.attachment, fileInfo?.previewUrl]);

  // Reset zoom & rotation whenever a new document is opened
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setLoadError(false);
    }
  }, [isOpen, docItem]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while modal is active
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.document?.body) {
      const originalStyle = window.document.body.style.overflow;
      window.document.body.style.overflow = 'hidden';
      return () => {
        window.document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen || !fileInfo?.hasFile) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDownload = () => {
    if (!fileInfo.previewUrl) return;
    const link = window.document.createElement('a');
    link.href = fileInfo.previewUrl;
    link.download = fileInfo.fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-preview-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-white z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              fileInfo.isPdf
                ? 'bg-red-50 text-[#E00000] border border-red-200'
                : fileInfo.isImage
                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {fileInfo.isPdf ? (
                <FileText size={20} />
              ) : fileInfo.isImage ? (
                <Eye size={20} />
              ) : (
                <FileIcon size={20} />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  id="document-preview-title"
                  className="text-h3 font-bold text-gray-900 truncate max-w-[260px] sm:max-w-md"
                  title={fileInfo.fileName}
                >
                  {fileInfo.fileName}
                </h3>
                {docItem?.document_type && (
                  <span className="shrink-0 px-2.5 py-0.5 rounded-full text-overline font-semibold uppercase tracking-wider bg-red-50 text-[#E00000] border border-red-200">
                    {docItem.document_type}
                  </span>
                )}
              </div>
              <p className="text-caption text-gray-500 mt-0.5 flex items-center gap-2">
                <span>
                  {fileInfo.isPdf
                    ? 'PDF Document'
                    : fileInfo.isImage
                    ? 'Image File'
                    : 'Document'}
                </span>
                {fileInfo.fileSizeFormatted && (
                  <>
                    <span>•</span>
                    <span className="font-mono">{fileInfo.fileSizeFormatted}</span>
                  </>
                )}
                {docItem?.notes && (
                  <>
                    <span>•</span>
                    <span className="truncate italic text-gray-400 max-w-[200px]">
                      Note: “{docItem.notes}”
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons on header right */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Image zoom & rotate controls */}
            {fileInfo.isImage && !loadError && (
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-0.5 gap-0.5 mr-1">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  title="Zoom Out (-)"
                  className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white transition disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-caption font-mono font-bold px-1.5 text-gray-700 min-w-[42px] text-center tnum">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  title="Zoom In (+)"
                  className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white transition disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  title="Rotate 90°"
                  className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white transition cursor-pointer"
                >
                  <RotateCw size={16} />
                </button>
                {(zoom !== 1 || rotation !== 0) && (
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    title="Reset view"
                    className="p-1.5 rounded-lg text-gray-600 hover:text-[#E00000] hover:bg-white transition cursor-pointer"
                  >
                    <RotateCcw size={15} />
                  </button>
                )}
              </div>
            )}

            {/* Open in new tab */}
            <a
              href={fileInfo.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open full size in new tab"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-label font-semibold transition shadow-2xs cursor-pointer"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">Open</span>
            </a>

            {/* Download */}
            <button
              type="button"
              onClick={handleDownload}
              title="Download file"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-label font-semibold transition shadow-2xs cursor-pointer"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Save</span>
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              title="Close preview (Esc)"
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition cursor-pointer ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── MODAL BODY: PREVIEW VIEWPORT ── */}
        <div className="relative flex-1 min-h-[350px] sm:min-h-[500px] max-h-[72vh] overflow-auto bg-slate-950 flex items-center justify-center p-4 select-none">
          {loadError ? (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-white/95 rounded-2xl max-w-md shadow-lg">
              <AlertCircle size={40} className="text-amber-500 mb-3" />
              <h4 className="font-bold text-gray-900 text-h3 mb-1">
                Unable to display preview directly
              </h4>
              <p className="text-caption text-gray-500 mb-4 leading-relaxed">
                The browser could not render this document inline. You can still download or view it directly in a new tab.
              </p>
              <a
                href={fileInfo.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E00000] hover:bg-[#c70000] text-white text-label font-semibold transition shadow-md"
              >
                <ExternalLink size={14} /> Open in new tab
              </a>
            </div>
          ) : fileInfo.isImage ? (
            /* IMAGE PREVIEW */
            <div
              className="relative flex items-center justify-center w-full h-full min-h-[350px] transition-transform duration-150 ease-out"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
            >
              <img
                src={fileInfo.previewUrl}
                alt={fileInfo.fileName}
                onError={() => setLoadError(true)}
                className="max-w-full max-h-[66vh] object-contain rounded-lg shadow-2xl transition-all"
              />
            </div>
          ) : fileInfo.isPdf ? (
            /* PDF PREVIEW */
            <div className="w-full h-full min-h-[500px] flex flex-col bg-white rounded-xl overflow-hidden shadow-2xl">
              <iframe
                src={`${fileInfo.previewUrl}#toolbar=1&navpanes=0`}
                title={fileInfo.fileName}
                className="w-full flex-1 min-h-[520px] border-0 rounded-xl bg-white"
                onError={() => setLoadError(true)}
              />
            </div>
          ) : (
            /* OTHER FILE TYPE FALLBACK */
            <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl max-w-md shadow-lg">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 mb-4">
                <FileIcon size={32} />
              </div>
              <h4 className="font-bold text-gray-900 text-h3 mb-1">
                {fileInfo.fileName}
              </h4>
              <p className="text-caption text-gray-500 mb-4">
                Direct inline preview is not supported for this file format ({fileInfo.mimeType || 'binary'}).
              </p>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E00000] hover:bg-[#c70000] text-white text-label font-semibold transition shadow-md cursor-pointer"
              >
                <Download size={14} /> Download File
              </button>
            </div>
          )}
        </div>

        {/* ── FOOTER BAR ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50 text-caption text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="font-medium text-gray-700">Ready for teller verification</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 font-semibold text-label text-gray-700 transition cursor-pointer shadow-2xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
