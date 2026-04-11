import { useState, useCallback } from "react";
import { useUser } from "../context/UserContext";

export const useERPFileUpload = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const loginUser = useUser();

  // Frappe builds a filesystem path from the filename.
  // Only allow alphanumeric + underscore to avoid server path errors.
  const sanitizeFilename = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const baseName = file.name
      .replace(/\.[^/.]+$/, '')       // remove extension
      .replace(/[^a-zA-Z0-9]/g, '_') // replace ALL non-alphanumeric with _
      .replace(/_+/g, '_')           // collapse consecutive underscores
      .replace(/^_|_$/g, '')         // trim leading/trailing underscores
      || 'upload';                    // fallback if name becomes empty
    // Add timestamp to guarantee uniqueness and avoid collisions
    const safeName = `${baseName}_${Date.now()}.${ext}`;
    console.log('[RBF DEBUG] sanitizeFilename:', file.name, '→', safeName);
    return new File([file], safeName, { type: file.type });
  };

  const uploadFile = useCallback(async (file, options = {}) => {
    if (!file) {
      setError("No file provided");
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const {
        isPrivate = 0,
        doctype = "Currency Exchange For Customer",
      } = options;

      // Sanitize filename to avoid Frappe server path resolution errors.
      const safeFile = sanitizeFilename(file);
      console.log('[RBF DEBUG] Uploading safeFile:', safeFile.name, safeFile.size, safeFile.type);

      const formData = new FormData();
      formData.append("file", safeFile);
      formData.append("is_private", isPrivate);

      const response = await fetch(
        "https://mhmoneyexpress.anantdv.com/api/method/upload_file",
        {
          method: "POST",
          headers: {
            Authorization: `token ${loginUser?.user?.api_key}:${loginUser?.user?.api_secret}`,
          },
          body: formData,
        }
      );

      // Always read the body first so we can log the real Frappe error
      const responseText = await response.text();
      console.log('[RBF DEBUG] upload_file response status:', response.status);
      console.log('[RBF DEBUG] upload_file response body:', responseText);

      if (!response.ok) {
        // Try to parse a Frappe-style error for a readable message
        try {
          const errJson = JSON.parse(responseText);
          const detail = errJson?.exc || errJson?._error_message || JSON.stringify(errJson);
          throw new Error(`Server ${response.status}: ${detail}`);
        } catch (_) {
          throw new Error(`Server ${response.status}: ${responseText.slice(0, 400)}`);
        }
      }

      const data = JSON.parse(responseText);

      if (!data?.message?.file_url) {
        console.warn('[RBF DEBUG] Missing file_url in response:', data);
        throw new Error("Invalid ERP response — no file_url returned");
      }

      console.log('[RBF DEBUG] Upload success → file_url:', data.message.file_url);
      return data.message.file_url;
    } catch (err) {
      console.error('[RBF DEBUG] uploadFile error:', err.message);
      setError(err.message || "Upload failed");
      return null;
    } finally {
      setLoading(false);
    }
  }, [loginUser]);

  return {
    uploadFile,
    loading,
    error,
  };
};