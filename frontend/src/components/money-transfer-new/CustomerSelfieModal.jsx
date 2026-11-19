import React, { useState, useRef, useEffect, useCallback } from "react";
import { Camera, X, RefreshCw, CheckCircle2, AlertCircle, MapPin, Eye } from "lucide-react";

export default function CustomerSelfieModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [facingMode, setFacingMode] = useState("user");
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [capturedPreview, setCapturedPreview] = useState(null);
  const [blinkAttested, setBlinkAttested] = useState(false);
  const [locationConsent, setLocationConsent] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage("");
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not supported by your browser.");
      }
      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setIsActive(true);
    } catch (err) {
      console.warn("Camera start error:", err);
      setErrorMessage(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera permission denied. Please allow camera access in your browser settings."
          : err.name === "NotFoundError" || err.name === "DevicesNotFoundError"
          ? "No camera found on this device."
          : err.message || "Failed to start camera."
      );
      setIsActive(false);
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (isOpen) {
      setCapturedBlob(null);
      setCapturedPreview(null);
      setBlinkAttested(false);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const requestGps = () => {
    if (!navigator.geolocation) {
      setErrorMessage("GPS location is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setLocationData({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          capturedAt: new Date().toISOString(),
        });
      },
      (err) => {
        setIsLocating(false);
        console.warn("GPS error:", err);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleCaptureSnapshot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setErrorMessage("Camera is still warming up. Please wait a second and try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    // Mirror image if front-facing camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setErrorMessage("Failed to encode snapshot image.");
          return;
        }
        setCapturedBlob(blob);
        setCapturedPreview(URL.createObjectURL(blob));
        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  };

  const handleConfirmPhoto = () => {
    if (!capturedBlob) return;
    const filename = `customer_photo_${Date.now()}.jpg`;
    const file = new File([capturedBlob], filename, { type: "image/jpeg" });
    onCapture({
      file,
      previewUrl: capturedPreview,
      location: locationData,
      blinkAttested,
    });
    onClose();
  };

  const handleRetake = () => {
    setCapturedBlob(null);
    setCapturedPreview(null);
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-[#E00000] flex items-center justify-center font-bold">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Live Customer Photo</h3>
              <p className="text-xs text-gray-400">Capture customer identity verification photo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="p-6 flex flex-col items-center">
          <div className="relative w-full aspect-4/3 bg-gray-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
            {capturedPreview ? (
              <img
                src={capturedPreview}
                alt="Captured Snapshot"
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                />
                {/* Face Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-64 border-2 border-dashed border-white/60 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
                </div>
              </>
            )}

            {!isActive && !capturedPreview && !errorMessage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 gap-2">
                <RefreshCw size={24} className="animate-spin text-[#E00000]" />
                <span className="text-xs font-medium">Starting camera...</span>
              </div>
            )}

            {errorMessage && (
              <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-gray-900/90 text-white gap-3">
                <AlertCircle size={32} className="text-amber-400" />
                <p className="text-xs text-gray-200 max-w-xs">{errorMessage}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl bg-white text-gray-900 font-bold text-xs hover:bg-gray-100 transition"
                >
                  Retry Camera
                </button>
              </div>
            )}
          </div>

          {/* Guided Checklist (Blink & Location) */}
          <div className="w-full mt-4 space-y-2.5">
            <label className="flex items-start gap-2.5 text-xs text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={blinkAttested}
                onChange={(e) => setBlinkAttested(e.target.checked)}
                className="mt-0.5 rounded text-[#E00000] focus:ring-[#E00000]"
              />
              <span className="flex items-center gap-1.5">
                <Eye size={13} className="text-gray-400 shrink-0" />
                Customer followed guided blink instruction (Liveness prompt)
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={locationConsent}
                onChange={(e) => {
                  setLocationConsent(e.target.checked);
                  if (e.target.checked && !locationData) {
                    requestGps();
                  }
                }}
                className="mt-0.5 rounded text-[#E00000] focus:ring-[#E00000]"
              />
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-gray-400 shrink-0" />
                Capture branch GPS coordinates with registration photo
              </span>
            </label>

            {locationConsent && (
              <div className="text-[11px] text-gray-500 pl-6 flex items-center gap-1.5">
                {isLocating ? (
                  <span className="flex items-center gap-1 text-amber-600">
                    <RefreshCw size={10} className="animate-spin" /> Acquiring coordinates...
                  </span>
                ) : locationData ? (
                  <span className="text-green-700 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Coordinates tagged ({locationData.latitude.toFixed(4)}, {locationData.longitude.toFixed(4)})
                  </span>
                ) : (
                  <span className="text-gray-400">GPS location optional</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          {!capturedPreview ? (
            <>
              <button
                type="button"
                onClick={handleToggleFacingMode}
                className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition flex items-center gap-1.5"
                title="Switch camera"
              >
                <RefreshCw size={13} />
                <span>Switch Cam</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCaptureSnapshot}
                  disabled={!isActive}
                  className="px-5 py-2.5 rounded-xl bg-[#E00000] text-white text-xs font-bold hover:bg-[#c00000] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
                >
                  <Camera size={14} />
                  <span>Capture Photo</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition flex items-center gap-1.5"
              >
                <RefreshCw size={13} />
                <span>Retake</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPhoto}
                  className="px-5 py-2.5 rounded-xl bg-[#E00000] text-white text-xs font-bold hover:bg-[#c00000] transition flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 size={14} />
                  <span>Use This Photo</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
