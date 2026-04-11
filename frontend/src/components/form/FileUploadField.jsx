import React, { useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import { useFormContext } from "react-hook-form";

export const FileUploadField = ({ name, label }) => {
  const { setValue, formState: { errors } } = useFormContext();

  const [preview, setPreview] = useState(null);

  const handleFile = (file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Max 10MB allowed");
      return;
    }

    setValue(name, file, { shouldValidate: true });
    setPreview(URL.createObjectURL(file));
  };

  return (
    <div>
      <label className="text-xs font-medium text-gray-500">
        {label} *
      </label>

      {preview ? (
        <div className="relative border rounded-lg mt-2">
          <img src={preview} className="max-h-40 mx-auto" />
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              setValue(name, null);
            }}
            className="absolute top-2 right-2"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <input
          type="file"
          onChange={(e) => handleFile(e.target.files[0])}
          className="mt-2"
        />
      )}

      {errors[name] && (
        <p className="text-red-500 text-xs mt-1">
          {errors[name].message}
        </p>
      )}
    </div>
  );
};