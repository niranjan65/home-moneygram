import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  Upload,
  RefreshCw,
  Trash2,
  User,
  AlertCircle,
  X,
  SwitchCamera,
  Eye,
} from "lucide-react";
import { buildApiUrl } from "../config/erpConfig";

/**
 * Resolves Frappe / local URLs to a valid src attribute for <img>
 */
export const resolveCustomerImageUrl = (url) => {
  if (!url) return "";
  if (
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }
  return buildApiUrl(url);
};

/**
 * Robustly requests user media with progressive constraint fallback
 */
async function requestWebcamStream(mode = "user") {
  // Check secure context
  const isSecure = typeof window !== "undefined" ? window.isSecureContext : true;
  
  // Find available getUserMedia implementation
  const getUM =
    navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices) ||
    navigator.getUserMedia?.bind(navigator) ||
    navigator.webkitGetUserMedia?.bind(navigator) ||
    navigator.mozGetUserMedia?.bind(navigator);

  if (!getUM) {
    if (!isSecure && typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      throw new Error(
        "Web camera access requires a secure connection (HTTPS) or localhost. Please access this page over HTTPS."
      );
    }
    throw new Error("Web camera is not supported in this browser.");
  }

  // Attempt 1: Ideal facingMode and resolution
  try {
    return await getUM({
      video: {
        facingMode: { ideal: mode },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
  } catch (err1) {
    console.warn("Camera attempt 1 (ideal resolution) failed, retrying...", err1?.name || err1);
  }

  // Attempt 2: Simple facingMode
  try {
    return await getUM({
      video: { facingMode: mode },
      audio: false,
    });
  } catch (err2) {
    console.warn("Camera attempt 2 (facingMode) failed, retrying...", err2?.name || err2);
  }

  // Attempt 3: Generic video device (works on all webcams)
  return await getUM({
    video: true,
    audio: false,
  });
}

export const CustomerPhotoCard = ({
  customerImageUrl,
  customerImageFile,
  onImageChange,
  onImageRemove,
  disabled = false,
  customerFound = false,
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [facingMode, setFacingMode] = useState("user");
  const [availableCameras, setAvailableCameras] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [activeStream, setActiveStream] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      streamRef.current = null;
    }
    setActiveStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsInitializing(false);
  }, []);

  // Check available video devices
  const checkCameras = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = devices.filter((d) => d.kind === "videoinput");
      setAvailableCameras(videoDevs);
    } catch (_) {}
  }, []);

  // Sync stream to video element whenever video element or stream updates
  useEffect(() => {
    if (isCameraActive && activeStream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = activeStream;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((playErr) => {
          console.warn("Video play error:", playErr);
        });
      }
    }
  }, [isCameraActive, activeStream]);

  // Start live webcam stream
  const startCamera = async (mode = facingMode) => {
    if (disabled) return;
    setCameraError("");
    setIsInitializing(true);
    stopCameraStream();

    try {
      const stream = await requestWebcamStream(mode);

      streamRef.current = stream;
      setActiveStream(stream);
      setIsCameraActive(true);
      setIsInitializing(false);

      checkCameras();
    } catch (err) {
      console.error("Camera start error:", err);
      let msg = err.message || "Unable to access web camera.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Camera permission was denied. Please allow camera access in your browser address bar/settings or upload an image file.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "No web camera was detected on this device. Please upload an image file instead.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        msg = "Camera is currently in use by another application or browser tab. Please close other apps using the camera and try again.";
      } else if (err.name === "OverconstrainedError") {
        msg = "The requested camera resolution is not supported by your device.";
      }
      setCameraError(msg);
      stopCameraStream();
    }
  };

  // Flip / switch camera if multiple available
  const handleSwitchCamera = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture current video frame to canvas -> file
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const width = video.videoWidth || video.clientWidth || 640;
    const height = video.videoHeight || video.clientHeight || 480;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw the current video frame
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const filename = `customer_photo_${Date.now()}.jpg`;
        const file = new File([blob], filename, { type: "image/jpeg" });
        const previewUrl = URL.createObjectURL(blob);
        onImageChange(file, previewUrl);
        stopCameraStream();
      },
      "image/jpeg",
      0.92
    );
  };

  // Handle standard file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please choose a valid image file (PNG, JPG, JPEG, WEBP).");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    onImageChange(file, previewUrl);

    // Reset input so re-selecting the same file triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(file);
      onImageChange(file, previewUrl);
    } else if (file) {
      alert("Please drop a valid image file.");
    }
  };

  // Cleanup camera stream when component unmounts
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  const hasPhoto = Boolean(customerImageUrl);
  const isPendingUpload = Boolean(customerImageFile);

  return (
    <div className="rounded-3xl border border-gray-100 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-6 sm:p-7 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E00000]/10 flex items-center justify-center text-[#E00000]">
            <Camera size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">Customer Photo</h3>
            <p className="text-[11px] text-gray-400">
              Live web camera or file upload
            </p>
          </div>
        </div>

        {hasPhoto ? (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              isPendingUpload
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-green-50 text-green-700 border-green-200"
            }`}
          >
            {isPendingUpload ? "New Photo" : "Existing Photo"}
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 border border-gray-200">
            No Photo
          </span>
        )}
      </div>

      {/* Camera Error Message */}
      {cameraError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
          <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Camera Notice</p>
            <p className="text-[11px] mt-0.5">{cameraError}</p>
          </div>
          <button
            type="button"
            onClick={() => setCameraError("")}
            className="text-red-400 hover:text-red-600 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* MAIN CONTENT AREA */}
      {isCameraActive || isInitializing ? (
        /* ── CAMERA ACTIVE VIEW ── */
        <div className="flex flex-col gap-3">
          <div className="relative w-full aspect-4/3 max-h-64 rounded-2xl overflow-hidden bg-black flex items-center justify-center border-2 border-[#E00000]/40 shadow-inner">
            {isInitializing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-900/80 text-white z-10">
                <RefreshCw size={24} className="animate-spin text-[#E00000]" />
                <span className="text-xs font-medium">Opening webcam...</span>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Framing Guide (Face Oval) */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-36 h-48 border-2 border-dashed border-white/60 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
            </div>

            {/* Live Indicator */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white tracking-wider uppercase border border-white/20">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live Camera
            </div>

            {/* Switch Camera Button (if supported) */}
            {availableCameras.length > 1 && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition cursor-pointer"
                title="Switch Camera"
              >
                <SwitchCamera size={14} />
              </button>
            )}
          </div>

          {/* Shutter / Cancel Controls */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={stopCameraStream}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <X size={14} /> Cancel
            </button>

            <button
              type="button"
              onClick={handleCapturePhoto}
              disabled={isInitializing}
              className="flex-2 px-5 py-2.5 rounded-xl bg-[#E00000] hover:bg-[#c70000] text-white text-xs font-bold shadow-md shadow-red-500/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Camera size={15} /> Capture Photo
            </button>
          </div>
        </div>
      ) : hasPhoto ? (
        /* ── PHOTO PRESENT (PREVIEW) ── */
        <div className="flex flex-col gap-3">
          <div className="relative group w-full aspect-4/3 max-h-56 rounded-2xl overflow-hidden bg-gray-50 border border-gray-200/80 shadow-sm flex items-center justify-center">
            <img
              src={resolveCustomerImageUrl(customerImageUrl)}
              alt="Customer"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if image path is broken
                e.target.style.display = "none";
              }}
            />

            {/* Quick Actions Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs">
              <a
                href={resolveCustomerImageUrl(customerImageUrl)}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg transition"
                title="View Full Size"
              >
                <Eye size={15} />
              </a>
              {!disabled && (
                <button
                  type="button"
                  onClick={onImageRemove}
                  className="p-2.5 bg-red-600/90 hover:bg-red-600 text-white rounded-full shadow-lg transition cursor-pointer"
                  title="Remove Photo"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {!disabled && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => startCamera()}
                className="px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Camera size={13} className="text-[#E00000]" /> Retake
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Upload size={13} className="text-gray-500" /> Upload New
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── NO PHOTO PLACEHOLDER ── */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-5 text-center flex flex-col items-center justify-center gap-3 transition ${
            dragActive
              ? "border-[#E00000] bg-red-50/50"
              : "border-gray-200/90 bg-gray-50/60 hover:border-gray-300"
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-gray-100 flex items-center justify-center text-gray-400">
            <User size={22} />
          </div>

          <div>
            <p className="text-xs font-bold text-gray-700">
              {customerFound
                ? "No photo attached to customer"
                : "No customer photo attached"}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Capture live with webcam or upload an image file
            </p>
          </div>

          {!disabled && (
            <div className="grid grid-cols-2 gap-2 w-full mt-1">
              <button
                type="button"
                onClick={() => startCamera()}
                className="px-3.5 py-2.5 rounded-xl bg-[#E00000] hover:bg-[#c70000] text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Camera size={14} /> Live Camera
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Upload size={14} className="text-gray-500" /> Upload File
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerPhotoCard;
